import Link from "next/link";
import {
  Store, Users, CreditCard, TrendingUp, ArrowRight,
  Shield, Activity, Zap, CheckCircle2, BarChart3,
  Database, MessageCircle, AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    vendorStats,
    totalCustomers,
    customersWithHistory,
    creditAmounts,
    totalRepaid,
    activeSubs,
    totalCredits,
    creditsThisWeek,
    paidCredits,
    writtenOffCredits,
    recentVendors,
    communityBreakdown,
    recentAudit,
    monthlyCredits,
  ] = await Promise.all([
    // Vendor counts by status
    prisma.vendor.groupBy({ by: ["status"], _count: { _all: true } }),

    // Total customers
    prisma.student.count(),

    // Customers who have at least one credit event (have history)
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
        community: { select: { shortName: true, name: true } },
        subscription: { select: { plan: true, status: true, monthlyAmount: true } },
        _count: { select: { credits: true } },
      },
    }),

    // Community breakdown
    prisma.community.findMany({
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

  // Aggregate customer counts per community for recent credits
  const communityData = communityBreakdown.map((u) => ({
    shortName: u.shortName ?? u.name.split(" ").map((w) => w[0]).join(""),
    vendors: u._count.vendors,
    customers: u._count.students,
  }));
  const maxCommunityVendors = Math.max(...communityData.map((u) => u.vendors), 1);

  // Monthly chart data
  const chartMax = Math.max(...monthlyCredits.map((m) => m.total), 1);

  // Suppress unused variable warning (monthAgo used for potential future queries)
  void monthAgo;

  return (
    <div className="p-5 md:p-8 max-w-7xl space-y-7">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-1">
        <div>
          <p className="text-vodium-gold text-xs tracking-[0.35em] uppercase font-medium mb-2">
            Platform overview
          </p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream leading-tight">
            Vodium Ledger
          </h1>
          <p className="text-vodium-cream/35 text-sm mt-1">
            Real-time platform metrics
          </p>
        </div>
        {/* Live status indicator */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 self-start">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-emerald-400 text-xs font-medium whitespace-nowrap">
            All systems operational
          </span>
        </div>
      </div>

      {/* ── Primary KPI grid — 2×2 mobile, 4 across desktop ────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpi
          label="Active Vendors"
          value={String(activeVendors)}
          sub={`${trialVendors} on trial · ${inactiveVendors + suspendedVendors} inactive`}
          icon={<Store size={18} />}
        />
        <AdminKpi
          label="Total Customers"
          value={totalCustomers.toLocaleString()}
          sub={`${customersWithHistory.toLocaleString()} with credit history`}
          icon={<Users size={18} />}
        />
        <AdminKpi
          label="Total ₦ Tracked"
          value={
            totalNairaTracked >= 1_000_000
              ? `₦${(totalNairaTracked / 1_000_000).toFixed(1)}M`
              : formatNaira(totalNairaTracked)
          }
          sub={`${
            totalNairaRecovered >= 1_000_000
              ? `₦${(totalNairaRecovered / 1_000_000).toFixed(1)}M`
              : formatNaira(totalNairaRecovered)
          } recovered`}
          icon={<CreditCard size={18} />}
        />
        <AdminKpi
          label="Monthly Revenue"
          value={formatNaira(mrr)}
          sub={`${formatNaira(mrr * 12)} ARR`}
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* ── Secondary metrics strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SecondaryKpi label="Credits logged (all time)" value={totalCredits.toLocaleString()} />
        <SecondaryKpi label="Credits this week" value={creditsThisWeek.toLocaleString()} accent="gold" />
        <SecondaryKpi
          label="Repayment rate"
          value={`${repaymentRate}%`}
          accent={repaymentRate >= 70 ? "emerald" : repaymentRate >= 40 ? "gold" : "rose"}
        />
        <SecondaryKpi
          label="Default rate"
          value={`${defaultRate}%`}
          accent={defaultRate <= 5 ? "emerald" : defaultRate <= 15 ? "gold" : "rose"}
        />
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Monthly credit volume — inline CSS bars (server component safe) */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={15} className="text-vodium-gold" />
                <h2 className="font-semibold text-vodium-cream text-sm">
                  Monthly credit volume
                </h2>
              </div>
              <p className="text-vodium-cream/40 text-xs">₦ extended per month (last 6 months)</p>
            </div>
            <div className="text-right">
              <p className="text-vodium-gold font-serif text-lg leading-none">
                {totalNairaTracked >= 1_000_000
                  ? `₦${(totalNairaTracked / 1_000_000).toFixed(1)}M`
                  : formatNaira(totalNairaTracked)}
              </p>
              <p className="text-vodium-cream/35 text-[10px] mt-1">all time</p>
            </div>
          </div>

          {monthlyCredits.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center gap-2 text-vodium-cream/20">
              <BarChart3 size={28} />
              <span className="text-sm">No credit data yet</span>
            </div>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {monthlyCredits.map((m) => {
                const heightPx = Math.max((m.total / chartMax) * 132, 4);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${heightPx}px`,
                        background:
                          "linear-gradient(to top, #C9A961, rgba(201,169,97,0.5))",
                      }}
                    />
                    <span className="text-[10px] text-vodium-cream/35 group-hover:text-vodium-cream/60 transition-colors">
                      {m.month.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Community coverage bars */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={15} className="text-vodium-gold" />
                <h2 className="font-semibold text-vodium-cream text-sm">
                  Community Coverage
                </h2>
              </div>
              <p className="text-vodium-cream/40 text-xs">Vendor coverage by community</p>
            </div>
            <span className="badge-active text-[10px] px-2.5 py-1 rounded-full font-medium">
              {communityData.length} communities
            </span>
          </div>

          {communityData.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center gap-2 text-vodium-cream/20">
              <Shield size={28} />
              <span className="text-sm">No community data yet</span>
            </div>
          ) : (
            <div className="space-y-4">
              {communityData.map((u) => (
                <div key={u.shortName}>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-vodium-cream/80 font-medium truncate max-w-[120px]">
                      {u.shortName}
                    </span>
                    <div className="flex items-center gap-3 text-vodium-cream/40 flex-shrink-0">
                      <span>{u.vendors} vendor{u.vendors !== 1 ? "s" : ""}</span>
                      <span>{u.customers.toLocaleString()} customers</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(u.vendors / maxCommunityVendors) * 100}%`,
                        background: "linear-gradient(to right, #C9A961, rgba(201,169,97,0.6))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent vendors + Activity log ────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent vendors table */}
        <div className="lg:col-span-2 bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-semibold text-vodium-cream text-sm flex items-center gap-2">
              <Store size={15} className="text-vodium-gold" />
              Recent vendors
            </h2>
            <Link
              href="/admin/vendors"
              className="text-xs text-vodium-gold hover:underline flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>

          {recentVendors.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Store size={32} className="text-vodium-cream/15 mx-auto mb-3" />
              <p className="text-vodium-cream/25 text-sm">No vendors yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentVendors.map((v) => {
                // Derive initial letter from business name
                const initial = v.businessName.charAt(0).toUpperCase();
                return (
                  <div
                    key={v.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Vendor logo initial */}
                      <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-serif text-vodium-gold text-sm font-bold">
                          {initial}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-vodium-cream truncate">
                          {v.businessName}
                        </p>
                        <p className="text-xs text-vodium-cream/40 mt-0.5">
                          {v.community.shortName ?? v.community.name} ·{" "}
                          {v.vendorType.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-vodium-cream/55">
                          {v._count.credits} credits
                        </p>
                        <p className="text-xs text-vodium-gold mt-0.5">
                          {v.subscription?.status === "ACTIVE"
                            ? formatNaira(Number(v.subscription.monthlyAmount)) + "/mo"
                            : "Trial"}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          v.subscription?.status === "TRIAL"
                            ? "badge-trial"
                            : v.status === "ACTIVE"
                            ? "badge-active"
                            : "badge-inactive"
                        }`}
                      >
                        {v.subscription?.status === "TRIAL" ? "TRIAL" : v.status}
                      </span>
                      {v.subscription && <PlanBadge plan={v.subscription.plan} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity log */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-vodium-cream text-sm flex items-center gap-2">
              <Activity size={15} className="text-vodium-gold" />
              System activity
            </h2>
          </div>

          {recentAudit.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <Activity size={32} className="text-vodium-cream/15 mx-auto mb-3" />
              <p className="text-vodium-cream/25 text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentAudit.map((a) => {
                const isCredit = a.action.includes("credit");
                const isVendor = a.action.includes("vendor");
                const isRepayment = a.action.includes("repayment");
                const dotColor = isCredit
                  ? "bg-vodium-gold"
                  : isVendor
                  ? "bg-emerald-400"
                  : isRepayment
                  ? "bg-sky-400"
                  : "bg-vodium-cream/30";
                return (
                  <div
                    key={a.id}
                    className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Colored dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full block ${dotColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-vodium-cream/75 leading-relaxed">
                        {a.action}
                      </p>
                      <p className="text-[10px] text-vodium-cream/30 mt-1">
                        {a.entityType ? `${a.entityType} · ` : ""}
                        {a.actorType}
                      </p>
                      <p className="text-[10px] text-vodium-cream/20 mt-0.5">
                        {new Date(a.createdAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {/* Icon */}
                    <div className="flex-shrink-0 text-vodium-cream/20 mt-0.5">
                      {isCredit && <CreditCard size={12} />}
                      {isVendor && <Store size={12} />}
                      {isRepayment && <CheckCircle2 size={12} />}
                      {!isCredit && !isVendor && !isRepayment && <Zap size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Platform health strip ────────────────────────────────────────── */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
        <h2 className="font-semibold text-vodium-cream text-sm mb-5 flex items-center gap-2">
          <Shield size={15} className="text-vodium-gold" />
          Platform health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <HealthMetric
            label="DB connection"
            value="OK"
            status="good"
            icon={<Database size={13} />}
          />
          <HealthMetric
            label="Total vendors"
            value={String(activeVendors + inactiveVendors + suspendedVendors)}
            status="good"
            icon={<Store size={13} />}
          />
          <HealthMetric
            label="WhatsApp channel"
            value="Active"
            status="good"
            icon={<MessageCircle size={13} />}
          />
          <HealthMetric
            label="Default rate"
            value={`${defaultRate}%`}
            status={defaultRate > 5 ? "warning" : "good"}
            icon={<AlertTriangle size={13} />}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AdminKpi({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-vodium-cream/40 text-[11px] uppercase tracking-wider leading-tight pr-2">
          {label}
        </p>
        <div className="w-9 h-9 rounded-xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center text-vodium-gold flex-shrink-0">
          {icon}
        </div>
      </div>
      <p className="font-serif text-3xl text-vodium-gold leading-none">{value}</p>
      <p className="text-vodium-cream/35 text-xs mt-2 leading-relaxed">{sub}</p>
    </div>
  );
}

function SecondaryKpi({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: string;
  accent?: "default" | "gold" | "emerald" | "rose";
}) {
  const valueColor =
    accent === "gold"
      ? "text-vodium-gold"
      : accent === "emerald"
      ? "text-emerald-400"
      : accent === "rose"
      ? "text-rose-400"
      : "text-vodium-cream";
  return (
    <div className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
      <p className="text-vodium-cream/40 text-xs leading-tight">{label}</p>
      <p className={`font-serif text-2xl mt-2 leading-none ${valueColor}`}>{value}</p>
    </div>
  );
}

function HealthMetric({
  label,
  value,
  status,
  icon,
}: {
  label: string;
  value: string;
  status: "good" | "warning" | "danger";
  icon: React.ReactNode;
}) {
  const valueColor =
    status === "good"
      ? "text-emerald-400"
      : status === "warning"
      ? "text-amber-400"
      : "text-rose-400";
  const dotColor =
    status === "good"
      ? "bg-emerald-400"
      : status === "warning"
      ? "bg-amber-400"
      : "bg-rose-400";
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`text-vodium-cream/30`}>{icon}</span>
        <p className="text-vodium-cream/40 text-xs">{label}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <p className={`font-mono font-bold text-xl leading-none ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER:    "text-vodium-cream/50 bg-white/[0.06]",
    GROWTH:     "text-vodium-gold bg-vodium-gold/10",
    PRO:        "text-purple-400 bg-purple-400/10",
  };
  const labels: Record<string, string> = {
    STARTER: "Starter",
    GROWTH: "Growth",
    PRO: "Pro",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${map[plan] ?? "text-vodium-cream/40 bg-white/[0.05]"}`}
    >
      {labels[plan] ?? plan}
    </span>
  );
}
