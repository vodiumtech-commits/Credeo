"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Megaphone,
  Loader2,
  RefreshCw,
  Plus,
  Copy,
  Check,
  MousePointerClick,
  Store,
  Zap,
  Banknote,
  X,
} from "lucide-react";
import { formatNaira } from "@/lib/utils";

interface Funnel {
  clicks: number;
  signups: number;
  activated: number;
  creditsLogged: number;
  totalTracked: number;
  activeThisWeek: number;
  activationRate: number;
  costPerSignup: number | null;
}

interface AmbassadorRow {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  campus: string | null;
  stipend: number | null;
  status: "ACTIVE" | "INACTIVE";
  statsToken: string;
  funnel: Funnel;
}

export default function AdminMarketingPage() {
  const [rows, setRows] = useState<AmbassadorRow[]>([]);
  const [totals, setTotals] = useState({ clicks: 0, signups: 0, activated: 0, creditsLogged: 0, totalTracked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ambassadors");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load ambassadors");
      setRows(data.ambassadors ?? []);
      setTotals(data.totals ?? totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); } catch { window.prompt("Copy:", text); }
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  async function toggleStatus(a: AmbassadorRow) {
    await fetch(`/api/admin/ambassadors/${a.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: a.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-vodium-cream flex items-center gap-2">
            <Megaphone size={20} className="text-vodium-gold" /> Marketing
          </h1>
          <p className="text-sm text-vodium-cream/40 mt-1">
            Campus ambassadors — who&rsquo;s bringing in vendors that actually use Vodium.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 text-xs text-vodium-cream/50 hover:text-vodium-gold border border-white/[0.08] rounded-lg px-3 py-2">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowForm((v) => !v)} className="btn-gold inline-flex items-center gap-2 text-xs rounded-lg px-3 py-2">
            {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? "Close" : "Add ambassador"}
          </button>
        </div>
      </div>

      {/* Programme totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={<MousePointerClick size={13} />} label="Link clicks" value={String(totals.clicks)} />
        <Stat icon={<Store size={13} />} label="Vendors signed" value={String(totals.signups)} />
        <Stat icon={<Zap size={13} />} label="Activated" value={String(totals.activated)} accent />
        <Stat icon={<Plus size={13} />} label="Credits logged" value={String(totals.creditsLogged)} />
        <Stat icon={<Banknote size={13} />} label="₦ tracked" value={formatNaira(totals.totalTracked)} />
      </div>

      {showForm && <NewAmbassadorForm origin={origin} onDone={() => { setShowForm(false); load(); }} />}

      {error && (
        <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-vodium-cream/40 py-10">
          <Loader2 size={15} className="animate-spin text-vodium-gold" /> Loading ambassadors…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal py-14 text-center">
          <Megaphone size={26} className="text-vodium-gold/40 mx-auto mb-3" />
          <p className="text-sm text-vodium-cream/50">No ambassadors yet. Add one to mint their referral link.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => {
            const link = `${origin}/r/${a.code}`;
            const statsLink = `${origin}/ambassador/${a.statsToken}`;
            return (
              <div key={a.id} className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-vodium-cream font-semibold">{a.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-vodium-gold/25 bg-vodium-gold/10 text-vodium-gold">
                        {a.code}
                      </span>
                      {a.status === "INACTIVE" && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-vodium-cream/40">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-vodium-cream/35 mt-1">
                      {[a.campus, a.phone, a.stipend ? `${formatNaira(a.stipend)}/mo` : null].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => copy(link, `l${a.id}`)} className="inline-flex items-center gap-1.5 text-xs border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-vodium-cream/60 hover:text-vodium-gold">
                      {copied === `l${a.id}` ? <Check size={12} /> : <Copy size={12} />} Referral link
                    </button>
                    <button onClick={() => copy(statsLink, `s${a.id}`)} className="inline-flex items-center gap-1.5 text-xs border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-vodium-cream/60 hover:text-vodium-gold">
                      {copied === `s${a.id}` ? <Check size={12} /> : <Copy size={12} />} Their stats link
                    </button>
                    <button onClick={() => toggleStatus(a)} className="text-xs border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-vodium-cream/40 hover:text-vodium-cream">
                      {a.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </div>

                <p className="mt-3 font-mono text-xs text-vodium-gold/70 break-all">{link}</p>

                {/* Funnel */}
                <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3">
                  <Cell label="Clicks" value={String(a.funnel.clicks)} />
                  <Cell label="Signed up" value={String(a.funnel.signups)} />
                  <Cell label="Activated" value={`${a.funnel.activated}`} sub={`${a.funnel.activationRate}%`} accent />
                  <Cell label="Active this week" value={String(a.funnel.activeThisWeek)} />
                  <Cell label="Credits logged" value={String(a.funnel.creditsLogged)} />
                  <Cell label="₦ tracked" value={formatNaira(a.funnel.totalTracked)} />
                </div>

                {a.funnel.costPerSignup !== null && (
                  <p className="text-[11px] text-vodium-cream/30 mt-3">
                    {formatNaira(a.funnel.costPerSignup)} per vendor signed against their stipend
                    {a.funnel.activated > 0 && a.stipend
                      ? ` · ${formatNaira(Math.round(a.stipend / a.funnel.activated))} per activated vendor`
                      : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewAmbassadorForm({ origin, onDone }: { origin: string; onDone: () => void }) {
  const [form, setForm] = useState({ name: "", code: "", phone: "", campus: "", stipend: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanCode = form.code.toUpperCase().replace(/[^A-Z0-9-]/g, "");

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/ambassadors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          code: cleanCode,
          phone: form.phone.trim() || undefined,
          campus: form.campus.trim() || undefined,
          stipend: form.stipend ? Number(form.stipend) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add ambassador");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40";

  return (
    <div className="rounded-xl border border-vodium-gold/20 bg-vodium-gold/[0.04] p-5 space-y-3">
      <h3 className="text-sm font-semibold text-vodium-cream">New ambassador</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Name"><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tunde Bakare" className={input} /></Field>
        <Field label="Link code">
          <input value={cleanCode} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="TUNDE" className={`${input} uppercase`} />
        </Field>
        <Field label="Phone (optional)"><input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="0803…" className={input} /></Field>
        <Field label="Campus (optional)"><input value={form.campus} onChange={(e) => setForm((p) => ({ ...p, campus: e.target.value }))} placeholder="UNILAG" className={input} /></Field>
        <Field label="Monthly stipend ₦ (optional)"><input value={form.stipend} onChange={(e) => setForm((p) => ({ ...p, stipend: e.target.value.replace(/\D/g, "") }))} placeholder="20000" className={input} /></Field>
      </div>

      {cleanCode && (
        <p className="text-xs text-vodium-cream/40">
          Their link will be <span className="font-mono text-vodium-gold/70">{origin}/r/{cleanCode}</span>
        </p>
      )}
      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={busy || form.name.trim().length < 2 || cleanCode.length < 3}
          className="btn-gold px-4 py-2 rounded-lg text-xs inline-flex items-center gap-2 disabled:opacity-40"
        >
          {busy && <Loader2 size={13} className="animate-spin" />} Create & mint link
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-vodium-cream/40">{label}</span>
      {children}
    </label>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal px-4 py-3">
      <p className={`font-serif text-xl ${accent ? "text-vodium-gold" : "text-vodium-cream"}`}>{value}</p>
      <p className="text-xs text-vodium-cream/35 mt-0.5 inline-flex items-center gap-1">
        <span className="text-vodium-gold/50">{icon}</span> {label}
      </p>
    </div>
  );
}

function Cell({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-sm font-semibold ${accent ? "text-vodium-gold" : "text-vodium-cream/80"}`}>
        {value}
        {sub && <span className="text-xs font-normal text-vodium-cream/35 ml-1">({sub})</span>}
      </p>
      <p className="text-[11px] text-vodium-cream/30 mt-0.5">{label}</p>
    </div>
  );
}
