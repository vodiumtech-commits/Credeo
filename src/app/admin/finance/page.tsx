import { TrendingUp, CreditCard, Users, AlertCircle, ArrowUpRight, BarChart3, DollarSign, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = { STARTER: "Starter ₦2k", GROWTH: "Growth ₦5k", CAMPUS_PRO: "Campus Pro ₦10k" };
const PLAN_MRR:   Record<string, number>  = { STARTER: 2000, GROWTH: 5000, CAMPUS_PRO: 10000 };

const SUB_STATUS_COLOR: Record<string, string> = {
  TRIAL:      "text-amber-400 bg-amber-500/10 border-amber-500/20",
  ACTIVE:     "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  PAST_DUE:   "text-rose-400 bg-rose-500/10 border-rose-500/20",
  CANCELLED:  "text-vodium-cream/40 bg-white/[0.05] border-white/[0.08]",
  EXPIRED:    "text-vodium-cream/25 bg-white/[0.03] border-white/[0.05]",
};

export default async function FinancePage() {
  const now       = new Date();
  const monthAgo  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [subs, monthlyRevenue, topVendors, newTrialsThisMonth, churnedThisMonth] = await Promise.all([
    // All subscriptions with vendor info
    prisma.vendorSubscription.findMany({
      include: { vendor: { select: { businessName: true, ownerName: true, phone: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    }),

    // Monthly revenue (last 6 months)
    prisma.$queryRaw<Array<{ month: string; mrr: number; count: bigint }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', vs."createdAt"), 'Mon ''YY') AS month,
        COALESCE(SUM(vs."monthlyAmount"), 0)::float AS mrr,
        COUNT(*) AS count
      FROM "VendorSubscription" vs
      WHERE vs.status = 'ACTIVE'
        AND vs."createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', vs."createdAt")
      ORDER BY DATE_TRUNC('month', vs."createdAt") ASC
    `,

    // Top 10 vendors by plan value
    prisma.vendorSubscription.findMany({
      where:   { status: "ACTIVE" },
      orderBy: { monthlyAmount: "desc" },
      take:    10,
      include: { vendor: { select: { businessName: true, ownerName: true } } },
    }),

    // New trials this month
    prisma.vendorSubscription.count({ where: { status: "TRIAL", createdAt: { gte: monthAgo } } }),

    // Cancelled / expired this month
    prisma.vendorSubscription.count({ where: { status: { in: ["CANCELLED", "EXPIRED"] }, updatedAt: { gte: monthAgo } } }),
  ]);

  // Derived metrics
  const activeSubs   = subs.filter((s) => s.status === "ACTIVE");
  const trialSubs    = subs.filter((s) => s.status === "TRIAL");
  const pastDueSubs  = subs.filter((s) => s.status === "PAST_DUE");
  const cancelledSubs = subs.filter((s) => s.status === "CANCELLED");

  const mrr = activeSubs.reduce((s, sub) => s + Number(sub.monthlyAmount), 0);
  const arr = mrr * 12;
  const revenueAtRisk = pastDueSubs.reduce((s, sub) => s + Number(sub.monthlyAmount), 0);

  // Plan distribution
  const planDist = (["STARTER", "GROWTH", "CAMPUS_PRO"] as const).map((plan) => {
    const planSubs  = subs.filter((s) => s.plan === plan);
    const active    = planSubs.filter((s) => s.status === "ACTIVE").length;
    const trial     = planSubs.filter((s) => s.status === "TRIAL").length;
    const contrib   = active * PLAN_MRR[plan];
    return { plan, active, trial, total: planSubs.length, contrib };
  });

  const chartMax = Math.max(...monthlyRevenue.map((m) => m.mrr), 1);

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-7">

      {/* Header */}
      <div>
        <p className="text-vodium-gold text-xs tracking-[0.35em] uppercase mb-1.5">Finance</p>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Revenue Dashboard</h1>
        <p className="text-vodium-cream/35 text-sm mt-1">
          {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MRR",            value: formatNaira(mrr),                 sub: `${activeSubs.length} paying vendors`,     icon: <DollarSign size={18} />,  color: "text-vodium-gold" },
          { label: "ARR",            value: formatNaira(arr),                 sub: "Annualised recurring revenue",            icon: <TrendingUp size={18} />,  color: "text-emerald-400" },
          { label: "Trial vendors",  value: String(trialSubs.length),         sub: `${newTrialsThisMonth} joined this month`, icon: <Users size={18} />,       color: "text-sky-400" },
          { label: "Revenue at risk",value: formatNaira(revenueAtRisk),       sub: `${pastDueSubs.length} past-due accounts`, icon: <AlertCircle size={18} />, color: revenueAtRisk > 0 ? "text-rose-400" : "text-vodium-cream/30" },
        ].map((k) => (
          <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <p className="text-vodium-cream/40 text-[11px] uppercase tracking-wider">{k.label}</p>
              <div className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center ${k.color}`}>
                {k.icon}
              </div>
            </div>
            <p className={`font-serif text-3xl leading-none ${k.color}`}>{k.value}</p>
            <p className="text-vodium-cream/30 text-xs mt-2">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active paying",  value: activeSubs.length,   color: "text-emerald-400" },
          { label: "On trial",       value: trialSubs.length,    color: "text-amber-400" },
          { label: "Past due",       value: pastDueSubs.length,  color: pastDueSubs.length > 0 ? "text-rose-400" : "text-vodium-cream/30" },
          { label: "Churned (30d)",  value: churnedThisMonth,    color: churnedThisMonth > 0 ? "text-rose-400" : "text-vodium-cream/30" },
        ].map((k) => (
          <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
            <p className="text-vodium-cream/40 text-xs">{k.label}</p>
            <p className={`font-serif text-2xl mt-1.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue trend chart */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={14} className="text-vodium-gold" />
            <h2 className="text-sm font-semibold text-vodium-cream">Active MRR trend (last 6 months)</h2>
          </div>
          {monthlyRevenue.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-vodium-cream/20 text-sm">No data yet</div>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {monthlyRevenue.map((m) => {
                const heightPx = Math.max((m.mrr / chartMax) * 132, 4);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <p className="text-[9px] text-vodium-cream/0 group-hover:text-vodium-cream/50 transition-colors whitespace-nowrap">
                      {formatNaira(m.mrr)}
                    </p>
                    <div className="w-full rounded-t-md" style={{ height: `${heightPx}px`, background: "linear-gradient(to top, #C9A961, rgba(201,169,97,0.4))" }} />
                    <span className="text-[10px] text-vodium-cream/35">{m.month.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard size={14} className="text-vodium-gold" />
            <h2 className="text-sm font-semibold text-vodium-cream">Plan distribution</h2>
          </div>
          <div className="space-y-5">
            {planDist.map((p) => {
              const pct = activeSubs.length > 0 ? Math.round((p.active / Math.max(subs.length, 1)) * 100) : 0;
              return (
                <div key={p.plan}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-vodium-cream/80 font-medium">{PLAN_LABELS[p.plan]}</span>
                      {p.trial > 0 && <span className="text-amber-400/70 text-[10px]">{p.trial} trial</span>}
                    </div>
                    <div className="flex items-center gap-3 text-vodium-cream/40">
                      <span>{p.active} paying</span>
                      <span className="text-vodium-gold font-medium">{formatNaira(p.contrib)}/mo</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right, #C9A961, rgba(201,169,97,0.5))" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top paying vendors */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <ArrowUpRight size={14} className="text-vodium-gold" />
          <h2 className="text-sm font-semibold text-vodium-cream">Top paying vendors</h2>
        </div>
        {topVendors.length === 0 ? (
          <div className="px-6 py-12 text-center text-vodium-cream/25 text-sm">No active paying vendors yet</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {topVendors.map((s, i) => (
              <div key={s.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-xs text-vodium-cream/20 font-mono w-5 text-right flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-vodium-cream font-medium truncate">{s.vendor.businessName}</p>
                  <p className="text-xs text-vodium-cream/35 mt-0.5">{s.vendor.ownerName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-serif text-sm text-vodium-gold">{formatNaira(Number(s.monthlyAmount))}/mo</p>
                  <p className="text-[10px] text-vodium-cream/30 mt-0.5">{PLAN_LABELS[s.plan] ?? s.plan}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All subscriptions table */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-vodium-cream flex items-center gap-2">
            <XCircle size={14} className="text-vodium-gold" /> All subscriptions ({subs.length})
          </h2>
        </div>
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 px-6 py-2.5 bg-black/20 text-[10px] font-medium text-vodium-cream/25 uppercase tracking-wider">
          <span className="col-span-4">Vendor</span>
          <span className="col-span-2">Plan</span>
          <span className="col-span-2 text-right">MRR</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-2 text-right">Since</span>
        </div>
        <div className="divide-y divide-white/[0.03] max-h-96 overflow-y-auto">
          {subs.map((s) => (
            <div key={s.id} className="md:grid grid-cols-12 items-center px-6 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-4 mb-1 md:mb-0">
                <p className="text-sm text-vodium-cream font-medium truncate">{s.vendor.businessName}</p>
              </div>
              <div className="col-span-2 text-xs text-vodium-cream/50">{PLAN_LABELS[s.plan] ?? s.plan}</div>
              <div className="col-span-2 text-right">
                <p className={`text-sm font-medium ${s.status === "ACTIVE" ? "text-vodium-gold" : "text-vodium-cream/25"}`}>
                  {s.status === "ACTIVE" ? formatNaira(Number(s.monthlyAmount)) : "—"}
                </p>
              </div>
              <div className="col-span-2 flex justify-center">
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${SUB_STATUS_COLOR[s.status] ?? ""}`}>
                  {s.status}
                </span>
              </div>
              <div className="col-span-2 text-right text-xs text-vodium-cream/30">
                {new Date(s.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
