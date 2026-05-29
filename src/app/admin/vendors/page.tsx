import {
  Search, Store, Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { VendorRowMenu } from "@/components/ui/vendor-row-menu";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Campus Pro",
};

const PLAN_COLORS: Record<string, string> = {
  STARTER:    "text-vodium-cream/50 bg-vodium-slate border-vodium-slate",
  GROWTH:     "text-vodium-gold bg-vodium-gold/10 border-vodium-gold/20",
  CAMPUS_PRO: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default async function AdminVendorsPage() {
  const [vendors, planCounts] = await Promise.all([
    prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        university: { select: { shortName: true, name: true } },
        subscription: {
          select: { plan: true, status: true, monthlyAmount: true },
        },
        _count: {
          select: {
            credits: true,
            // count unique students via credits
          },
        },
      },
    }),

    // Plan breakdown
    prisma.vendorSubscription.groupBy({
      by: ["plan", "status"],
      _count: { _all: true },
      _sum: { monthlyAmount: true },
    }),
  ]);

  // Gather unique student counts and total tracked per vendor
  const vendorIds = vendors.map((v) => v.id);
  const creditAggs = await prisma.credit.groupBy({
    by: ["vendorId"],
    where: { vendorId: { in: vendorIds } },
    _count: { _all: true },
    _sum: { amount: true },
  });
  const aggMap = new Map(creditAggs.map((a) => [a.vendorId, a]));

  // Student counts per vendor (distinct)
  const studentAggs = await prisma.credit.findMany({
    where: { vendorId: { in: vendorIds } },
    select: { vendorId: true, studentId: true },
    distinct: ["vendorId", "studentId"],
  });
  const studentCountMap = new Map<string, number>();
  for (const { vendorId } of studentAggs) {
    studentCountMap.set(vendorId, (studentCountMap.get(vendorId) ?? 0) + 1);
  }

  // Computed stats
  const activeVendors = vendors.filter((v) => v.status === "ACTIVE" && v.subscription?.status !== "TRIAL").length;
  const trialVendors = vendors.filter((v) => v.subscription?.status === "TRIAL").length;
  const inactiveVendors = vendors.filter((v) => v.status !== "ACTIVE").length;
  const totalVendors = vendors.length;
  const mrr = planCounts
    .filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => sum + Number(p._sum.monthlyAmount ?? 0), 0);
  const avgMrr = activeVendors > 0 ? Math.round(mrr / activeVendors) : 0;

  // Plan summary
  const planSummary = (["STARTER", "GROWTH", "CAMPUS_PRO"] as const).map((plan) => {
    const rows = planCounts.filter((p) => p.plan === plan);
    const count = rows.reduce((s, p) => s + p._count._all, 0);
    const mrrContrib = rows
      .filter((p) => p.status === "ACTIVE")
      .reduce((s, p) => s + Number(p._sum.monthlyAmount ?? 0), 0);
    return { plan, count, mrrContrib };
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1">Vendor management</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">
            {totalVendors} Vendor{totalVendors !== 1 ? "s" : ""}
          </h1>
          <p className="text-vodium-cream/40 text-sm mt-0.5">
            {activeVendors} active · {trialVendors} on trial · {inactiveVendors} inactive
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active vendors",    value: String(activeVendors),      sub: "Paying" },
          { label: "Trial vendors",     value: String(trialVendors),        sub: "60-day free" },
          { label: "Total MRR",         value: formatNaira(mrr),            sub: "Recurring monthly" },
          { label: "Avg rev/vendor",    value: formatNaira(avgMrr),         sub: "Per active vendor" },
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

      {/* Vendor table */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
            <input
              type="search"
              placeholder="Search vendors by name, owner, or university…"
              className="w-full bg-vodium-slate border border-white/[0.06] rounded-lg pl-9 pr-4 py-2.5 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40 transition"
            />
          </div>
        </div>

        {/* Table head */}
        <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-black/20 text-[11px] font-medium text-vodium-cream/30 uppercase tracking-wider">
          <span className="col-span-3">Vendor</span>
          <span className="col-span-2">University</span>
          <span className="col-span-1 text-center">Students</span>
          <span className="col-span-2 text-right">Total tracked</span>
          <span className="col-span-1 text-right">MRR</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1 text-center">Plan</span>
          <span className="col-span-1 text-center" />
        </div>

        {/* Rows */}
        {vendors.length === 0 ? (
          <div className="px-6 py-16 text-center text-vodium-cream/25 text-sm">No vendors registered yet</div>
        ) : (
          vendors.map((v) => {
            const agg = aggMap.get(v.id);
            const totalTracked = Number(agg?._sum.amount ?? 0);
            const creditsLogged = agg?._count._all ?? 0;
            const studentsCount = studentCountMap.get(v.id) ?? 0;
            const subStatus = v.subscription?.status ?? "TRIAL";
            const plan = v.subscription?.plan ?? "STARTER";
            const subMrr = subStatus === "ACTIVE" ? Number(v.subscription?.monthlyAmount ?? 0) : 0;

            const statusBadge =
              subStatus === "TRIAL" ? "badge-trial"
              : v.status === "ACTIVE" ? "badge-active"
              : "badge-inactive";

            return (
              <div key={v.id} className="md:grid grid-cols-12 items-center px-6 py-4 table-row-dark border-t border-white/[0.04]">
                <div className="col-span-3 flex items-center gap-3 mb-2 md:mb-0">
                  <div className="w-8 h-8 rounded-lg bg-vodium-slate border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Store size={14} className="text-vodium-gold/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-vodium-cream truncate">{v.businessName}</p>
                    <p className="text-xs text-vodium-cream/35 mt-0.5">{v.ownerName}</p>
                  </div>
                </div>

                <div className="col-span-2 text-xs text-vodium-cream/50">
                  {v.university.shortName ?? v.university.name}
                </div>

                <div className="col-span-1 text-center">
                  <div className="inline-flex items-center gap-1 text-xs text-vodium-cream/60">
                    <Users size={11} /> {studentsCount}
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-sm font-semibold text-vodium-cream">{formatNaira(totalTracked)}</p>
                  <p className="text-[10px] text-vodium-cream/30 mt-0.5">{creditsLogged} credits</p>
                </div>

                <div className="col-span-1 text-right">
                  <p className={`text-sm font-medium ${subMrr > 0 ? "text-vodium-gold" : "text-vodium-cream/30"}`}>
                    {subMrr > 0 ? formatNaira(subMrr) : "Trial"}
                  </p>
                </div>

                <div className="col-span-1 flex justify-center">
                  <span className={`badge ${statusBadge} text-[10px]`}>
                    {subStatus === "TRIAL" ? "TRIAL" : v.status}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PLAN_COLORS[plan] ?? ""}`}>
                    {PLAN_LABELS[plan] ?? plan}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center">
                  <VendorRowMenu
                    vendorId={v.id}
                    businessName={v.businessName}
                    currentStatus={v.status}
                  />
                </div>
              </div>
            );
          })
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-vodium-cream/30">
          <span>Showing {vendors.length} of {totalVendors} vendors</span>
        </div>
      </div>
    </div>
  );
}
