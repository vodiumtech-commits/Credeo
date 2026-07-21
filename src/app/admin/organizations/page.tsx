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

  const supermarkets  = rows.filter((o) => o.type !== "SOLO_VENDOR").length;
  const solo          = rows.length - supermarkets;
  const totalBranches = rows.reduce((s, o) => s + o.branches.length, 0);
  const liveDomains   = rows.reduce((s, o) => s + o.domains.filter((d) => d.status === "VERIFIED").length, 0);
  const waChannels    = rows.reduce((s, o) => s + o.whatsAppChannels.length, 0);

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Admin</p>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">Organizations</h1>
        <p className="text-sm text-vodium-cream/45 mt-1">
          Promote solo vendors into supermarket organizations, manage branch readiness, domains, and WhatsApp channel status.
        </p>
      </div>

      {/* Summary strip — the shape of the tenant base at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Organizations", value: String(rows.length), sub: `${supermarkets} supermarket · ${solo} solo` },
          { label: "Branches", value: String(totalBranches), sub: "Across all organizations" },
          { label: "Verified domains", value: String(liveDomains), sub: "Custom store hosts" },
          { label: "WhatsApp channels", value: String(waChannels), sub: "Store-owned numbers" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/[0.06] bg-vodium-charcoal px-4 py-3.5">
            <p className="text-[11px] text-vodium-cream/40">{k.label}</p>
            <p className="font-serif text-2xl text-vodium-gold tabular-nums mt-1">{k.value}</p>
            <p className="text-[11px] text-vodium-cream/30 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <AdminOrganizationsClient organizations={rows} />
    </div>
  );
}
