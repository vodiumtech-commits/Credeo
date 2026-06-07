import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { AdminVendorsClient, type AdminVendorRow } from "@/components/ui/admin-vendors-client";
import type { VendorStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PLAN_COLORS: Record<string, string> = {
  STARTER:    "text-vodium-cream/50 bg-vodium-slate border-vodium-slate",
  GROWTH:     "text-vodium-gold bg-vodium-gold/10 border-vodium-gold/20",
  CAMPUS_PRO: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};
const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Campus Pro",
};

export default async function AdminVendorsPage() {
  const [vendors, planCounts] = await Promise.all([
    prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        university: { select: { shortName: true, name: true } },
        subscription: { select: { plan: true, status: true, monthlyAmount: true } },
      },
    }),
    prisma.vendorSubscription.groupBy({
      by: ["plan", "status"],
      _count: { _all: true },
      _sum:   { monthlyAmount: true },
    }),
  ]);

  const vendorIds = vendors.map((v) => v.id);

  const [creditAggs, studentAggs] = await Promise.all([
    prisma.credit.groupBy({
      by:    ["vendorId"],
      where: { vendorId: { in: vendorIds } },
      _count: { _all: true },
      _sum:   { amount: true },
    }),
    prisma.credit.findMany({
      where:    { vendorId: { in: vendorIds } },
      select:   { vendorId: true, studentId: true },
      distinct: ["vendorId", "studentId"],
    }),
  ]);

  const aggMap = new Map(creditAggs.map((a) => [a.vendorId, a]));
  const studentCountMap = new Map<string, number>();
  for (const { vendorId } of studentAggs) {
    studentCountMap.set(vendorId, (studentCountMap.get(vendorId) ?? 0) + 1);
  }

  const activeVendors   = vendors.filter((v) => v.status === "ACTIVE" && v.subscription?.status !== "TRIAL").length;
  const trialVendors    = vendors.filter((v) => v.subscription?.status === "TRIAL").length;
  const inactiveVendors = vendors.filter((v) => v.status !== "ACTIVE").length;
  const totalVendors    = vendors.length;

  const mrr    = planCounts.filter((p) => p.status === "ACTIVE").reduce((s, p) => s + Number(p._sum.monthlyAmount ?? 0), 0);
  const avgMrr = activeVendors > 0 ? Math.round(mrr / activeVendors) : 0;

  const planSummary = (["STARTER", "GROWTH", "CAMPUS_PRO"] as const).map((plan) => {
    const rows       = planCounts.filter((p) => p.plan === plan);
    const count      = rows.reduce((s, p) => s + p._count._all, 0);
    const mrrContrib = rows.filter((p) => p.status === "ACTIVE").reduce((s, p) => s + Number(p._sum.monthlyAmount ?? 0), 0);
    return { plan, count, mrrContrib };
  });

  // Serialise for client
  const rows: AdminVendorRow[] = vendors.map((v) => {
    const agg = aggMap.get(v.id);
    return {
      id:           v.id,
      businessName: v.businessName,
      ownerName:    v.ownerName,
      phone:        v.phone,
      status:       v.status as VendorStatus,
      university:   { shortName: v.university.shortName ?? null, name: v.university.name },
      subscription: v.subscription
        ? { plan: v.subscription.plan, status: v.subscription.status, monthlyAmount: Number(v.subscription.monthlyAmount) }
        : null,
      totalTracked:  Number(agg?._sum.amount ?? 0),
      creditsLogged: agg?._count._all ?? 0,
      studentsCount: studentCountMap.get(v.id) ?? 0,
      subMrr:        v.subscription?.status === "ACTIVE" ? Number(v.subscription.monthlyAmount ?? 0) : 0,
      createdAt:     v.createdAt.toISOString(),
    };
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1">Vendor management</p>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">
          {totalVendors} Vendor{totalVendors !== 1 ? "s" : ""}
        </h1>
        <p className="text-vodium-cream/40 text-sm mt-0.5">
          {activeVendors} active · {trialVendors} on trial · {inactiveVendors} inactive
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active vendors",  value: String(activeVendors), sub: "Paying" },
          { label: "Trial vendors",   value: String(trialVendors),  sub: "60-day free" },
          { label: "Total MRR",       value: formatNaira(mrr),      sub: "Recurring monthly" },
          { label: "Avg rev/vendor",  value: formatNaira(avgMrr),   sub: "Per active vendor" },
        ].map((k) => (
          <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
            <p className="text-vodium-cream/40 text-xs">{k.label}</p>
            <p className="font-serif text-2xl text-vodium-gold mt-1">{k.value}</p>
            <p className="text-vodium-cream/30 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {planSummary.map((p) => (
          <div key={p.plan} className={`border rounded-xl p-5 ${PLAN_COLORS[p.plan]}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3">{PLAN_LABELS[p.plan]}</p>
            <p className="font-serif text-3xl mb-1">{p.count}</p>
            <p className="text-xs opacity-70">{formatNaira(p.mrrContrib)}/mo contribution</p>
          </div>
        ))}
      </div>

      {/* Interactive vendor table */}
      <AdminVendorsClient vendors={rows} />
    </div>
  );
}
