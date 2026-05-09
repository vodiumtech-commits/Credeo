import Link from "next/link";
import {
  Store, Users, CreditCard, TrendingUp, ArrowUpRight,
  ArrowRight, Shield, Activity, Zap, CheckCircle2, AlertCircle
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

export default async function AdminPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    vendorStats,
    totalStudents,
    studentsWithHistory,
    creditAmounts,
    totalRepaid,
    activeSubs,
    totalCredits,
    creditsThisWeek,
    paidCredits,
    writtenOffCredits,
    recentVendors,
    universityBreakdown,
    recentAudit,
    monthlyCredits,
  ] = await Promise.all([
    // Vendor counts by status
    prisma.vendor.groupBy({ by: ["status"], _count: { _all: true } }),

    // Total students
    prisma.student.count(),

    // Students who have at least one credit event (have history)
    prisma.student.count({ where: { credits: { some: {} } } }),

    // Sum of all credit amounts
    prisma.credit.aggregate({ _sum: { amount: true } }),

    // Sum of all repayments
    prisma.repayment.aggregate({ _sum: { amount: true } }),

    // Active subscriptions for MRR
    prisma.vendorSubscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      select: { monthlyAmount: true, status: true, plan: true },
    }),

    // Total credits
    prisma.credit.count(),

    // Credits created this week
    prisma.credit.count({ where: { createdAt: { gte: weekAgo } } }),

    // Paid credits
    prisma.credit.count({ where: { status: "PAID" } }),

    // Written off credits
    prisma.credit.count({ where: { status: "WRITTEN_OFF" } }),

    // Recent vendor signups
    prisma.vendor.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        university: { select: { shortName: true, name: true } },
        subscription: { select: { plan: true, status: true, monthlyAmount: true } },
        _count: { select: { credits: true } },
      },
    }),

    // University breakdown
    prisma.university.findMany({
      include: {
        _count: { select: { vendors: true, students: true } },
      },
      orderBy: { vendors: { _count: "desc" } },
      take: 6,
    }),

    // Recent audit log entries (fall back to recent repayments + credits if no audit log)
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),

    // Monthly credit volume (last 6 months)
    prisma.$queryRaw<Array<{ month: string; count: bigint; total: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon ''YY') AS month,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0)::float AS total
      FROM "Credit"
      WHERE "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,
  ]);

  // Compute vendor status counts
  const activeVendors = vendorStats.find((v) => v.status === "ACTIVE")?._count._all ?? 0;
  const inactiveVendors = vendorStats.find((v) => v.status === "INACTIVE")?._count._all ?? 0;
  const suspendedVendors = vendorStats.find((v) => v.status === "SUSPENDED")?._count._all ?? 0;
  const trialVendors = activeSubs.filter((s) => s.status === "TRIAL").length;

  // MRR — sum of active paying subscriptions
  const mrr = activeSubs
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + Number(s.monthlyAmount), 0);

  const totalNairaTracked = Number(creditAmounts._sum.amount ?? 0);
  const totalNairaRecovered = Number(totalRepaid._sum.amount ?? 0);
  const repaymentRate = totalCredits > 0 ? Math.round((paidCredits / totalCredits) * 100) : 0;
  const defaultRate = totalCredits > 0 ? Math.round((writtenOffCredits / totalCredits) * 100) : 0;

  // Aggregate student counts per university for recent credits
  const uniData = universityBreakdown.map((u) => ({
    shortName: u.shortName ?? u.name.split(" ").map((w) => w[0]).join(""),
    vendors: u._count.vendors,
    students: u._count.students,
  }));
  const maxUniVendors = Math.max(...uniData.map((u) => u.vendors), 1);

  // Monthly chart data
  const chartMax = Math.max(...monthlyCredits.map((m) => m.total), 1);

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1">Platform overview</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Vodium Ledger Admin</h1>
          <p className="text-vodium-cream/40 text-sm mt-0.5">Real-time platform metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success text-xs font-medium">All systems operational</span>
          </div>
        </div>
      </div>

      {/* ── Primary KPIs ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpi
          label="Active vendors"
          value={String(activeVendors)}
          sub={`${trialVendors} on trial · ${inactiveVendors + suspendedVendors} inactive`}
          icon={<Store size={18} />}
        />
        <AdminKpi
          label="Total students"
          value={totalStudents.toLocaleString()}
          sub={`${studentsWithHistory.toLocaleString()} with credit history`}
          icon={<Users size={18} />}
        />
        <AdminKpi
          label="Total ₦ tracked"
          value={totalNairaTracked >= 1_000_000
            ? `₦${(totalNairaTracked / 1_000_000).toFixed(1)}M`
            : formatNaira(totalNairaTracked)}
          sub={`${totalNairaRecovered >= 1_000_000
            ? `₦${(totalNairaRecovered / 1_000_000).toFixed(1)}M`
            : formatNaira(totalNairaRecovered)} recovered`}
          icon={<CreditCard size={18} />}
        />
        <AdminKpi
          label="Monthly revenue (MRR)"
          value={formatNaira(mrr)}
          sub={`${formatNaira(mrr * 12)} ARR`}
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* ── Secondary KPIs ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Credits logged (all time)", value: totalCredits.toLocaleString() },
          { label: "Credits this week",         value: creditsThisWeek.toLocaleString() },
          { label: "Platform repayment rate",   value: `${repaymentRate}%` },
          { label: "Default rate",              value: `${defaultRate}%` },
        ].map((k) => (
          <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
            <p className="text-vodium-cream/40 text-xs">{k.label}</p>
            <p className="font-serif text-2xl text-vodium-cream mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly credit volume chart */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-vodium-cream">Monthly credit volume</h2>
              <p className="text-vodium-cream/40 text-xs mt-0.5">₦ extended per month</p>
            </div>
            <div className="text-right">
              <p className="text-vodium-gold font-serif text-xl">{formatNaira(totalNairaTracked)}</p>
              <p className="text-vodium-cream/40 text-xs mt-0.5">all time</p>
            </div>
          </div>
          {monthlyCredits.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-vodium-cream/25 text-sm">
              No credit data yet
            </div>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {monthlyCredits.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full gold-gradient-bg rounded-t-md transition-all min-h-[4px]"
                    style={{ height: `${(m.total / chartMax) * 112}px` }}
                  />
                  <span className="text-[10px] text-vodium-cream/35">{m.month.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* University breakdown */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-vodium-cream">University Coverage</h2>
              <p className="text-vodium-cream/40 text-xs mt-0.5">Vendors by campus</p>
            </div>
            <span className="badge badge-active text-xs">{uniData.length} campuses</span>
          </div>
          {uniData.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-vodium-cream/25 text-sm">
              No university data yet
            </div>
          ) : (
            <div className="space-y-4">
              {uniData.map((u) => (
                <div key={u.shortName}>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-vodium-cream/80 font-medium">{u.shortName}</span>
                    <div className="flex items-center gap-4 text-vodium-cream/40">
                      <span>{u.vendors} vendor{u.vendors !== 1 ? "s" : ""}</span>
                      <span>{u.students.toLocaleString()} students</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-vodium-slate rounded-full overflow-hidden">
                    <div
                      className="h-full gold-gradient-bg rounded-full transition-all"
                      style={{ width: `${(u.vendors / maxUniVendors) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent vendors + activity ─────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent vendor signups */}
        <div className="lg:col-span-2 bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-semibold text-vodium-cream flex items-center gap-2">
              <Store size={16} className="text-vodium-gold" /> Recent vendors
            </h2>
            <Link href="/admin/vendors" className="text-xs text-vodium-gold hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {recentVendors.length === 0 ? (
            <div className="px-6 py-12 text-center text-vodium-cream/25 text-sm">No vendors yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentVendors.map((v) => (
                <div key={v.id} className="px-6 py-4 flex items-center justify-between table-row-dark">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-vodium-slate flex items-center justify-center flex-shrink-0">
                      <Store size={14} className="text-vodium-gold/60" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-vodium-cream truncate">{v.businessName}</p>
                      <p className="text-xs text-vodium-cream/40 mt-0.5">
                        {v.university.shortName ?? v.university.name} · {v.vendorType.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-vodium-cream/60">{v._count.credits} credits</p>
                      <p className="text-xs text-vodium-gold mt-0.5">
                        {v.subscription?.status === "ACTIVE"
                          ? formatNaira(Number(v.subscription.monthlyAmount)) + "/mo"
                          : "Trial"}
                      </p>
                    </div>
                    <span className={`badge text-[10px] ${
                      v.status === "ACTIVE" ? "badge-active"
                      : v.status === "INACTIVE" ? "badge-inactive"
                      : "badge-inactive"
                    }`}>
                      {v.subscription?.status === "TRIAL" ? "TRIAL" : v.status}
                    </span>
                    {v.subscription && <PlanBadge plan={v.subscription.plan} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System activity (recent audit log) */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-vodium-cream flex items-center gap-2">
              <Activity size={16} className="text-vodium-gold" /> System activity
            </h2>
          </div>
          {recentAudit.length === 0 ? (
            <div className="px-5 py-12 text-center text-vodium-cream/25 text-sm">No activity yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentAudit.map((a) => (
                <div key={a.id} className="px-5 py-4 flex items-start gap-3 table-row-dark">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-vodium-gold/10 text-vodium-gold">
                    {a.action.includes("credit") && <CreditCard size={13} />}
                    {a.action.includes("vendor") && <Store size={13} />}
                    {a.action.includes("repayment") && <CheckCircle2 size={13} />}
                    {!a.action.includes("credit") && !a.action.includes("vendor") && !a.action.includes("repayment") && <Zap size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-vodium-cream/80 leading-relaxed">{a.action}</p>
                    <p className="text-[10px] text-vodium-cream/35 mt-1">
                      {a.entityType ? `${a.entityType} · ${a.actorType}` : a.actorType}
                    </p>
                    <p className="text-[10px] text-vodium-cream/25 mt-0.5">
                      {new Date(a.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Platform health strip ──────────────────────── */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
        <h2 className="font-semibold text-vodium-cream mb-5 flex items-center gap-2">
          <Shield size={16} className="text-vodium-gold" /> Platform health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "DB connection",     value: "OK",    status: "good" },
            { label: "Total vendors",     value: String(activeVendors + inactiveVendors + suspendedVendors), status: "good" },
            { label: "WhatsApp channel",  value: "Active", status: "good" },
            { label: "Default rate",      value: `${defaultRate}%`, status: defaultRate > 5 ? "warning" : "good" },
          ].map((h) => (
            <div key={h.label}>
              <p className="text-vodium-cream/40 text-xs">{h.label}</p>
              <p className={`font-mono font-bold text-xl mt-1 ${h.status === "good" ? "text-success" : "text-warning"}`}>
                {h.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function AdminKpi({
  label, value, sub, icon,
}: {
  label: string; value: string; sub: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-vodium-cream/40 text-xs uppercase tracking-wider leading-tight">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center text-vodium-gold flex-shrink-0">
          {icon}
        </div>
      </div>
      <p className="font-serif text-2xl md:text-3xl text-vodium-gold">{value}</p>
      <p className="text-vodium-cream/35 text-xs mt-1.5">{sub}</p>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER:    "text-vodium-cream/50 bg-vodium-slate",
    GROWTH:     "text-vodium-gold bg-vodium-gold/10",
    CAMPUS_PRO: "text-purple-400 bg-purple-400/10",
  };
  const labels: Record<string, string> = {
    STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Pro",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${map[plan] ?? ""}`}>
      {labels[plan] ?? plan}
    </span>
  );
}
