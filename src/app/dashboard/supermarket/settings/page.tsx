import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasOrgAdminAccess, requireTenantContext } from "@/lib/tenant-context";
import { OrgSettingsClient } from "@/components/ui/org-settings-client";

export const dynamic = "force-dynamic";

export default async function OrgSettingsPage() {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId || !ctx.organization || ctx.organization.type === "SOLO_VENDOR") {
    redirect("/dashboard");
  }
  if (!hasOrgAdminAccess(ctx)) {
    redirect("/dashboard/supermarket");
  }

  const [branches, channels, members] = await Promise.all([
    prisma.branch.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.whatsAppChannel.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.organizationMembership.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        vendor: { select: { ownerName: true, email: true, phone: true, status: true, inviteToken: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <OrgSettingsClient
        organizationName={ctx.organization.name}
        subdomain={`${ctx.organization.slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vodiumledger.com"}`}
        branding={{
          name: ctx.organization.name,
          brandColor: ctx.organization.brandColor,
          logoUrl: ctx.organization.logoUrl,
        }}
        branches={branches.map((b) => ({
          id: b.id,
          name: b.name,
          code: b.code,
          phone: b.phone,
          address: b.address,
          city: b.city,
          state: b.state,
          status: b.status,
        }))}
        channels={channels.map((c) => ({
          id: c.id,
          displayName: c.displayName,
          phoneNumber: c.phoneNumber,
          phoneNumberId: c.phoneNumberId,
          status: c.status,
        }))}
        members={members.map((m) => ({
          id: m.id,
          name: m.vendor.ownerName,
          email: m.vendor.email,
          phone: m.vendor.phone,
          role: m.role,
          branchId: m.branchId,
          branchName: m.branch?.name ?? null,
          isSelf: m.vendorId === ctx.vendor.id,
          pending: Boolean(m.vendor.inviteToken) || m.vendor.status !== "ACTIVE",
        }))}
      />
    </div>
  );
}
