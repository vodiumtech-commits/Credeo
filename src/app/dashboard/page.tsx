import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  MessageCircle,
  Users,
  Zap,
  BarChart3,
} from "lucide-react";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { RevenueChart } from "@/components/ui/revenue-chart";
import { BulkRemindButton } from "@/components/ui/bulk-remind-button";

export default async function DashboardPage() {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  const credits = await prisma.credit.findMany({
    where: { vendorId: vendor.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Computed stats ──────────────────────────────────────────
  const outstanding = credits.filter(
    (c) => !["PAID", "WRITTEN_OFF"].includes(c.status),
  );
  const totalOwed = outstanding.reduce(
    (s, c) => s + Number(c.amount) - Number(c.amountRepaid),
    0,
  );
  const paidCredits = credits.filter((c) => c.status === "PAID");
  const paidThisMonth = paidCredits
    .filter((c) => c.closedAt && c.closedAt >= startOfMonth)
    .reduce((s, c) => s + Number(c.amount), 0);
  const overdueList = credits.filter((c) => c.status === "OVERDUE").slice(0, 5);
  const dueSoonList = credits
    .filter((c) => c.status === "DUE_SOON")
    .slice(0, 5);
  const totalCustomers = new Set(credits.map((c) => c.studentId)).size;
  const creditsOwing = outstanding.filter(
    (c) => Number(c.amount) - Number(c.amountRepaid) > 0,
  ).length;
  const avgCredit = credits.length
    ? credits.reduce((s, c) => s + Number(c.amount), 0) / credits.length
    : 0;
  const creditsThisMonth = credits.filter(
    (c) => c.createdAt >= startOfMonth,
  ).length;
  const recoveryRate =
    paidCredits.length && credits.length
      ? Math.round((paidCredits.length / credits.length) * 100)
      : 0;

  // ── Monthly volume (last 6 months) ────────────────────────
  const monthlyVolume = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthCredits = credits.filter(
      (c) => c.createdAt >= d && c.createdAt < next,
    );
    return {
      month: d.toLocaleString("en-NG", { month: "short" }).slice(0, 3),
      extended: monthCredits.reduce((s, c) => s + Number(c.amount), 0),
      recovered: monthCredits
        .filter((c) => c.status === "PAID")
        .reduce((s, c) => s + Number(c.amount), 0),
    };
  });

  // ── Activity feed (8 most recent events) ──────────────────
  const activity = credits.slice(0, 8).map((c) => ({
    id: c.id,
    type:
      c.status === "PAID"
        ? "paid"
        : c.status === "OVERDUE"
          ? "overdue"
          : "credit",
    text:
      c.status === "PAID"
        ? `${c.student.fullName} paid ${formatNaira(Number(c.amount))}`
        : c.status === "OVERDUE"
          ? `${c.student.fullName} is overdue — ${formatNaira(Number(c.amount) - Number(c.amountRepaid))} owed`
          : `Credit of ${formatNaira(Number(c.amount))} recorded for ${c.student.fullName}`,
    subtext: c.description ?? "",
    at: c.createdAt.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    }),
  }));

  // This month's extended total for chart footer
  const thisMonthExtended = monthlyVolume[5]?.extended ?? 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8 bg-vodium-cream min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">
            {vendor.businessName}
          </h1>
          <p className="text-sm text-vodium-black/50 mt-0.5">
            {vendor.location ?? vendor.community?.shortName ?? vendor.community?.name ?? "Community"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GlowBadge color="green">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {vendor.subscription?.plan ?? "STARTER"} plan
          </GlowBadge>
          <Link
            href="/dashboard/credit/new"
            className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            <Plus size={15} /> Add credit
          </Link>
        </div>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total owed to you"
          value={formatNaira(totalOwed)}
          sub={`${creditsOwing} credits outstanding`}
          icon={<TrendingUp size={16} />}
          delay={0}
        />
        <StatCard
          label="Paid this month"
          value={formatNaira(paidThisMonth)}
          sub="Recovered successfully"
          icon={<CheckCircle2 size={16} />}
          delay={0.08}
        />
        <StatCard
          label="Customers owing"
          value={String(creditsOwing)}
          sub={`of ${totalCustomers} total customers`}
          icon={<Users size={16} />}
          delay={0.16}
        />
        <StatCard
          label="Recovery rate"
          value={`${recoveryRate}%`}
          sub="All-time paid vs issued"
          icon={<BarChart3 size={16} />}
          trend={
            recoveryRate >= 70 ? "Strong repayment trend" : "Needs attention"
          }
          trendUp={recoveryRate >= 70}
          delay={0.24}
        />
      </div>

      {/* Main grid: chart + quick actions */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-3 bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-vodium-cream">Credit volume</h2>
              <p className="text-xs text-vodium-cream/40 mt-0.5">
                Extended vs recovered, last 6 months
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-vodium-cream/40">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded bg-vodium-gold inline-block" />
                Extended
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded bg-emerald-400 inline-block" />
                Recovered
              </span>
            </div>
          </div>
          <RevenueChart data={monthlyVolume} />
          <div className="border-t border-white/[0.05] mt-5 pt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">
                Extended
              </p>
              <p className="font-serif text-base text-vodium-gold mt-0.5">
                {formatNaira(thisMonthExtended)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">
                Recovered
              </p>
              <p className="font-serif text-base text-emerald-400 mt-0.5">
                {formatNaira(paidThisMonth)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">
                Outstanding
              </p>
              <p className="font-serif text-base text-amber-400 mt-0.5">
                {formatNaira(Math.max(0, thisMonthExtended - paidThisMonth))}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions + mini stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick actions */}
          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[11px] text-vodium-cream/35 uppercase tracking-widest mb-4">
              Quick actions
            </p>
            <div className="space-y-2">
              {[
                {
                  href: "/dashboard/credit/new",
                  icon: <Plus size={16} className="text-vodium-gold" />,
                  label: "Add a credit",
                  external: false,
                },
                {
                  href: "/dashboard/credits",
                  icon: <BarChart3 size={16} className="text-vodium-gold" />,
                  label: "View all credits",
                  external: false,
                },
                {
                  href: "https://wa.me/2347019575717?text=LIST",
                  icon: (
                    <MessageCircle size={16} className="text-vodium-gold" />
                  ),
                  label: "WhatsApp bot",
                  external: true,
                },
              ].map((a) =>
                a.external ? (
                  <a
                    key={a.label}
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-vodium-black/40 hover:bg-vodium-gold/10 border border-white/[0.04] hover:border-vodium-gold/20 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-sm text-vodium-cream/70 group-hover:text-vodium-cream">
                      {a.icon}
                      {a.label}
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-vodium-cream/20 group-hover:text-vodium-gold transition-colors"
                    />
                  </a>
                ) : (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-vodium-black/40 hover:bg-vodium-gold/10 border border-white/[0.04] hover:border-vodium-gold/20 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-sm text-vodium-cream/70 group-hover:text-vodium-cream">
                      {a.icon}
                      {a.label}
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-vodium-cream/20 group-hover:text-vodium-gold transition-colors"
                    />
                  </Link>
                ),
              )}
            </div>
          </div>

          {/* Mini stats grid */}
          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5 grid grid-cols-2 gap-5">
            <div>
              <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">
                Customers
              </p>
              <p className="font-serif text-xl text-vodium-cream mt-1">
                {totalCustomers}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">
                Avg credit
              </p>
              <p className="font-serif text-xl text-vodium-cream mt-1">
                {formatNaira(Math.round(avgCredit))}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">
                This month
              </p>
              <p className="font-serif text-xl text-vodium-cream mt-1">
                {creditsThisMonth}
              </p>
              <p className="text-[11px] text-vodium-cream/25 mt-0.5">
                credits issued
              </p>
            </div>
            <div>
              <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">
                All time
              </p>
              <p className="font-serif text-xl text-vodium-cream mt-1">
                {credits.length}
              </p>
              <p className="text-[11px] text-vodium-cream/25 mt-0.5">logged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue table */}
      <div className="bg-vodium-charcoal border border-rose-500/10 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-rose-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="font-semibold text-vodium-cream flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400" />
            Overdue credits
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <BulkRemindButton
              overdueCount={
                credits.filter((c) => c.status === "OVERDUE").length
              }
            />
            <GlowBadge color="red">
              {credits.filter((c) => c.status === "OVERDUE").length} overdue
            </GlowBadge>
          </div>
        </div>

        {overdueList.length === 0 ? (
          <p className="px-6 py-10 text-sm text-vodium-cream/30 text-center">
            No overdue credits great work!
          </p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {overdueList.map((c) => {
              const daysOver = Math.floor(
                (now.getTime() - new Date(c.dueDate).getTime()) / 86_400_000,
              );
              return (
                <div
                  key={c.id}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle size={14} className="text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-vodium-cream">
                        {c.student.fullName}
                      </p>
                      <p className="text-[11px] text-vodium-cream/35 mt-0.5">
                        {c.student.matricNumber ?? "No matric"} ·{" "}
                        <span className="text-rose-400/70">
                          {daysOver} day{daysOver !== 1 ? "s" : ""} overdue
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right sm:pl-4">
                    <p className="font-serif text-base text-rose-400">
                      {formatNaira(Number(c.amount) - Number(c.amountRepaid))}
                    </p>
                    <GlowBadge color="red" className="mt-1 text-[10px]">
                      Overdue
                    </GlowBadge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 sm:px-6 py-3 border-t border-white/[0.04]">
          <Link
            href="/dashboard/credits"
            className="text-sm text-vodium-gold hover:text-vodium-gold/80 flex items-center gap-1 transition-colors"
          >
            View all overdue credits <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Due soon */}
      <div className="bg-vodium-charcoal border border-amber-500/10 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-amber-500/10 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-vodium-cream flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            Due soon
          </h2>
          <GlowBadge color="amber">{dueSoonList.length} due soon</GlowBadge>
        </div>
        {dueSoonList.length === 0 ? (
          <p className="px-6 py-10 text-sm text-vodium-cream/30 text-center">
            No upcoming dues in the next 2 days
          </p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {dueSoonList.map((c) => {
              const daysUntil = Math.ceil(
                (new Date(c.dueDate).getTime() - now.getTime()) / 86_400_000,
              );
              return (
                <div
                  key={c.id}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock size={14} className="text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-vodium-cream">
                        {c.student.fullName}
                      </p>
                      <p className="text-[11px] text-vodium-cream/35 mt-0.5">
                        {c.student.matricNumber ?? "No matric"} · Due{" "}
                        {new Date(c.dueDate).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right sm:pl-4">
                    <p className="font-serif text-base text-amber-400">
                      {formatNaira(Number(c.amount) - Number(c.amountRepaid))}
                    </p>
                    <p className="text-[11px] text-vodium-cream/35 mt-0.5">
                      in {Math.max(0, daysUntil)} day
                      {daysUntil !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="px-4 sm:px-6 py-3 border-t border-white/[0.04]">
          <Link
            href="/dashboard/credits"
            className="text-sm text-vodium-gold hover:text-vodium-gold/80 flex items-center gap-1 transition-colors"
          >
            View all credits <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <Zap size={16} className="text-vodium-gold" />
          <h2 className="font-semibold text-vodium-cream">Recent activity</h2>
        </div>
        {activity.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-vodium-cream/30 text-sm">No activity yet.</p>
            <Link
              href="/dashboard/credit/new"
              className="btn-gold px-5 py-2.5 rounded-xl text-sm mt-4 inline-block"
            >
              Record your first credit
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {activity.map((a) => (
              <div
                key={a.id}
                className="px-6 py-4 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                    a.type === "paid"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : a.type === "overdue"
                        ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"
                        : "bg-vodium-gold shadow-[0_0_8px_rgba(201,169,97,0.6)]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-vodium-cream">{a.text}</p>
                  {a.subtext && (
                    <p className="text-xs text-vodium-cream/30 mt-0.5">
                      {a.subtext}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-vodium-cream/25 whitespace-nowrap flex-shrink-0 mt-0.5">
                  {a.at}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
