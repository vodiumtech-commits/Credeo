"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Download,
  Search,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  CreditCard,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { MarkPaidButton } from "@/components/ui/mark-paid-button";
import { formatNaira } from "@/lib/utils";
import type { CreditStatus } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreditRow {
  id: string;
  amount: number;
  amountRepaid: number;
  status: CreditStatus;
  description: string | null;
  dueDate: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    matricNumber: string | null;
  };
}

interface Stats {
  outstandingAmount: number;
  overdueAmount: number;
  paidAmount: number;
  recoveryRate: number;
  overdueCount: number;
  paidCount: number;
  totalCount: number;
}

// ── Badge config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CreditStatus,
  { label: string; className: string; dot: string }
> = {
  OUTSTANDING: {
    label: "Outstanding",
    className: "text-sky-400 bg-sky-500/10 border border-sky-500/20",
    dot: "bg-sky-400",
  },
  DUE_SOON: {
    label: "Due soon",
    className: "text-amber-400 bg-amber-500/10 border border-amber-500/20",
    dot: "bg-amber-400",
  },
  OVERDUE: {
    label: "Overdue",
    className: "text-rose-400 bg-rose-500/10 border border-rose-500/20",
    dot: "bg-rose-400",
  },
  PARTIALLY_PAID: {
    label: "Partial",
    className: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
    dot: "bg-purple-400",
  },
  PAID: {
    label: "Paid",
    className:
      "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  WRITTEN_OFF: {
    label: "Written off",
    className:
      "text-vodium-cream/30 bg-white/[0.04] border border-white/[0.07]",
    dot: "bg-vodium-cream/20",
  },
};

const FILTER_TABS: Array<{ key: CreditStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "DUE_SOON", label: "Due soon" },
  { key: "OUTSTANDING", label: "Outstanding" },
  { key: "PARTIALLY_PAID", label: "Partial" },
  { key: "PAID", label: "Paid" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function CreditsClient({
  credits,
  stats,
}: {
  credits: CreditRow[];
  stats: Stats;
}) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<CreditStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "due">("date");
  const [sortDesc, setSortDesc] = useState(true);
  const [showSort, setShowSort] = useState(false);

  const filtered = useMemo(() => {
    let rows = credits;

    // Status filter
    if (filterTab !== "ALL") rows = rows.filter((c) => c.status === filterTab);

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (c) =>
          c.student.fullName.toLowerCase().includes(q) ||
          (c.student.matricNumber ?? "").toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q),
      );
    }

    // Sort
    rows = [...rows].sort((a, b) => {
      let diff = 0;
      if (sortBy === "amount") diff = a.amount - b.amount;
      else if (sortBy === "due")
        diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      else
        diff =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDesc ? -diff : diff;
    });

    return rows;
  }, [credits, filterTab, search, sortBy, sortDesc]);

  const toggleSort = (key: typeof sortBy) => {
    if (sortBy === key) setSortDesc((d) => !d);
    else {
      setSortBy(key);
      setSortDesc(true);
    }
    setShowSort(false);
  };

  const statCards = [
    {
      label: "Outstanding",
      value: formatNaira(stats.outstandingAmount),
      icon: <DollarSign size={16} />,
      accent: "text-sky-400",
      ring: "ring-sky-500/20",
      bg: "bg-sky-500/[0.07]",
    },
    {
      label: "Overdue",
      value: formatNaira(stats.overdueAmount),
      icon: <AlertCircle size={16} />,
      accent: "text-rose-400",
      ring: "ring-rose-500/20",
      bg: "bg-rose-500/[0.07]",
    },
    {
      label: "Recovered",
      value: formatNaira(stats.paidAmount),
      icon: <CheckCircle2 size={16} />,
      accent: "text-emerald-400",
      ring: "ring-emerald-500/20",
      bg: "bg-emerald-500/[0.07]",
    },
    {
      label: "Recovery",
      value: `${stats.recoveryRate}%`,
      icon: <TrendingUp size={16} />,
      accent: "text-vodium-gold",
      ring: "ring-vodium-gold/20",
      bg: "bg-vodium-gold/[0.07]",
    },
  ] as const;

  return (
    <div className="p-5 md:p-8 max-w-[1200px] mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">
            Credits
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-vodium-cream/35">
            <span>{stats.totalCount} total</span>
            {stats.overdueCount > 0 && (
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                {stats.overdueCount} overdue
              </span>
            )}
            {stats.paidCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {stats.paidCount} paid
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {credits.length > 0 && (
            <a
              href="/api/credits/export"
              className="h-9 px-4 rounded-lg text-xs flex items-center gap-1.5 border border-white/[0.10] text-vodium-cream/45 hover:text-vodium-cream hover:border-white/[0.20] transition-colors"
            >
              <Download size={13} /> Export CSV
            </a>
          )}
          <Link
            href="/dashboard/credit/new"
            className="btn-gold h-9 px-4 rounded-lg text-xs flex items-center gap-1.5"
          >
            <Plus size={14} /> New credit
          </Link>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl ring-1 ${s.ring} ${s.bg} p-4 space-y-2.5`}
          >
            <div
              className={`w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center ${s.accent}`}
            >
              {s.icon}
            </div>
            <p className={`font-serif text-xl ${s.accent} leading-none`}>
              {s.value}
            </p>
            <p className="text-[10px] text-vodium-cream/35 uppercase tracking-widest font-semibold">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search
            size={14}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by name, matric number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark pl-9 pr-9 h-9 text-sm w-full"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream/70 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort((v) => !v)}
            className="h-9 px-3.5 rounded-lg border border-white/[0.10] text-vodium-cream/50 hover:text-vodium-cream hover:border-white/20 text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <ArrowUpDown size={13} />
            Sort:{" "}
            {sortBy === "date"
              ? "Date added"
              : sortBy === "amount"
                ? "Amount"
                : "Due date"}
            <ChevronDown size={11} />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1.5 bg-vodium-charcoal border border-white/[0.09] rounded-xl shadow-xl z-20 min-w-[160px] py-1 overflow-hidden">
              {(["date", "amount", "due"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => toggleSort(k)}
                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${sortBy === k ? "text-vodium-gold bg-vodium-gold/10" : "text-vodium-cream/60 hover:text-vodium-cream hover:bg-white/[0.04]"}`}
                >
                  {k === "date"
                    ? "Date added"
                    : k === "amount"
                      ? "Amount"
                      : "Due date"}
                  {sortBy === k && (
                    <span className="ml-1.5 opacity-60">
                      {sortDesc ? "↓" : "↑"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Status tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "ALL"
              ? credits.length
              : credits.filter((c) => c.status === tab.key).length;
          const active = filterTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={[
                "flex-shrink-0 h-8 px-3.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                active
                  ? "bg-vodium-gold text-vodium-black"
                  : "bg-white/[0.04] text-vodium-cream/45 hover:bg-white/[0.07] hover:text-vodium-cream border border-white/[0.07]",
              ].join(" ")}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`ml-1.5 text-[10px] ${active ? "text-vodium-black/60" : "text-vodium-cream/25"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">
        {/* Desktop column headers */}
        <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-vodium-cream/22 uppercase tracking-[0.12em]">
          <span className="col-span-3">Student</span>
          <span className="col-span-2">Note</span>
          <span className="col-span-2 text-right">Amount</span>
          <span className="col-span-2 text-right">Repaid</span>
          <span className="col-span-1 text-center">Due</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1 text-center">Act</span>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-vodium-gold/[0.07] border border-vodium-gold/15 flex items-center justify-center mx-auto mb-4">
              <CreditCard size={24} className="text-vodium-gold/40" />
            </div>
            {credits.length === 0 ? (
              <>
                <p className="text-vodium-cream/40 text-sm mb-1">
                  No credits recorded yet.
                </p>
                <p className="text-vodium-cream/22 text-xs mb-6">
                  Start tracking your first credit.
                </p>
                <Link
                  href="/dashboard/credit/new"
                  className="btn-gold px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
                >
                  <Plus size={14} /> Record first credit
                </Link>
              </>
            ) : (
              <>
                <p className="text-vodium-cream/40 text-sm mb-1">
                  No credits match your filter.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterTab("ALL");
                  }}
                  className="text-vodium-gold text-xs hover:underline mt-2"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Rows */}
        {filtered.map((c) => {
          const cfg = STATUS_CONFIG[c.status];
          const isPaid = c.status === "PAID" || c.status === "WRITTEN_OFF";
          const isOverdue = c.status === "OVERDUE";
          const dueDate = new Date(c.dueDate);
          const dueLabel = dueDate.toLocaleDateString("en-NG", {
            month: "short",
            day: "numeric",
          });
          const balance = c.amount - c.amountRepaid;

          return (
            <div
              key={c.id}
              className={[
                "group border-b border-white/[0.04] last:border-0 transition-colors",
                isOverdue
                  ? "bg-rose-500/[0.025] hover:bg-rose-500/[0.04]"
                  : "hover:bg-white/[0.02]",
              ].join(" ")}
            >
              {/* Mobile layout */}
              <div className="md:hidden px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-vodium-cream truncate">
                      {c.student.fullName}
                    </p>
                    {c.student.matricNumber && (
                      <p className="text-xs text-vodium-cream/35 mt-0.5">
                        {c.student.matricNumber}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.className}`}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-vodium-cream/35 mb-0.5">
                      Amount
                    </p>
                    <p className="font-serif text-base text-vodium-gold">
                      {formatNaira(c.amount)}
                    </p>
                  </div>
                  {c.amountRepaid > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-vodium-cream/35 mb-0.5">
                        Repaid
                      </p>
                      <p className="font-serif text-base text-emerald-400">
                        {formatNaira(c.amountRepaid)}
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-vodium-cream/35 mb-0.5">
                      Balance
                    </p>
                    <p
                      className={`font-serif text-base ${isPaid ? "text-vodium-cream/25" : isOverdue ? "text-rose-400" : "text-vodium-cream"}`}
                    >
                      {formatNaira(balance)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-vodium-cream/35">Due {dueLabel}</p>
                  <MarkPaidButton
                    creditId={c.id}
                    studentName={c.student.fullName}
                    totalAmount={c.amount}
                    amountRepaid={c.amountRepaid}
                    isPaid={isPaid}
                  />
                </div>
              </div>

              {/* Desktop grid */}
              <div className="hidden md:grid grid-cols-12 items-center px-5 py-3.5 gap-2">
                {/* Student */}
                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${isOverdue ? "bg-rose-500/15 text-rose-400" : "bg-vodium-gold/10 text-vodium-gold"}`}
                  >
                    {c.student.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-vodium-cream font-medium truncate leading-tight">
                      {c.student.fullName}
                    </p>
                    <p className="text-[10px] text-vodium-cream/30 mt-0.5">
                      {c.student.matricNumber ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Note */}
                <div className="col-span-2">
                  <p className="text-xs text-vodium-cream/35 truncate">
                    {c.description ?? "—"}
                  </p>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                  <p className="font-serif text-sm text-vodium-gold">
                    {formatNaira(c.amount)}
                  </p>
                </div>

                {/* Repaid */}
                <div className="col-span-2 text-right">
                  <p
                    className={`text-sm font-medium ${c.amountRepaid > 0 ? "text-emerald-400" : "text-vodium-cream/20"}`}
                  >
                    {formatNaira(c.amountRepaid)}
                  </p>
                </div>

                {/* Due */}
                <div className="col-span-1 text-center">
                  <p
                    className={`text-[11px] ${isOverdue ? "text-rose-400" : "text-vodium-cream/35"}`}
                  >
                    {dueLabel}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-1 flex justify-center">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-center">
                  <MarkPaidButton
                    creditId={c.id}
                    studentName={c.student.fullName}
                    totalAmount={c.amount}
                    amountRepaid={c.amountRepaid}
                    isPaid={isPaid}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-[11px] text-vodium-cream/25">
              {filtered.length === credits.length
                ? `${credits.length} credit${credits.length !== 1 ? "s" : ""}`
                : `${filtered.length} of ${credits.length} credits`}
            </span>
            <Link
              href="/dashboard/credit/new"
              className="text-[11px] text-vodium-gold hover:text-vodium-gold/70 flex items-center gap-1 transition-colors"
            >
              Add new <Plus size={10} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
