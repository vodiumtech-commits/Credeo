"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X, Loader2, Banknote } from "lucide-react";
import { formatNaira } from "@/lib/utils";

const METHODS = [
  { value: "CASH",          label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "POS",           label: "POS" },
  { value: "USSD",          label: "USSD" },
  { value: "MOBILE_MONEY",  label: "Mobile Money" },
  { value: "OTHER",         label: "Other" },
] as const;

interface Props {
  creditId:     string;
  studentName:  string;
  totalAmount:  number;
  amountRepaid: number;
  isPaid:       boolean;
}

export function MarkPaidButton({ creditId, studentName, totalAmount, amountRepaid, isPaid }: Props) {
  const router = useRouter();
  const remaining = totalAmount - amountRepaid;

  const [open,    setOpen]    = useState(false);
  const [amount,  setAmount]  = useState(String(remaining));
  const [method,  setMethod]  = useState<string>("CASH");
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  if (isPaid) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
        <CheckCircle2 size={13} /> Paid
      </span>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (parsed > remaining + 0.01) {
      setError(`Amount can't exceed the balance of ${formatNaira(remaining)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/credits/${creditId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ repaymentAmount: parsed, repaymentMethod: method, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to record payment");

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => { setAmount(String(remaining)); setMethod("CASH"); setNotes(""); setError(null); setOpen(true); }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all"
      >
        <CheckCircle2 size={12} /> Mark paid
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm bg-vodium-charcoal border border-white/[0.08] rounded-2xl shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Banknote size={17} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-serif text-vodium-cream text-base leading-tight">Record payment</p>
                  <p className="text-xs text-vodium-cream/40 mt-0.5">{studentName}</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-vodium-cream/30 hover:text-vodium-cream/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Balance info */}
              <div className="flex justify-between text-xs text-vodium-cream/40 bg-white/[0.03] rounded-xl px-4 py-3">
                <span>Total credit</span>
                <span className="font-serif text-vodium-gold">{formatNaira(totalAmount)}</span>
              </div>
              {amountRepaid > 0 && (
                <div className="flex justify-between text-xs text-vodium-cream/40 bg-white/[0.03] rounded-xl px-4 py-3 -mt-2">
                  <span>Already repaid</span>
                  <span className="text-emerald-400">{formatNaira(amountRepaid)}</span>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-vodium-cream/60 mb-1.5">
                  Amount received (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setError(null); }}
                  className="w-full bg-black/30 border border-white/[0.10] rounded-xl px-4 py-3 text-vodium-cream text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                  required
                />
                <p className="text-[11px] text-vodium-cream/25 mt-1">
                  Balance due: <span className="text-vodium-gold">{formatNaira(remaining)}</span>
                </p>
              </div>

              {/* Method */}
              <div>
                <label className="block text-xs font-medium text-vodium-cream/60 mb-1.5">
                  Payment method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-black/30 border border-white/[0.10] rounded-xl px-4 py-3 text-vodium-cream text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 appearance-none"
                >
                  {METHODS.map((m) => (
                    <option key={m.value} value={m.value} className="bg-vodium-charcoal">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-xs font-medium text-vodium-cream/60 mb-1.5">
                  Notes <span className="text-vodium-cream/25">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full, installment 1…"
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-black/30 border border-white/[0.10] rounded-xl px-4 py-3 text-vodium-cream text-sm placeholder:text-vodium-cream/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>

              {error && (
                <p className="text-xs text-danger bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  ⚠ {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-vodium-cream/50 border border-white/[0.08] hover:border-white/[0.15] hover:text-vodium-cream/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  ) : (
                    <><CheckCircle2 size={14} /> Confirm payment</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
