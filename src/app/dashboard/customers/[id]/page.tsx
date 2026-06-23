import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  User,
  BarChart3,
} from "lucide-react";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { markOverdueCredits } from "@/lib/credit-lifecycle";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { CreditStatus, ScoreEventType } from "@prisma/client";

// ── Score helpers ──────────────────────────────────────────────────────────────

function scoreTier(score: number): {
  label: string;
  color: string;
  ring: string;
  badge: string;
} {
  if (score >= 750)
    return {
      label: "Excellent",
      color: "text-emerald-400",
      ring: "stroke-emerald-400",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    };
  if (score >= 650)
    return {
      label: "Good",
      color: "text-vodium-gold",
      ring: "stroke-vodium-gold",
      badge: "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/25",
    };
  if (score >= 450)
    return {
      label: "Fair",
      color: "text-amber-400",
      ring: "stroke-amber-400",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    };
  return {
    label: "Poor",
    color: "text-rose-400",
    ring: "stroke-rose-400",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  };
}

const STATUS_BADGE: Record<CreditStatus, string> = {
  OUTSTANDING: "badge badge-outstanding",
  DUE_SOON: "badge badge-due-soon",
  OVERDUE: "badge badge-overdue",
  PARTIALLY_PAID: "badge badge-partial",
  PAID: "badge badge-paid",
  WRITTEN_OFF: "badge badge-written",
};

const STATUS_LABEL: Record<CreditStatus, string> = {
  OUTSTANDING: "Outstanding",
  DUE_SOON: "Due soon",
  OVERDUE: "Overdue",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
  WRITTEN_OFF: "Written off",
};

const EVENT_META: Record<
  ScoreEventType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  CREDIT_EXTENDED: {
    label: "Credit extended",
    icon: <CreditCard size={13} />,
    color: "text-vodium-cream/40",
  },
  PAID_ON_TIME: {
    label: "Paid on time",
    icon: <CheckCircle2 size={13} />,
    color: "text-emerald-400",
  },
  PAID_LATE: {
    label: "Paid late",
    icon: <Clock size={13} />,
    color: "text-amber-400",
  },
  PAID_PARTIAL: {
    label: "Partial payment",
    icon: <Minus size={13} />,
    color: "text-amber-400",
  },
  DEFAULTED: {
    label: "Defaulted",
    icon: <AlertCircle size={13} />,
    color: "text-rose-400",
  },
  WRITTEN_OFF: {
    label: "Written off",
    icon: <TrendingDown size={13} />,
    color: "text-rose-500",
  },
};

// ── Score ring (SVG gauge) ─────────────────────────────────────────────────────

function ScoreRing({
  score,
  tier,
}: {
  score: number;
  tier: ReturnType<typeof scoreTier>;
}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = score / 1000;
  const dash = circ * pct;
  const gap = circ - dash;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 w-full h-full -rotate-90"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          className={tier.ring}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
        />
      </svg>
      <div className="text-center z-10">
        <p className={`font-serif text-3xl leading-none ${tier.color}`}>
          {score}
        </p>
        <p className="text-[10px] text-vodium-cream/30 mt-1 uppercase tracking-wider">
          / 1000
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CustomerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  await markOverdueCredits({ vendorId: vendor.id });

  // FIXED: Renamed this variable from 'student' to 'customer'
  const customer = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      credits: {
        where: { vendorId: vendor.id },
        include: { repayments: { orderBy: { receivedAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
      scoreEvents: {
        where: { vendorId: vendor.id },
        orderBy: { occurredAt: "desc" },
        take: 30,
      },
    },
  });

  if (!customer) notFound();

  const credits = customer.credits;
  const scoreEvents = customer.scoreEvents;

  // Guard: vendor can only view students they have credits with
  if (credits.length === 0 && scoreEvents.length === 0) notFound();

  const now = new Date();
  const tier = scoreTier(customer.vodiumScore);

  // ── Computed stats ──────────────────────────────────────────────────────
  const outstanding = credits.filter(
    (c) => !["PAID", "WRITTEN_OFF"].includes(c.status),
  );
  const paid = credits.filter((c) => c.status === "PAID");
  const overdue = credits.filter((c) => c.status === "OVERDUE");
  const totalOwed = outstanding.reduce(
    (s, c) => s + Number(c.amount) - Number(c.amountRepaid),
    0,
  );
  const totalPaid = paid.reduce((s, c) => s + Number(c.amount), 0);
  const recoveryRate = credits.length
    ? Math.round((paid.length / credits.length) * 100)
    : 0;

  const statusLabel = overdue.length
    ? "overdue"
    : outstanding.some((c) => c.status === "DUE_SOON")
      ? "due_soon"
      : totalOwed > 0
        ? "owing"
        : "settled";

  const statusMeta: Record<string, { text: string; color: string }> = {
    overdue: { text: "Overdue", color: "red" },
    due_soon: { text: "Due soon", color: "gold" },
    owing: { text: "Owing", color: "gold" },
    settled: { text: "Settled", color: "green" },
  };

  const displayPhone = customer.phone.startsWith("pending:")
    ? null
    : customer.phone;

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm text-vodium-cream/40 hover:text-vodium-cream/70 transition-colors"
      >
        <ArrowLeft size={14} /> All customers
      </Link>

      {/* ── Header card ────────────────────────────────────────────────── */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-vodium-gold" />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-serif text-2xl text-vodium-cream">
                {customer.fullName}
              </h1>
              <GlowBadge
                color={
                  (statusMeta[statusLabel]?.color as
                    | "red"
                    | "gold"
                    | "green") ?? "gold"
                }
              >
                {statusMeta[statusLabel]?.text}
              </GlowBadge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-vodium-cream/40">
              {customer.matricNumber && (
                <span>ID: {customer.matricNumber}</span>
              )}
              {displayPhone && <span>WhatsApp: {displayPhone}</span>}
              {!displayPhone && !customer.matricNumber && (
                <span>No contact details on file</span>
              )}
            </div>
          </div>

          {/* Score ring */}
          <div className="text-center flex-shrink-0">
            <ScoreRing score={customer.vodiumScore} tier={tier} />
            <p className="text-xs text-vodium-cream/35 mt-2">Vodium Score</p>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border mt-1 inline-block ${tier.badge}`}
            >
              {tier.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total credits",
            value: String(credits.length),
            accent: "text-vodium-cream",
            border: "border-white/[0.08]",
            bg: "bg-white/[0.02]",
          },
          {
            label: "Amount owed",
            value: totalOwed > 0 ? formatNaira(totalOwed) : "Settled",
            accent: totalOwed > 0 ? "text-amber-400" : "text-emerald-400",
            border:
              totalOwed > 0 ? "border-amber-500/20" : "border-emerald-500/20",
            bg: totalOwed > 0 ? "bg-amber-500/[0.04]" : "bg-emerald-500/[0.04]",
          },
          {
            label: "Amount recovered",
            value: formatNaira(totalPaid),
            accent: "text-emerald-400",
            border: "border-emerald-500/20",
            bg: "bg-emerald-500/[0.04]",
          },
          {
            label: "Recovery rate",
            value: `${recoveryRate}%`,
            accent: "text-vodium-gold",
            border: "border-vodium-gold/20",
            bg: "bg-vodium-gold/[0.04]",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border ${s.border} ${s.bg} px-5 py-4`}
          >
            <p className={`font-serif text-2xl font-bold ${s.accent}`}>
              {s.value}
            </p>
            <p className="text-[11px] text-vodium-cream/30 uppercase tracking-wider mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main grid: credits + score history ─────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Credit history — 3 cols */}
        <div className="lg:col-span-3 bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <BarChart3 size={15} className="text-vodium-gold" />
            <h2 className="font-semibold text-vodium-cream text-sm">
              Credit history with your shop
            </h2>
          </div>

          {credits.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-vodium-cream/30">
              No credits recorded yet.
            </p>
          ) : (
            <div>
              {credits.map((c) => {
                const isOverdue = c.status === "OVERDUE";
                const daysOverdue = isOverdue
                  ? Math.floor(
                      (now.getTime() - new Date(c.dueDate).getTime()) /
                        86_400_000,
                    )
                  : null;
                return (
                  <div
                    key={c.id}
                    className="px-6 py-4 border-b border-white/[0.04] last:border-0 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-serif text-vodium-gold text-sm font-semibold">
                          {formatNaira(Number(c.amount))}
                        </p>
                        <span className={STATUS_BADGE[c.status]}>
                          {STATUS_LABEL[c.status]}
                        </span>
                      </div>
                      <p className="text-xs text-vodium-cream/30 mt-0.5 truncate">
                        {c.description ?? "No description"} · Due{" "}
                        {new Date(c.dueDate).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {daysOverdue !== null && (
                          <span className="text-rose-400 ml-1">
                            ({daysOverdue}d overdue)
                          </span>
                        )}
                      </p>
                      {Number(c.amountRepaid) > 0 && (
                        <p className="text-xs text-emerald-400/70 mt-0.5">
                          {formatNaira(Number(c.amountRepaid))} repaid
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] text-vodium-cream/25 whitespace-nowrap flex-shrink-0">
                      {new Date(c.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Score history — 2 cols */}
        <div className="lg:col-span-2 bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <TrendingUp size={15} className="text-vodium-gold" />
            <h2 className="font-semibold text-vodium-cream text-sm">
              Score history
            </h2>
          </div>

          {scoreEvents.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-vodium-cream/30">
              No score events yet.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.04] max-h-[480px] overflow-y-auto">
              {scoreEvents.map((ev) => {
                const meta = EVENT_META[ev.eventType];
                const delta = ev.scoreDelta;
                const isPositive = delta > 0;
                const isNeutral = delta === 0;
                return (
                  <div
                    key={ev.id}
                    className="px-5 py-3.5 flex items-center gap-3"
                  >
                    <div className={`flex-shrink-0 ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-vodium-cream/80">
                        {meta.label}
                      </p>
                      <p className="text-[10px] text-vodium-cream/25 mt-0.5">
                        {new Date(ev.occurredAt).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {!isNeutral && (
                      <span
                        className={`text-xs font-bold flex-shrink-0 ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {isPositive ? "+" : ""}
                        {delta}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Score legend */}
          <div className="px-5 py-4 border-t border-white/[0.05] space-y-1">
            <p className="text-[10px] text-vodium-cream/20 uppercase tracking-widest mb-2">
              Score bands
            </p>
            {[
              {
                range: "750–1000",
                label: "Excellent",
                cls: "text-emerald-400",
              },
              { range: "650–749", label: "Good", cls: "text-vodium-gold" },
              { range: "450–649", label: "Fair", cls: "text-amber-400" },
              { range: "0–449", label: "Poor", cls: "text-rose-400" },
            ].map((t) => (
              <div
                key={t.label}
                className="flex items-center justify-between text-[11px]"
              >
                <span className={t.cls}>{t.label}</span>
                <span className="text-vodium-cream/25">{t.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add new credit CTA */}
      <div className="flex justify-end">
        <Link
          href={`/dashboard/credit/new?customer=${encodeURIComponent(customer.fullName)}`}
          className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
        >
          <CreditCard size={14} /> Record new credit
        </Link>
      </div>
    </div>
  );
}
