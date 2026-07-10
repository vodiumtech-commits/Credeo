import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getVendorSession } from "@/lib/session";
import type { OrganizationRole } from "@prisma/client";

const ORG_WIDE_ROLES: OrganizationRole[] = ["OWNER", "HQ_ADMIN", "FINANCE", "AUDITOR"];
const WRITE_ROLES: OrganizationRole[] = ["OWNER", "HQ_ADMIN", "BRANCH_MANAGER", "BRANCH_STAFF", "FINANCE"];
// Tenant administration (branches, domains, WhatsApp channels, staff) is HQ-level only.
const ORG_ADMIN_ROLES: OrganizationRole[] = ["OWNER", "HQ_ADMIN"];

export async function requireTenantContext() {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  let organizationId = vendor.organizationId;
  let branchId = vendor.branchId;

  if (!organizationId) {
    const membership = await prisma.organizationMembership.findFirst({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: "asc" },
    });
    organizationId = membership?.organizationId ?? null;
    branchId = branchId ?? membership?.branchId ?? null;
  }

  if (!organizationId) {
    return {
      vendor,
      organization: null,
      branch: null,
      membership: null,
      organizationId: null,
      branchId: null,
      role: null,
      canSeeAllBranches: false,
      canWrite: false,
      canManageOrg: false,
    };
  }

  const [organization, membership] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: { branches: { orderBy: { name: "asc" } } },
    }),
    prisma.organizationMembership.findFirst({
      where: { organizationId, vendorId: vendor.id },
    }),
  ]);

  if (!organization) notFound();

  const role = membership?.role ?? "OWNER";
  const canSeeAllBranches = ORG_WIDE_ROLES.includes(role);

  return {
    vendor,
    organization,
    branch: branchId ? organization.branches.find((branch) => branch.id === branchId) ?? null : null,
    membership,
    organizationId,
    branchId,
    role,
    canSeeAllBranches,
    canWrite: WRITE_ROLES.includes(role),
    canManageOrg: ORG_ADMIN_ROLES.includes(role),
  };
}

export function hasOrgAdminAccess(ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  return Boolean(ctx.organizationId) && ctx.canManageOrg;
}

export function scopedBranchWhere(ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  if (!ctx.organizationId) return { vendorId: ctx.vendor.id };
  if (ctx.canSeeAllBranches) return { organizationId: ctx.organizationId };
  return { organizationId: ctx.organizationId, branchId: ctx.branchId };
}

export function assertCanAccessBranch(
  ctx: Awaited<ReturnType<typeof requireTenantContext>>,
  branchId: string
) {
  if (canAccessBranch(ctx, branchId)) return;
  notFound();
}

export function assertCanWrite(ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  if (hasTenantWriteAccess(ctx)) return;
  notFound();
}

export function canAccessBranch(
  ctx: Awaited<ReturnType<typeof requireTenantContext>>,
  branchId: string
) {
  return ctx.canSeeAllBranches || ctx.branchId === branchId;
}

export function hasTenantWriteAccess(ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  return ctx.canWrite;
}

// Extending credit (approving a BNPL request) is a credit decision — limit it to
// managers/finance/owners, not general branch staff.
const CREDIT_APPROVER_ROLES: OrganizationRole[] = ["OWNER", "HQ_ADMIN", "BRANCH_MANAGER", "FINANCE"];

export function canApproveCredit(ctx: Awaited<ReturnType<typeof requireTenantContext>>) {
  return Boolean(ctx.organizationId) && ctx.role !== null && CREDIT_APPROVER_ROLES.includes(ctx.role);
}
