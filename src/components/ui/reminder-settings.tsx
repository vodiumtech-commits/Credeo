"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";

type Prefs = { preDueRemindersEnabled: boolean; overdueRemindersEnabled: boolean };

/**
 * Lets a merchant decide whether Vodium messages their customers at all.
 * Reminders are on by default; either type can be switched off independently.
 */
export function ReminderSettings() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenant/reminders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPrefs({
        preDueRemindersEnabled: d.preDueRemindersEnabled,
        overdueRemindersEnabled: d.overdueRemindersEnabled,
      }))
      .catch(() => setError("Could not load reminder settings."));
  }, []);

  async function toggle(key: keyof Prefs) {
    if (!prefs) return;
    const next = !prefs[key];
    setSaving(key);
    setError(null);
    const res = await fetch("/api/tenant/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(null);
    if (!res.ok) return setError(data.error ?? "Could not save.");
    setPrefs({ ...prefs, [key]: next });
  }

  return (
    <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
        <BellRing size={16} className="text-vodium-gold" />
        <h2 className="text-sm font-semibold text-vodium-cream">Customer reminders</h2>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-xs text-vodium-cream/40">
          Choose whether we send WhatsApp reminders to customers who owe you. You can still send a
          reminder manually at any time, even with these switched off.
        </p>

        {!prefs ? (
          <p className="text-sm text-vodium-cream/35">Loading…</p>
        ) : (
          <>
            <Row
              label="Remind before the due date"
              hint="A friendly nudge shortly before payment is due."
              on={prefs.preDueRemindersEnabled}
              busy={saving === "preDueRemindersEnabled"}
              onToggle={() => toggle("preDueRemindersEnabled")}
            />
            <Row
              label="Remind when payment is overdue"
              hint="A respectful follow-up, repeated every few days until settled."
              on={prefs.overdueRemindersEnabled}
              busy={saving === "overdueRemindersEnabled"}
              onToggle={() => toggle("overdueRemindersEnabled")}
            />
          </>
        )}

        {error && <p className="text-sm text-rose-300">{error}</p>}
      </div>
    </section>
  );
}

function Row({
  label, hint, on, busy, onToggle,
}: { label: string; hint: string; on: boolean; busy: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-black/20 border border-white/[0.05] p-3">
      <div className="min-w-0">
        <p className="text-sm text-vodium-cream">{label}</p>
        <p className="text-xs text-vodium-cream/35 mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        disabled={busy}
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 ${on ? "bg-vodium-gold" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-0.5"}`}
        />
        {busy && <Loader2 size={12} className="animate-spin absolute inset-0 m-auto text-vodium-black" />}
      </button>
    </div>
  );
}
