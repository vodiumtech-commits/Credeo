import { prisma } from "@/lib/prisma";
import { AdminOrganizationsClient, type AdminOrganizationRow } from "@/components/ui/admin-organizations-client";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: {
      branches: { orderBy: { name: "asc" } },
      vendors: {
        select: { id: true, businessName: true, ownerName: true, phone: true, email: true },
        orderBy: { createdAt: "asc" },
      },
      domains: true,
      whatsAppChannels: true,
      _count: { select: { credits: true, bnplOrders: true, students: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const rows: AdminOrganizationRow[] = organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    type: org.type,
    status: org.status,
    plan: org.plan,
    branches: org.branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
    })),
    vendors: org.vendors,
    domains: org.domains.map((domain) => ({
      host: domain.host,
      status: domain.status,
    })),
    whatsAppChannels: org.whatsAppChannels.map((channel) => ({
      displayName: channel.displayName,
      status: channel.status,
    })),
    counts: {
      credits: org._count.credits,
      bnplOrders: org._count.bnplOrders,
      students: org._count.students,
    },
  }));

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Admin</p>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">Organizations</h1>
        <p className="text-sm text-vodium-cream/45 mt-1">
          Promote solo vendors into supermarket organizations, manage branch readiness, domains, and WhatsApp channel status.
        </p>
      </div>

      <AdminOrganizationsClient organizations={rows} />
    </div>
  );
}
