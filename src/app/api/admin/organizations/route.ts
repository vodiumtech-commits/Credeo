import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { promoteVendorToEnterpriseOrganization } from "@/lib/tenant";
import { sendOrganizationUpgradeEmail } from "@/lib/email/organization-upgrade";
import { ipFromRequest, writeAudit } from "@/lib/audit";

const branchSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(20).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(240).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
});

const promoteSchema = z.object({
  ownerVendorId: z.string().min(1),
  name: z.string().min(2).max(160),
  type: z.enum(["SUPERMARKET", "ENTERPRISE"]).default("SUPERMARKET"),
  trialDays: z.number().int().min(1).max(180).default(30),
  branches: z.array(branchSchema).min(1).max(25),
});

function requireSuperAdmin() {
  const admin = getAdminSession();
  return admin?.role === "SUPER_ADMIN";
}

export async function GET() {
  if (!requireSuperAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizations = await prisma.organization.findMany({
    include: {
      branches: { orderBy: { createdAt: "asc" } },
      vendors: {
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          phone: true,
          email: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
      },
      domains: true,
      whatsAppChannels: {
        select: { id: true, displayName: true, phoneNumber: true, phoneNumberId: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ organizations });
}

export async function POST(req: NextRequest) {
  const admin = getAdminSession();
  if (admin?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = promoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const organization = await promoteVendorToEnterpriseOrganization(parsed.data);
    await writeAudit({
      actorType: "admin",
      actorId: admin.id,
      action: "organization.promoted",
      entityType: "Organization",
      entityId: organization.id,
      metadata: {
        name: organization.name,
        type: organization.type,
        ownerVendorId: parsed.data.ownerVendorId,
        trialDays: parsed.data.trialDays,
        branchCount: parsed.data.branches.length,
      },
      ipAddress: ipFromRequest(req),
    });
    const owner = await prisma.vendor.findUnique({
      where: { id: parsed.data.ownerVendorId },
      select: { ownerName: true, email: true },
    });
    if (owner?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
      sendOrganizationUpgradeEmail({
        to: owner.email,
        ownerName: owner.ownerName,
        organizationName: organization.name,
        organizationType: organization.type,
        trialDays: parsed.data.trialDays,
        dashboardUrl: `${appUrl}/dashboard/supermarket`,
      }).catch((err) => console.error("[admin/organizations] upgrade email failed:", err));
    }
    return NextResponse.json({ ok: true, organization }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create organization";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
