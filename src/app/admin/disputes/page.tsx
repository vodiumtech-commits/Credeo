"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  Store,
  User,
  Clock,
} from "lucide-react";
import { formatNaira } from "@/lib/utils";

interface DisputeRow {
  id: string;
  status: "OPEN" | "IN_REVIEW" | "UPHELD" | "REJECTED";
  reason: string | null;
  resolution: string | null;
  handledAt: string | null;
  createdAt: string;
  student: { id: string; fullName: string; phone: string; vodiumScore: number };
  vendor: { id: string; businessName: string; ownerName: string; phone: string };
  credit: { id: string; amount: number; description: string | null; dueDate: string; status: string };
}

const STATUS_STYLE: Record<DisputeRow["status"], string> = {
  OPEN:      "text-amber-300   bg-amber-500/10   border-amber-500/25",
  IN_REVIEW: "text-sky-300     bg-sky-500/10     border-sky-500/25",
  UPHELD:    "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  REJECTED:  "text-vodium-cream/40 bg-white/[0.04] border-white/[0.08]",
};

const STATUS_LABEL: Record<DisputeRow["status"], string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  UPHELD: "Upheld",
  REJECTED: "Rejected",
};

const FILTERS = ["OPEN", "IN_REVIEW", "UPHELD", "REJECTED"] as const;

export default function AdminDisputesPage() {
  const [rows, setRows] = useState<DisputeRow[]>([]);
  const [stats, setStats] = useState({ open: 0, inReview: 0, upheld: 0, rejected: 0 });
  const [canAct, setCanAct] = useState(false);
  const [role, setRole] = useState<string>("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number] | "ALL">("OPEN");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === "ALL" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/admin/disputes${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load disputes");
      setRows(data.disputes ?? []);
      setStats(data.stats ?? { open: 0, inReview: 0, upheld: 0, rejected: 0 });
      setCanAct(Boolean(data.canAct));
      setRole(data.role ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "IN_REVIEW" | "UPHELD" | "REJECTED") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: notes[id]?.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update dispute");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-vodium-cream flex items-center gap-2">
            <ShieldAlert size={20} className="text-vodium-gold" /> Disputes
          </h1>
          <p className="text-sm text-vodium-cream/40 mt-1">
            Customers contesting a credit logged against them.
            {!canAct && role
              ? " You have view-only access — customer care attends to these."
              : ""}
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 text-xs text-vodium-cream/50 hover:text-vodium-gold border border-white/[0.08] rounded-lg px-3 py-2"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Open" value={stats.open} tone="amber" />
        <Stat label="In review" value={stats.inReview} tone="sky" />
        <Stat label="Upheld" value={stats.upheld} tone="emerald" />
        <Stat label="Rejected" value={stats.rejected} tone="muted" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...FILTERS] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              filter === f
                ? "border-vodium-gold bg-vodium-gold/10 text-vodium-gold"
                : "border-white/[0.08] text-vodium-cream/40 hover:text-vodium-cream/70"
            }`}
          >
            {f === "ALL" ? "All" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-vodium-cream/40 py-10 justify-center">
          <Loader2 size={15} className="animate-spin text-vodium-gold" /> Loading disputes…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal py-14 text-center">
          <CheckCircle2 size={26} className="text-emerald-400/60 mx-auto mb-3" />
          <p className="text-sm text-vodium-cream/50">Nothing here. No disputes with this status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((d) => (
            <div key={d.id} className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLE[d.status]}`}>
                      {STATUS_LABEL[d.status]}
                    </span>
                    <span className="text-vodium-gold font-semibold">{formatNaira(d.credit.amount)}</span>
                    <span className="text-xs text-vodium-cream/30 inline-flex items-center gap-1">
                      <Clock size={11} /> {new Date(d.createdAt).toLocaleString("en-NG")}
                    </span>
                  </div>

                  <div className="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                    <p className="text-vodium-cream/60 inline-flex items-center gap-2">
                      <User size={13} className="text-vodium-gold/60" />
                      <span className="text-vodium-cream">{d.student.fullName}</span>
                      <span className="text-vodium-cream/30 text-xs">{d.student.phone}</span>
                      <span className="text-vodium-cream/30 text-xs">· score {d.student.vodiumScore}</span>
                    </p>
                    <p className="text-vodium-cream/60 inline-flex items-center gap-2">
                      <Store size={13} className="text-vodium-gold/60" />
                      <span className="text-vodium-cream">{d.vendor.businessName}</span>
                      <span className="text-vodium-cream/30 text-xs">{d.vendor.phone}</span>
                    </p>
                  </div>

                  {d.credit.description && (
                    <p className="text-xs text-vodium-cream/40 mt-2">For: {d.credit.description}</p>
                  )}
                  {d.reason && (
                    <p className="text-xs text-vodium-cream/45 mt-2 italic">&ldquo;{d.reason}&rdquo;</p>
                  )}
                  {d.resolution && (
                    <p className="text-xs text-vodium-cream/60 mt-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                      <span className="text-vodium-gold/70">Note:</span> {d.resolution}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions — customer care only */}
              {canAct && !["UPHELD", "REJECTED"].includes(d.status) && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
                  <input
                    value={notes[d.id] ?? ""}
                    onChange={(e) => setNotes((p) => ({ ...p, [d.id]: e.target.value }))}
                    placeholder="Add a note (what you found, who you spoke to)…"
                    className="w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
                  />
                  <div className="flex flex-wrap gap-2">
                    {d.status === "OPEN" && (
                      <button
                        onClick={() => act(d.id, "IN_REVIEW")}
                        disabled={busyId === d.id}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-sky-500/30 text-sky-300 hover:bg-sky-500/10 disabled:opacity-40"
                      >
                        <Eye size={13} /> Take it
                      </button>
                    )}
                    <button
                      onClick={() => act(d.id, "UPHELD")}
                      disabled={busyId === d.id}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                    >
                      {busyId === d.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Uphold — void the credit
                    </button>
                    <button
                      onClick={() => act(d.id, "REJECTED")}
                      disabled={busyId === d.id}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      <XCircle size={13} /> Reject — credit stands
                    </button>
                  </div>
                  <p className="text-[11px] text-vodium-cream/25">
                    Upholding voids the credit and erases its score impact. Both outcomes message the customer.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "amber" | "sky" | "emerald" | "muted" }) {
  const color = {
    amber: "text-amber-300",
    sky: "text-sky-300",
    emerald: "text-emerald-300",
    muted: "text-vodium-cream/40",
  }[tone];
  return (
    <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal px-4 py-3">
      <p className={`font-serif text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-vodium-cream/35 mt-0.5">{label}</p>
    </div>
  );
}
