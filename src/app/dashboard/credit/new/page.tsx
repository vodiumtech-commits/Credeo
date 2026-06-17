"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  MessageCircle,
  User,
  Banknote,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { ShimmerButton } from "@/components/ui/shimmer-button";

const DURATION_OPTIONS = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "End of month", days: 30 },
];

// FIXED: Changed "student" to "customer" to match your state
type StepName = "customer" | "details" | "confirm" | "done";

const STEP_META = [
  { id: 1, key: "customer" as const, label: "Customer" }, // FIXED: key is now customer
  { id: 2, key: "details" as const, label: "Details" },
  { id: 3, key: "confirm" as const, label: "Confirm" },
];

export default function NewCreditPage() {
  const [step, setStep] = useState<StepName>("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerID: "",
    phone: "",
    amount: "",
    description: "",
    dueDays: "",
    customDue: "",
  });

  function update(f: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [f]: v }));
  }

  const dueDate = (): string => {
    const days =
      form.dueDays === "custom"
        ? parseInt(form.customDue || "0")
        : parseInt(form.dueDays || "0");
    if (!days) return "—";
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isStep1Valid = form.customerName.length > 1;
  const isStep2Valid =
    parseFloat(form.amount) > 0 &&
    (form.dueDays === "custom"
      ? parseInt(form.customDue) > 0
      : form.dueDays !== "");

  const currentStepNum =
    step === "customer"
      ? 1
      : step === "details"
        ? 2
        : step === "confirm"
          ? 3
          : 3;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const days =
        form.dueDays === "custom"
          ? parseInt(form.customDue || "0")
          : parseInt(form.dueDays || "0");
      const dueDateTime = new Date();
      dueDateTime.setDate(dueDateTime.getDate() + days);

      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerID: form.customerID || undefined,
          customerPhone: form.phone || undefined,
          amount: parseFloat(form.amount),
          description: form.description || undefined,
          dueDate: dueDateTime.toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not save credit");
      }
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#0F0F0F] p-6 md:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          {/* Success card */}
          <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={30} className="text-emerald-400" />
            </div>
            <h2 className="font-serif text-2xl text-vodium-cream mb-2">
              Credit recorded
            </h2>
            <p className="text-vodium-cream/50 text-sm mb-1">
              <span className="text-vodium-cream font-semibold">
                {form.customerName}
              </span>{" "}
              owes you{" "}
              <span className="text-vodium-gold font-semibold">
                {formatNaira(parseFloat(form.amount))}
              </span>
              , due {dueDate()}.
            </p>
            <p className="text-xs text-vodium-cream/30 mb-8">
              A polite reminder will be sent before the due time.
            </p>
            <div className="space-y-3">
              <ShimmerButton
                className="w-full h-12 text-sm"
                onClick={() => {
                  setStep("customer");
                  setForm({
                    customerName: "",
                    customerID: "",
                    phone: "",
                    amount: "",
                    description: "",
                    dueDays: "",
                    customDue: "",
                  });
                }}
              >
                Add another credit
              </ShimmerButton>
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl text-sm text-vodium-cream/50 hover:text-vodium-cream transition-colors border border-white/[0.06] hover:border-white/[0.14] flex items-center justify-center"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          {/* WhatsApp tip */}
          <div className="bg-vodium-charcoal border border-vodium-gold/15 rounded-2xl p-5 text-center">
            <p className="text-vodium-cream/40 text-xs mb-3">
              You can also add credits via WhatsApp:
            </p>
            <code className="text-vodium-gold font-mono text-sm">
              ADD {form.customerName.split(" ")[0]?.toUpperCase() || "NAME"}{" "}
              {form.amount}
            </code>
            <div className="mt-4">
              <a
                href="https://wa.me/2347019575717?text=ADD"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-vodium-cream/35 hover:text-vodium-gold transition-colors"
              >
                <MessageCircle size={13} /> Open WhatsApp bot
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 md:p-8">
      <div className="max-w-xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-vodium-cream/40 hover:text-vodium-cream/80 transition-colors mb-8"
        >
          <ArrowLeft size={15} /> Dashboard
        </Link>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">
            Add a credit
          </h1>
          <p className="text-vodium-cream/35 text-sm mt-1">
            Record money you&rsquo;ve extended to a customer.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-10">
          {STEP_META.map((s, idx) => {
            const isCompleted = currentStepNum > s.id;
            const isActive = currentStepNum === s.id;
            return (
              <div
                key={s.id}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? "bg-vodium-gold text-vodium-black"
                        : isActive
                          ? "bg-vodium-gold text-vodium-black shadow-[0_0_16px_rgba(201,169,97,0.4)]"
                          : "bg-white/[0.06] text-vodium-cream/25 border border-white/[0.08]"
                    }`}
                  >
                    {isCompleted ? <CheckCircle size={13} /> : s.id}
                  </div>
                  <span
                    className={`text-[11px] transition-colors ${
                      isActive || isCompleted
                        ? "text-vodium-cream/60"
                        : "text-vodium-cream/20"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < STEP_META.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 mb-5 transition-colors ${
                      currentStepNum > s.id
                        ? "bg-vodium-gold/50"
                        : "bg-white/[0.08]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Customer info ──────────────────────────────────── */}
        {/* FIXED: Changed check to step === "customer" */}
        {step === "customer" && (
          <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
                <User size={15} className="text-vodium-gold" />
              </div>
              <div>
                <h2 className="font-semibold text-vodium-cream">
                  Customer details
                </h2>
                <p className="text-xs text-vodium-cream/35">
                  Who are you extending credit to?
                </p>
              </div>
            </div>

            <StepField label="Full name" required>
              <input
                type="text"
                placeholder="e.g. Emeka Okonkwo"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                className="input-dark"
                autoFocus
              />
            </StepField>

            <StepField
              label="Customer ID"
              hint="Optional : helps identify the customer."
            >
              <input
                type="text"
                placeholder="e.g. LGS/23/042"
                value={form.customerID}
                onChange={(e) => update("customerID", e.target.value)}
                className="input-dark"
              />
            </StepField>

            <StepField
              label="WhatsApp number"
              hint="For sending automated reminders."
            >
              <input
                type="tel"
                inputMode="tel"
                placeholder="0801 234 5678"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input-dark"
              />
            </StepField>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep("details")}
                disabled={!isStep1Valid}
                className="btn-gold px-7 py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Credit details ────────────────────────────────── */}
        {step === "details" && (
          <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
                <Banknote size={15} className="text-vodium-gold" />
              </div>
              <div>
                <h2 className="font-semibold text-vodium-cream">
                  Credit details
                </h2>
                <p className="text-xs text-vodium-cream/35">
                  Amount and repayment timeline
                </p>
              </div>
            </div>

            <StepField label="Amount" required>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-vodium-gold font-semibold pointer-events-none">
                  ₦
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  min={0}
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  className="input-dark pl-8"
                />
              </div>
              {form.amount && parseFloat(form.amount) > 0 && (
                <p className="text-xs text-vodium-gold/70 mt-1.5 font-medium">
                  {formatNaira(parseFloat(form.amount))}
                </p>
              )}
            </StepField>

            <StepField label="Description" hint="What did they buy? (optional)">
              <textarea
                placeholder="e.g. Provisions, Lunch x3, Laundry"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={2}
                className="input-dark resize-none"
              />
            </StepField>

            <StepField label="Due date" required>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {DURATION_OPTIONS.map((o) => (
                  <button
                    key={o.days}
                    type="button"
                    onClick={() => {
                      update("dueDays", String(o.days));
                      update("customDue", "");
                    }}
                    className={`px-3 py-2.5 text-sm rounded-xl border transition-all ${
                      form.dueDays === String(o.days)
                        ? "border-vodium-gold bg-vodium-gold/10 text-vodium-cream font-medium"
                        : "border-white/[0.08] text-vodium-cream/40 hover:border-vodium-gold/30 hover:text-vodium-cream/70"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update("dueDays", "custom")}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    form.dueDays === "custom"
                      ? "border-vodium-gold text-vodium-gold bg-vodium-gold/10"
                      : "border-white/[0.08] text-vodium-cream/40"
                  }`}
                >
                  Custom
                </button>
                {form.dueDays === "custom" && (
                  <input
                    type="number"
                    placeholder="Days"
                    min={1}
                    max={180}
                    value={form.customDue}
                    onChange={(e) => update("customDue", e.target.value)}
                    className="input-dark w-24 text-sm py-1.5"
                    autoFocus
                  />
                )}
              </div>
              {form.dueDays && (
                <p className="text-xs text-vodium-cream/35 mt-2 flex items-center gap-1">
                  <Calendar size={11} className="text-vodium-gold" /> Due:{" "}
                  <span className="text-vodium-cream/60 font-medium">
                    {dueDate()}
                  </span>
                </p>
              )}
            </StepField>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep("customer")}
                className="text-sm text-vodium-cream/40 hover:text-vodium-cream/70 transition-colors border border-white/[0.06] px-5 py-2.5 rounded-xl"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!isStep2Valid}
                className="btn-gold px-7 py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ───────────────────────────────────────── */}
        {step === "confirm" && (
          <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] p-8">
            <h2 className="font-serif text-xl text-vodium-cream mb-1">
              Confirm credit
            </h2>
            <p className="text-sm text-vodium-cream/35 mb-6">
              Check the details before saving.
            </p>

            {/* Review rows */}
            <div className="space-y-0 mb-6 rounded-xl border border-white/[0.06] overflow-hidden">
              {/* FIXED: Changed form.studentName and form.matricNumber to form.customerName and form.customerID */}
              <ReviewRow
                icon={<User size={14} />}
                label="Customer"
                value={`${form.customerName}${form.customerID ? ` · ${form.customerID}` : ""}`}
              />
              {form.phone && (
                <ReviewRow
                  icon={<MessageCircle size={14} />}
                  label="Phone"
                  value={form.phone}
                />
              )}
              <ReviewRow
                icon={<Banknote size={14} />}
                label="Amount"
                value={formatNaira(parseFloat(form.amount))}
                highlight
              />
              {form.description && (
                <ReviewRow
                  icon={<span className="text-xs leading-none">📦</span>}
                  label="Description"
                  value={form.description}
                />
              )}
              <ReviewRow
                icon={<Calendar size={14} />}
                label="Due date"
                value={dueDate()}
              />
            </div>

            {/* Reminder note */}
            <div className="bg-vodium-gold/[0.06] border border-vodium-gold/15 rounded-xl p-4 mb-6 text-xs text-vodium-cream/45 leading-relaxed">
              A polite reminder will be sent to{" "}
              <span className="text-vodium-cream/70 font-medium">
                {form.customerName}
              </span>{" "}
              before the due time. Their Vodium score will be updated
              when they pay.
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4 text-sm text-rose-400">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("details")}
                className="flex-1 py-3.5 rounded-xl text-sm text-vodium-cream/40 hover:text-vodium-cream/70 border border-white/[0.06] hover:border-white/[0.14] transition-colors"
              >
                Edit
              </button>
              <ShimmerButton
                className="flex-[2] h-12 text-sm"
                onClick={handleSubmit}
              >
                {loading ? "Saving…" : "Record Credit"}
              </ShimmerButton>
            </div>
          </div>
        )}

        {/* WhatsApp hint */}
        {step !== "confirm" && (
          <p className="text-xs text-vodium-cream/25 text-center mt-6">
            You can also record via WhatsApp:{" "}
            <code className="text-vodium-gold/60 font-mono">
              ADD {form.customerName || "[name]"} {form.amount || "[amount]"}
            </code>
          </p>
        )}
      </div>
    </div>
  );
}

function StepField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-vodium-cream/70 mb-1.5">
        {label} {required && <span className="text-vodium-gold">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-vodium-cream/30 mt-1.5">{hint}</p>}
    </div>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] last:border-0 bg-black/20">
      <div className="flex items-center gap-2 text-vodium-cream/40 text-sm">
        <span className="text-vodium-gold/60">{icon}</span>
        {label}
      </div>
      <span
        className={`text-sm font-semibold ${
          highlight ? "text-vodium-gold text-base" : "text-vodium-cream/80"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
