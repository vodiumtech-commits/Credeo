import { prisma } from "@/lib/prisma";
import type { OrganizationPlan, OrganizationType, Vendor } from "@prisma/client";

const DEFAULT_VENDOR_TRIAL_DAYS = 60;
const DEFAULT_ENTERPRISE_TRIAL_DAYS = 30;

export function trialEndsAt(days = DEFAULT_VENDOR_TRIAL_DAYS): Date {
  return new Date(Date.now() + days * 86_400_000);
}

export function organizationTrialEndsAt(type: OrganizationType): Date {
  return trialEndsAt(type === "SOLO_VENDOR" ? DEFAULT_VENDOR_TRIAL_DAYS : DEFAULT_ENTERPRISE_TRIAL_DAYS);
}

export function slugifyTenantName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "tenant";
}

export async function createSoloOrganizationForVendor(vendor: Pick<Vendor, "id" | "businessName" | "phone" | "location" | "communityId" | "createdAt">) {
  const organizationId = `org_${vendor.id}`;
  const branchId = `branch_${vendor.id}`;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.organization.upsert({
      where: { id: organizationId },
      update: {},
      create: {
        id: organizationId,
        name: vendor.businessName,
        slug: `solo-${vendor.id}`,
        type: "SOLO_VENDOR",
        status: "TRIAL",
        plan: "STARTER",
        trialEndsAt: organizationTrialEndsAt("SOLO_VENDOR"),
        communityId: vendor.communityId,
        createdAt: vendor.createdAt,
        updatedAt: now,
      },
    });

    await tx.branch.upsert({
      where: { id: branchId },
      update: {},
      create: {
        id: branchId,
        organizationId,
        name: vendor.location ?? "Main Branch",
        code: "MAIN",
        phone: vendor.phone,
        address: vendor.location,
        status: "ACTIVE",
        createdAt: vendor.createdAt,
        updatedAt: now,
      },
    });

    await tx.vendor.update({
      where: { id: vendor.id },
      data: { organizationId, branchId },
    });

    await tx.organizationMembership.upsert({
      where: {
        organizationId_vendorId: {
          organizationId,
          vendorId: vendor.id,
        },
      },
      update: { branchId, role: "OWNER" },
      create: {
        id: `member_${vendor.id}`,
        organizationId,
        vendorId: vendor.id,
        branchId,
        role: "OWNER",
      },
    });
  });

  return { organizationId, branchId };
}

export async function createEnterpriseOrganization(input: {
  name: string;
  ownerVendorId: string;
  communityId?: string | null;
  type?: Extract<OrganizationType, "SUPERMARKET" | "ENTERPRISE">;
  plan?: OrganizationPlan;
  trialDays?: number;
  branches?: Array<{ name: string; code?: string; phone?: string; address?: string; city?: string; state?: string }>;
}) {
  const type = input.type ?? "SUPERMARKET";
  const baseSlug = slugifyTenantName(input.name);
  const organizationId = `org_${input.ownerVendorId}`;
  const trialEnd = trialEndsAt(input.trialDays ?? DEFAULT_ENTERPRISE_TRIAL_DAYS);
  const branches = input.branches?.length ? input.branches : [{ name: "Main Branch", code: "MAIN" }];

  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        id: organizationId,
        name: input.name,
        slug: `${baseSlug}-${input.ownerVendorId.slice(-6)}`,
        type,
        status: "TRIAL",
        plan: input.plan ?? "ENTERPRISE",
        trialEndsAt: trialEnd,
        communityId: input.communityId ?? null,
      },
    });

    const createdBranches: Array<{ id: string }> = [];
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      createdBranches.push(await tx.branch.create({
        data: {
          id: `branch_${input.ownerVendorId}_${i + 1}`,
          organizationId: org.id,
          name: branch.name,
          code: (branch.code ?? `BR${i + 1}`).trim().toUpperCase(),
          phone: branch.phone ?? null,
          address: branch.address ?? null,
          city: branch.city ?? null,
          state: branch.state ?? null,
        },
      }));
    }

    const mainBranch = createdBranches[0];
    await tx.vendor.update({
      where: { id: input.ownerVendorId },
      data: { organizationId: org.id, branchId: mainBranch?.id ?? null },
    });

    await tx.organizationMembership.create({
      data: {
        organizationId: org.id,
        vendorId: input.ownerVendorId,
        branchId: mainBranch?.id ?? null,
        role: "OWNER",
      },
    });

    return org;
  });

  return organization;
}

export async function promoteVendorToEnterpriseOrganization(input: {
  ownerVendorId: string;
  name: string;
  type?: Extract<OrganizationType, "SUPERMARKET" | "ENTERPRISE">;
  plan?: OrganizationPlan;
  trialDays?: number;
  branches: Array<{ name: string; code?: string; phone?: string; address?: string; city?: string; state?: string }>;
}) {
  const owner = await prisma.vendor.findUnique({
    where: { id: input.ownerVendorId },
    select: {
      id: true,
      businessName: true,
      phone: true,
      location: true,
      communityId: true,
      createdAt: true,
      organizationId: true,
    },
  });
  if (!owner) throw new Error("Owner vendor not found");

  if (!owner.organizationId) {
    await createSoloOrganizationForVendor(owner);
  }

  const freshOwner = await prisma.vendor.findUniqueOrThrow({
    where: { id: input.ownerVendorId },
    select: { organizationId: true },
  });
  const organizationId = freshOwner.organizationId;
  if (!organizationId) throw new Error("Could not create organization for owner");

  const type = input.type ?? "SUPERMARKET";
  const branches = input.branches.length ? input.branches : [{ name: "Main Branch", code: "MAIN" }];

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.update({
      where: { id: organizationId },
      data: {
        name: input.name,
        slug: `${slugifyTenantName(input.name)}-${input.ownerVendorId.slice(-6)}`,
        type,
        status: "TRIAL",
        plan: input.plan ?? "ENTERPRISE",
        trialEndsAt: trialEndsAt(input.trialDays ?? DEFAULT_ENTERPRISE_TRIAL_DAYS),
      },
    });

    let firstBranchId: string | null = null;
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      const code = (branch.code ?? `BR${i + 1}`).trim().toUpperCase();
      const saved = await tx.branch.upsert({
        where: {
          organizationId_code: {
            organizationId,
            code,
          },
        },
        update: {
          name: branch.name,
          phone: branch.phone ?? null,
          address: branch.address ?? null,
          city: branch.city ?? null,
          state: branch.state ?? null,
          status: "ACTIVE",
        },
        create: {
          organizationId,
          name: branch.name,
          code,
          phone: branch.phone ?? null,
          address: branch.address ?? null,
          city: branch.city ?? null,
          state: branch.state ?? null,
          status: "ACTIVE",
        },
      });
      if (!firstBranchId) firstBranchId = saved.id;
    }

    await tx.vendor.update({
      where: { id: input.ownerVendorId },
      data: { organizationId, branchId: firstBranchId },
    });

    await tx.organizationMembership.upsert({
      where: {
        organizationId_vendorId: {
          organizationId,
          vendorId: input.ownerVendorId,
        },
      },
      update: { branchId: firstBranchId, role: "OWNER" },
      create: {
        organizationId,
        vendorId: input.ownerVendorId,
        branchId: firstBranchId,
        role: "OWNER",
      },
    });

    await tx.credit.updateMany({
      where: { vendorId: input.ownerVendorId },
      data: { organizationId, branchId: firstBranchId },
    });

    return org;
  });
}
