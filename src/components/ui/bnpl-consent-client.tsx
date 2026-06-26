"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function BnplConsentClient({
  token,
  storeName,
  customerName,
  total,
  dueDate,
  brand,
}: {
  token: string;
  storeName: string;
  customerName: string;
  total: string;
  dueDate: string;
  brand: string;
}) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setError(null);
    if (!checked) return setError("Please tick the box to accept the terms.");
    setLoading(true);
    const res = await fetch("/api/public/bnpl-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Could not record your acceptance.");
    setDone(true);
    setTimeout(() => window.location.reload(), 800);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-300">
        <CheckCircle2 size={16} /> Thank you — your acceptance has been recorded.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5"
          style={{ accentColor: brand }}
        />
        <span className="text-xs text-vodium-cream/60 leading-relaxed">
          I, <span className="text-vodium-cream">{customerName}</span>, agree to pay <span className="text-vodium-cream">{storeName}</span> the
          outstanding balance of <span className="text-vodium-cream">{total}</span> by <span className="text-vodium-cream">{dueDate}</span> (or as
          scheduled above), and I accept the Buy-Now-Pay-Later repayment terms. I consent to repayment reminders about this order.
        </span>
      </label>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <button
        onClick={accept}
        disabled={loading}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-vodium-black disabled:opacity-50 inline-flex items-center justify-center gap-2"
        style={{ backgroundColor: brand }}
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        Accept &amp; confirm
      </button>
    </div>
  );
}
