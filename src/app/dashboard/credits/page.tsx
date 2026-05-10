import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Plus, ArrowRight, TrendingUp, AlertCircle, CheckCircle2,
  DollarSign, CreditCard,
} from "lucide-react";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import type { CreditStatus } from "@prisma/client";

const STATUS_BADGE: Record<CreditStatus, string> = {
  OUTSTANDING:    "badge badge-outstanding",
  DUE_SOON:       "badge badge-due-soon",
  OVERDUE:        "badge badge-overdue",
  PARTIALLY_PAID: "badge badge-partial",
  PAID:           "badge badge-paid",
  WRITTEN_OFF:    "badge badge-written",
};

const STATUS_LABEL: Record<CreditStatus, string> = {
  OUTSTANDING:    "Outstanding",
  DUE_SOON:       "Due soon",
  OVERDUE:        "Overdue",
  PARTIALLY_PAID: "Partial",
  PAID:           "Paid",
  WRITTEN_OFF:    "Written off",
};

export default async function CreditsPage() {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  const credits = await prisma.credit.findMany({
    where: { vendorId: vendor.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const outstandingAmount = credits
    .filter((c) => ["OUTSTANDING", "DUE_SOON", "PARTIALLY_PAID"].includes(c.status))
    .reduce((s, c) => s + Number(c.amount) - Number(c.amountRepaid), 0);
  const overdueAmount = credits
    .filter((c) => c.status === "OVERDUE")
    .reduce((s, c) => s + Number(c.amount) - Number(c.amountRepaid), 0);
  const paidAmount = credits
    .filter((c) => c.status === "PAID")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalAmount = credits.reduce((s, c) => s + Number(c.amount), 0);

  const overdueCount = credits.filter((c) => c.status === "OVERDUE").length;
  const paidCount = credits.filter((c) => c.status === "PAID").length;

  const recoveryRate =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const statCards = [
    {
      label: "Total Outstanding",
      value: formatNaira(outstandingAmount),
      icon: <DollarSign size={15} />,
      accent: "text-indigo-400",
      border: "border-indigo-500/20",
      bg: "bg-indigo-500/[0.06]",
    },
    {
      label: "Overdue",
      value: formatNaira(overdueAmount),
      icon: <AlertCircle size={15} />,
      accent: "text-rose-400",
      border: "border-rose-500/20",
      bg: "bg-rose-500/[0.06]",
    },
    {
      label: "Recovered",
      value: formatNaira(paidAmount),
      icon: <CheckCircle2 size={15} />,
      accent: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.06]",
    },
    {
      label: "Recovery Rate",
      value: `${recoveryRate}%`,
      icon: <TrendingUp size={15} />,
      accent: "text-vodium-gold",
      border: "border-vodium-gold/20",
      bg: "bg-vodium-gold/[0.06]",
    },
  ] as const;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Credits</h1>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-vodium-cream/40">
            <span>{credits.length} total</span>
            {overdueCount > 0 && (
              <span className="text-rose-400 font-medium">{overdueCount} overdue</span>
            )}
            {paidCount > 0 && (
              <span className="text-emerald-400 font-medium">{paidCount} paid</span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/credit/new"
          className="btn-gold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={15} /> New credit
        </Link>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border ${s.border} ${s.bg} p-4 space-y-2`}
          >
            <div className={`w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center ${s.accent}`}>
              {s.icon}
            </div>
            <p className={`font-serif text-xl ${s.accent}`}>{s.value}</p>
            <p className="text-[11px] text-vodium-cream/35 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Credits table */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">

        {/* Table header row */}
        <div className="hidden md:grid grid-cols-12 px-6 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-vodium-cream/25 uppercase tracking-widest">
          <span className="col-span-3">Student</span>
          <span className="col-span-3">Description</span>
          <span className="col-span-2 text-right">Amount</span>
          <span className="col-span-2 text-right">Repaid</span>
          <span className="col-span-1 text-center">Due</span>
          <span className="col-span-1 text-center">Status</span>
        </div>

        {credits.length === 0 ? (
          /* Dark empty state */
          <div className="px-6 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-vodium-gold/[0.08] border border-vodium-gold/15 flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-vodium-gold/40" />
            </div>
            <p className="text-vodium-cream/40 text-sm mb-1">No credits yet.</p>
            <p className="text-vodium-cream/25 text-xs mb-6">Start tracking your first credit.</p>
            <Link
              href="/dashboard/credit/new"
              className="btn-gold px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2"
            >
              <Plus size={15} /> Record first credit
            </Link>
          </div>
        ) : (
          credits.map((c) => {
            const isOverdue = c.status === "OVERDUE";
            return (
              <div
                key={c.id}
                className={[
                  "md:grid grid-cols-12 items-center px-6 py-4 table-row-dark gap-2",
                  isOverdue ? "bg-rose-500/[0.03]" : "",
                ].join(" ")}
              >
                {/* Student */}
                <div className="col-span-3 mb-1 md:mb-0">
                  <p className="font-medium text-sm text-vodium-cream">{c.student.fullName}</p>
                  <p className="text-xs text-vodium-cream/30 mt-0.5">{c.student.matricNumber ?? "—"}</p>
                </div>

                {/* Description */}
                <div className="col-span-3 mb-1 md:mb-0">
                  <p className="text-sm text-vodium-cream/40 truncate">{c.description ?? "—"}</p>
                </div>

                {/* Amount — serif gold for owed amounts */}
                <div className="col-span-2 text-right mb-1 md:mb-0">
                  <p className="font-serif text-sm text-vodium-gold">
                    {formatNaira(Number(c.amount))}
                  </p>
                </div>

                {/* Repaid */}
                <div className="col-span-2 text-right mb-1 md:mb-0">
                  <p className={`text-sm font-medium ${Number(c.amountRepaid) > 0 ? "text-emerald-400" : "text-vodium-cream/25"}`}>
                    {formatNaira(Number(c.amountRepaid))}
                  </p>
                </div>

                {/* Due date */}
                <div className="col-span-1 text-center mb-1 md:mb-0">
                  <p className="text-xs text-vodium-cream/35">
                    {new Date(c.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                  </p>
                </div>

                {/* Status badge */}
                <div className="col-span-1 flex justify-center">
                  <span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span>
                </div>
              </div>
            );
          })
        )}

        {credits.length > 0 && (
          <div className="px-6 py-4 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-xs text-vodium-cream/25">
              Showing {credits.length} credit{credits.length !== 1 ? "s" : ""}
            </span>
            <Link
              href="/dashboard/credit/new"
              className="text-xs text-vodium-gold hover:text-vodium-gold/80 flex items-center gap-1 transition-colors"
            >
              Add new <ArrowRight size={11} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
