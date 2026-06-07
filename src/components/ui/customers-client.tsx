"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, X, Users, ArrowRight } from "lucide-react";
import { formatNaira } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerRow {
  id:           string;
  fullName:     string;
  matricNumber: string | null;
  vodiumScore:  number;
  creditCount:  number;
  totalOwed:    number;
  creditStatus: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreTier(score: number) {
  if (score >= 750) return { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", label: "Excellent", bar: "bg-emerald-400" };
  if (score >= 650) return { cls: "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/25",  label: "Good",      bar: "bg-vodium-gold" };
  if (score >= 450) return { cls: "bg-amber-500/10 text-amber-400 border-amber-500/25",        label: "Fair",      bar: "bg-amber-400" };
  return            { cls: "bg-rose-500/10 text-rose-400 border-rose-500/25",                  label: "Poor",      bar: "bg-rose-400" };
}

const STATUS_MAP: Record<string, { dot: string; label: string; text: string }> = {
  overdue:  { dot: "bg-rose-400",    label: "Overdue",  text: "text-rose-400" },
  due_soon: { dot: "bg-amber-400",   label: "Due soon", text: "text-amber-400" },
  owing:    { dot: "bg-amber-300",   label: "Owing",    text: "text-amber-300" },
  settled:  { dot: "bg-emerald-400", label: "Settled",  text: "text-emerald-400" },
};

const FILTERS = ["All", "Overdue", "Owing", "Settled"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function CustomersClient({
  rows,
}: {
  rows: CustomerRow[];
}) {
  const [search,    setSearch]    = useState("");
  const [activeTab, setActiveTab] = useState<typeof FILTERS[number]>("All");

  const filtered = useMemo(() => {
    let r = rows;

    if (activeTab === "Overdue") r = r.filter((s) => s.creditStatus === "overdue");
    else if (activeTab === "Owing") r = r.filter((s) => ["owing", "due_soon"].includes(s.creditStatus));
    else if (activeTab === "Settled") r = r.filter((s) => s.creditStatus === "settled");

    const q = search.trim().toLowerCase();
    if (q) r = r.filter(
      (s) => s.fullName.toLowerCase().includes(q) || (s.matricNumber ?? "").toLowerCase().includes(q)
    );

    return r;
  }, [rows, activeTab, search]);

  const totalCount   = rows.length;
  const owingCount   = rows.filter((r) => r.creditStatus !== "settled").length;
  const overdueCount = rows.filter((r) => r.creditStatus === "overdue").length;
  const settledCount = rows.filter((r) => r.creditStatus === "settled").length;

  const cards = [
    { label: "Total",   value: totalCount,   accent: "text-vodium-cream",  ring: "ring-white/[0.08]", bg: "bg-white/[0.03]" },
    { label: "Owing",   value: owingCount,   accent: "text-amber-400",     ring: "ring-amber-500/20", bg: "bg-amber-500/[0.05]" },
    { label: "Overdue", value: overdueCount, accent: "text-rose-400",      ring: "ring-rose-500/20",  bg: "bg-rose-500/[0.05]" },
    { label: "Settled", value: settledCount, accent: "text-emerald-400",   ring: "ring-emerald-500/20",bg:"bg-emerald-500/[0.05]"},
  ] as const;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Customers</h1>
          <p className="text-sm text-vodium-cream/40 mt-1">
            {totalCount} student{totalCount !== 1 ? "s" : ""} on your book
          </p>
        </div>
        <Link
          href="/dashboard/credit/new"
          className="btn-gold h-9 px-4 rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0"
        >
          <Plus size={14} /> New credit
        </Link>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl ring-1 ${c.ring} ${c.bg} px-4 py-3.5 space-y-1.5`}>
            <p className={`font-serif text-3xl leading-none ${c.accent}`}>{c.value}</p>
            <p className="text-[10px] text-vodium-cream/30 uppercase tracking-widest font-semibold">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or matric number…"
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
        <div className="flex gap-1.5">
          {FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "h-9 px-3.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                activeTab === tab
                  ? "bg-vodium-gold text-vodium-black"
                  : "bg-white/[0.04] text-vodium-cream/45 hover:bg-white/[0.07] hover:text-vodium-cream border border-white/[0.07]",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">

        {/* Desktop headers */}
        <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-vodium-cream/22 uppercase tracking-[0.12em]">
          <span className="col-span-4">Customer</span>
          <span className="col-span-3 text-center">Vodium Score</span>
          <span className="col-span-1 text-center">Credits</span>
          <span className="col-span-2 text-right">Balance</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1" />
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="px-6 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-vodium-gold/[0.07] border border-vodium-gold/15 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-vodium-gold/40" />
            </div>
            {rows.length === 0 ? (
              <>
                <p className="text-vodium-cream/40 text-sm mb-1">No customers yet.</p>
                <p className="text-vodium-cream/22 text-xs mb-6">Record your first credit to add one.</p>
                <Link href="/dashboard/credit/new" className="btn-gold px-6 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
                  <Plus size={14} /> Add first credit
                </Link>
              </>
            ) : (
              <>
                <p className="text-vodium-cream/40 text-sm">No customers match your search.</p>
                <button onClick={() => { setSearch(""); setActiveTab("All"); }} className="text-vodium-gold text-xs hover:underline mt-2 block mx-auto">
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Rows */}
        {filtered.map((s) => {
          const tier   = getScoreTier(s.vodiumScore);
          const sm     = STATUS_MAP[s.creditStatus] ?? { dot: "bg-vodium-cream/20", label: s.creditStatus, text: "text-vodium-cream/40" };
          const isOver = s.creditStatus === "overdue";
          const balanceColor = isOver ? "text-rose-400" : s.totalOwed > 0 ? "text-amber-400" : "text-emerald-400";

          return (
            <Link
              key={s.id}
              href={`/dashboard/customers/${s.id}`}
              className={[
                "group flex md:grid md:grid-cols-12 items-center px-5 py-4 border-b border-white/[0.04] last:border-0 transition-colors gap-3",
                isOver ? "hover:bg-rose-500/[0.04]" : "hover:bg-white/[0.025]",
              ].join(" ")}
            >
              {/* Avatar + name */}
              <div className="col-span-4 flex items-center gap-3 min-w-0 flex-1 md:flex-none">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold font-serif ${isOver ? "bg-rose-500/15 text-rose-400" : "bg-vodium-gold/10 text-vodium-gold"}`}>
                  {s.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-vodium-cream truncate leading-tight">{s.fullName}</p>
                  <p className="text-[10px] text-vodium-cream/30 mt-0.5">{s.matricNumber ?? "No matric"}</p>
                </div>
              </div>

              {/* Score */}
              <div className="col-span-3 hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center gap-1 w-28">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${tier.cls.split(" ")[1]}`}>{s.vodiumScore}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${tier.cls}`}>{tier.label}</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier.bar} transition-all`}
                      style={{ width: `${(s.vodiumScore / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Credit count */}
              <div className="col-span-1 hidden md:flex justify-center">
                <span className="text-sm text-vodium-cream/45">{s.creditCount}</span>
              </div>

              {/* Balance */}
              <div className="col-span-2 hidden md:block text-right">
                <p className={`font-serif text-sm font-semibold ${balanceColor}`}>
                  {s.totalOwed > 0 ? formatNaira(s.totalOwed) : "Settled"}
                </p>
              </div>

              {/* Status */}
              <div className="col-span-1 hidden md:flex justify-center">
                <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${sm.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} flex-shrink-0`} />
                  {sm.label}
                </span>
              </div>

              {/* Arrow */}
              <div className="col-span-1 flex justify-end items-center ml-auto md:ml-0">
                {/* Mobile balance */}
                <span className={`md:hidden font-serif text-sm font-bold mr-3 ${balanceColor}`}>
                  {s.totalOwed > 0 ? formatNaira(s.totalOwed) : "✓"}
                </span>
                <ArrowRight size={14} className="text-vodium-cream/20 group-hover:text-vodium-gold transition-colors flex-shrink-0" />
              </div>
            </Link>
          );
        })}

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/[0.05] text-[11px] text-vodium-cream/22">
            {filtered.length === rows.length
              ? `${rows.length} customer${rows.length !== 1 ? "s" : ""}`
              : `Showing ${filtered.length} of ${rows.length}`}
          </div>
        )}
      </div>

      {/* Score legend */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-vodium-cream/25">
          <span>Vodium score:</span>
          {[
            { range: "750–1000", label: "Excellent", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
            { range: "650–749",  label: "Good",      cls: "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/20" },
            { range: "450–649",  label: "Fair",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { range: "0–449",    label: "Poor",      cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
          ].map((t) => (
            <span key={t.label} className={`px-2 py-0.5 rounded-full border font-semibold ${t.cls}`}>
              {t.label} · {t.range}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
