import { CreditCard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [
    creditAmounts,
    totalRepaid,
    activeSubs,
    totalCredits,
    paidCredits,
    writtenOffCredits,
    partialCredits,
    overdueCredits,
    monthlyCredits,
    scoreDistribution,
    topVendors,
    vendorTypeBreakdown,
  ] = await Promise.all([
    prisma.credit.aggregate({ _sum: { amount: true } }),
    prisma.repayment.aggregate({ _sum: { amount: true } }),

    prisma.vendorSubscription.findMany({
      where: { status: "ACTIVE" },
      select: { monthlyAmount: true },
    }),

    prisma.credit.count(),
    prisma.credit.count({ where: { status: "PAID" } }),
    prisma.credit.count({ where: { status: "WRITTEN_OFF" } }),
    prisma.credit.count({ where: { status: "PARTIALLY_PAID" } }),
    prisma.credit.count({ where: { status: "OVERDUE" } }),

    prisma.$queryRaw<Array<{ month: string; extended: number; recovered: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', c."createdAt"), 'Mon ''YY') AS month,
        COALESCE(SUM(c.amount), 0)::float AS extended,
        COALESCE(SUM(r_agg.total), 0)::float AS recovered
      FROM "Credit" c
      LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(r.amount), 0) AS total
        FROM "Repayment" r
        WHERE r."creditId" = c.id
      ) r_agg ON TRUE
      WHERE c."createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', c."createdAt")
      ORDER BY DATE_TRUNC('month', c."createdAt") ASC
    `,

    prisma.$queryRaw<Array<{ tier: string; count: bigint }>>`
      SELECT
        CASE
          WHEN "vodiumScore" >= 750 THEN 'excellent'
          WHEN "vodiumScore" >= 650 THEN 'good'
          WHEN "vodiumScore" >= 450 THEN 'fair'
          ELSE 'poor'
        END AS tier,
        COUNT(*) AS count
      FROM "Student"
      GROUP BY tier
    `,

    prisma.vendor.findMany({
      take: 5,
      orderBy: { credits: { _count: "desc" } },
      include: {
        community: { select: { shortName: true, name: true } },
        _count: { select: { credits: true } },
      },
    }),

    prisma.vendor.groupBy({
      by: ["vendorType"],
      _count: { _all: true },
      orderBy: { _count: { vendorType: "desc" } },
    }),
  ]);

  const mrr = activeSubs.reduce((s, sub) => s + Number(sub.monthlyAmount), 0);
  const arr = mrr * 12;
  const totalTracked = Number(creditAmounts._sum.amount ?? 0);
  const totalRecovered = Number(totalRepaid._sum.amount ?? 0);
  const repaymentRate = totalCredits > 0 ? Math.round((paidCredits / totalCredits) * 100) : 0;
  const defaultRate = totalCredits > 0 ? Math.round((writtenOffCredits / totalCredits) * 100) : 0;

  const chartMax = Math.max(...monthlyCredits.map((m) => m.extended), 1);

  const scoreMap: Record<string, { tier: string; color: string }> = {
    excellent: { tier: "Excellent (750–1000)", color: "#16A34A" },
    good:      { tier: "Good (650–749)",       color: "#C9A961" },
    fair:      { tier: "Fair (450–649)",        color: "#D97706" },
    poor:      { tier: "Poor (0–449)",          color: "#DC2626" },
  };
  const totalCustomersScored = scoreDistribution.reduce((s, r) => s + Number(r.count), 0);

  const vendorTypeLabels: Record<string, string> = {
    PROVISION_SHOP: "Provision Shop",
    FOOD_CANTEEN:   "Food Canteen",
    LAUNDRY:        "Laundry",
    PRINTING:       "Printing",
    BARBING_SALON:  "Barbing Salon",
    HAIR_SALON:     "Hair Salon",
    PHARMACY:       "Pharmacy",
    MINI_MART:      "Mini Mart",
    OTHER:          "Other",
  };
  const totalVendors = vendorTypeBreakdown.reduce((s, v) => s + v._count._all, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1">Platform analytics</p>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Analytics Dashboard</h1>
        <p className="text-vodium-cream/40 text-sm mt-0.5">Live data · Refreshes on page load</p>
      </div>

      {/* ── Revenue ──────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-vodium-cream/60 uppercase tracking-wider mb-4">Revenue</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "MRR",           value: formatNaira(mrr),          sub: "Monthly recurring revenue" },
            { label: "ARR",           value: formatNaira(arr),           sub: "Annualized run rate" },
            { label: "Total tracked", value: formatNaira(totalTracked),  sub: "All credits ever extended" },
          ].map((k) => (
            <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-5">
              <p className="text-vodium-cream/40 text-xs">{k.label}</p>
              <p className="font-serif text-2xl text-vodium-gold mt-1.5">{k.value}</p>
              <p className="text-vodium-cream/30 text-xs mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Monthly volume chart */}
          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-1">Monthly credit volume</h3>
            <p className="text-vodium-cream/35 text-xs mb-6">₦ extended vs recovered</p>
            {monthlyCredits.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-vodium-cream/20 text-sm">No data yet</div>
            ) : (
              <>
                <div className="flex items-end gap-3 h-32">
                  {monthlyCredits.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex flex-col gap-0.5 justify-end" style={{ height: "112px" }}>
                        <div
                          className="w-full gold-gradient-bg rounded-t-sm min-h-[4px]"
                          style={{ height: `${(m.extended / chartMax) * 90}px` }}
                        />
                        <div
                          className="w-full bg-success/40 rounded-sm min-h-[2px]"
                          style={{ height: `${(m.recovered / chartMax) * 90}px` }}
                        />
                      </div>
                      <span className="text-[9px] text-vodium-cream/30">{m.month.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-4 text-[10px] text-vodium-cream/40">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm gold-gradient-bg" /> Extended</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-success/40" /> Recovered</span>
                </div>
              </>
            )}
          </div>

          {/* Credit health */}
          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-1">Credit health</h3>
            <p className="text-vodium-cream/35 text-xs mb-6">{totalCredits.toLocaleString()} total credits</p>
            <div className="space-y-3">
              {[
                { label: "Paid",        count: paidCredits,       color: "bg-success",     pct: totalCredits > 0 ? (paidCredits / totalCredits) * 100 : 0 },
                { label: "Partial",     count: partialCredits,    color: "bg-vodium-gold", pct: totalCredits > 0 ? (partialCredits / totalCredits) * 100 : 0 },
                { label: "Overdue",     count: overdueCredits,    color: "bg-warning",     pct: totalCredits > 0 ? (overdueCredits / totalCredits) * 100 : 0 },
                { label: "Written off", count: writtenOffCredits, color: "bg-danger",      pct: totalCredits > 0 ? (writtenOffCredits / totalCredits) * 100 : 0 },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-vodium-cream/70">{s.label}</span>
                    <span className="text-vodium-cream/40">{s.count} · {s.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-vodium-slate rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Credit scoring ────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-vodium-cream/60 uppercase tracking-wider mb-4">Credit scoring</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-1">Vodium score distribution</h3>
            <p className="text-vodium-cream/35 text-xs mb-6">{totalCustomersScored} customers scored</p>
            {totalCustomersScored === 0 ? (
              <div className="h-24 flex items-center justify-center text-vodium-cream/20 text-sm">No scores yet</div>
            ) : (
              <div className="space-y-3">
                {(["excellent", "good", "fair", "poor"] as const).map((tier) => {
                  const row = scoreDistribution.find((r) => r.tier === tier);
                  const count = row ? Number(row.count) : 0;
                  const pct = totalCustomersScored > 0 ? (count / totalCustomersScored) * 100 : 0;
                  const meta = scoreMap[tier];
                  return (
                    <div key={tier}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-vodium-cream/70">{meta.tier}</span>
                        <span className="text-vodium-cream/40">{count} · {pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-vodium-slate rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-1">Platform health</h3>
            <p className="text-vodium-cream/35 text-xs mb-6">Overall metrics</p>
            <div className="space-y-5">
              {[
                { label: "Repayment rate",  value: `${repaymentRate}%`,           good: repaymentRate >= 70 },
                { label: "Default rate",    value: `${defaultRate}%`,             good: defaultRate <= 5 },
                { label: "Total recovered", value: formatNaira(totalRecovered),   good: true },
                { label: "Outstanding",     value: formatNaira(Math.max(totalTracked - totalRecovered, 0)), good: false },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-xs text-vodium-cream/50">{m.label}</span>
                  <span className={`text-sm font-bold ${m.good ? "text-success" : "text-warning"}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Vendors ───────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-vodium-cream/60 uppercase tracking-wider mb-4">Vendors</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-4">Top vendors by credits logged</h3>
            {topVendors.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-vodium-cream/20 text-sm">No vendors yet</div>
            ) : (
              <div className="space-y-3">
                {topVendors.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="text-vodium-cream/20 text-xs w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-vodium-cream/80 font-medium truncate">{v.businessName}</p>
                      <p className="text-[10px] text-vodium-cream/35">{v.community.shortName ?? v.community.name}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-vodium-gold">
                      <CreditCard size={11} /> {v._count.credits}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-4">Vendor types</h3>
            {vendorTypeBreakdown.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-vodium-cream/20 text-sm">No vendors yet</div>
            ) : (
              <div className="space-y-3">
                {vendorTypeBreakdown.map((vt) => {
                  const pct = totalVendors > 0 ? (vt._count._all / totalVendors) * 100 : 0;
                  return (
                    <div key={vt.vendorType}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-vodium-cream/70">{vendorTypeLabels[vt.vendorType] ?? vt.vendorType}</span>
                        <span className="text-vodium-cream/40">{vt._count._all} · {pct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-vodium-slate rounded-full overflow-hidden">
                        <div className="h-full gold-gradient-bg rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
