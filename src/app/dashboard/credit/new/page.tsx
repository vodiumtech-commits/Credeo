"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, MessageCircle, User, Banknote, Calendar } from "lucide-react";
import { formatNaira } from "@/lib/utils";

const DURATION_OPTIONS = [
  { label: "3 days",      days: 3 },
  { label: "1 week",      days: 7 },
  { label: "2 weeks",     days: 14 },
  { label: "End of month",days: 30 },
];

type Step = "form" | "confirm" | "done";

export default function NewCreditPage() {
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    studentName: "",
    matricNumber: "",
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
    const days = form.dueDays === "custom" ? parseInt(form.customDue || "0") : parseInt(form.dueDays || "0");
    if (!days) return "—";
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  };

  const isFormValid =
    form.studentName.length > 1 &&
    parseFloat(form.amount) > 0 &&
    (form.dueDays === "custom" ? parseInt(form.customDue) > 0 : form.dueDays !== "");

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const days = form.dueDays === "custom" ? parseInt(form.customDue || "0") : parseInt(form.dueDays || "0");
      const dueDateTime = new Date();
      dueDateTime.setDate(dueDateTime.getDate() + days);

      const res = await fetch("/api/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: form.studentName,
          matricNumber: form.matricNumber || undefined,
          studentPhone: form.phone || undefined,
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
      <div className="p-6 md:p-8 max-w-md">
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-success" />
          </div>
          <h2 className="font-serif text-2xl text-vodium-black mb-2">Credit recorded</h2>
          <p className="text-muted-foreground text-sm mb-2">
            <strong className="text-vodium-black">{form.studentName}</strong> owes you{" "}
            <strong className="text-vodium-black">{formatNaira(parseFloat(form.amount))}</strong>, due {dueDate()}.
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            A polite reminder will be sent 2 days before the due date.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setStep("form"); setForm({ studentName: "", matricNumber: "", phone: "", amount: "", description: "", dueDays: "", customDue: "" }); }}
              className="btn-gold w-full py-3.5 rounded-xl text-sm"
            >
              Add another credit
            </button>
            <Link
              href="/dashboard"
              className="btn-outline-dark w-full py-3.5 rounded-xl text-sm flex items-center justify-center"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="mt-4 bg-vodium-black border border-vodium-gold/15 rounded-2xl p-5 text-center">
          <p className="text-vodium-cream/60 text-xs mb-3">You can also add credits via WhatsApp:</p>
          <code className="text-vodium-gold font-mono text-sm">ADD {form.studentName.split(" ")[0]?.toUpperCase()} {form.amount}</code>
          <div className="mt-4">
            <a
              href={`https://wa.me/2348012345678?text=ADD`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-vodium-cream/50 hover:text-vodium-gold transition-colors"
            >
              <MessageCircle size={14} /> Open WhatsApp bot
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="p-6 md:p-8 max-w-md">
        <button
          onClick={() => setStep("form")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to form
        </button>
        <div className="bg-white border border-border rounded-2xl p-6">
          <h2 className="font-serif text-2xl text-vodium-black mb-1">Confirm credit</h2>
          <p className="text-sm text-muted-foreground mb-6">Check the details before saving.</p>
          <div className="space-y-4 mb-8">
            <ConfirmRow icon={<User size={15} />} label="Student" value={`${form.studentName}${form.matricNumber ? ` · ${form.matricNumber}` : ""}`} />
            <ConfirmRow icon={<Banknote size={15} />} label="Amount" value={formatNaira(parseFloat(form.amount))} highlight />
            {form.description && <ConfirmRow icon={<span className="text-xs">📦</span>} label="Description" value={form.description} />}
            <ConfirmRow icon={<Calendar size={15} />} label="Due date" value={dueDate()} />
          </div>
          <div className="bg-muted/40 rounded-xl p-4 mb-6 text-xs text-muted-foreground leading-relaxed">
            A polite reminder will be sent to <strong>{form.studentName}</strong> 2 days before the due date. Their Vodium score will be updated when they pay.
          </div>
          {error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-2.5 mb-2">
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-gold w-full py-4 rounded-xl text-base disabled:opacity-60"
          >
            {loading ? "Saving…" : "Confirm & save credit"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors"
        >
          <ArrowLeft size={16} /> Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">Add a credit</h1>
        <p className="text-muted-foreground text-sm mt-1">Record money you&rsquo;ve extended to a student.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Student details */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
              <User size={15} className="text-vodium-gold" />
            </div>
            <h2 className="font-semibold text-vodium-black">Student details</h2>
          </div>

          <FormField label="Full name" required>
            <input
              type="text"
              placeholder="e.g. Emeka Okonkwo"
              value={form.studentName}
              onChange={(e) => update("studentName", e.target.value)}
              className="input-premium"
              autoFocus
            />
          </FormField>

          <FormField label="Matric number" hint="Optional — helps identify the student.">
            <input
              type="text"
              placeholder="e.g. 2019/0123"
              value={form.matricNumber}
              onChange={(e) => update("matricNumber", e.target.value)}
              className="input-premium"
            />
          </FormField>

          <FormField label="WhatsApp number" hint="For sending automated reminders.">
            <input
              type="tel"
              inputMode="tel"
              placeholder="0801 234 5678"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="input-premium"
            />
          </FormField>
        </div>

        {/* Credit details */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
              <Banknote size={15} className="text-vodium-gold" />
            </div>
            <h2 className="font-semibold text-vodium-black">Credit details</h2>
          </div>

          <FormField label="Amount (₦)" required>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₦</span>
              <input
                type="number"
                inputMode="numeric"
                placeholder="0"
                min={0}
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="input-premium pl-8"
              />
            </div>
            {form.amount && parseFloat(form.amount) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatNaira(parseFloat(form.amount))}</p>
            )}
          </FormField>

          <FormField label="Description" hint="What did they buy? (optional)">
            <input
              type="text"
              placeholder="e.g. Provisions, Lunch x3, Laundry"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              className="input-premium"
            />
          </FormField>

          <FormField label="Due date" required>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {DURATION_OPTIONS.map((o) => (
                <button
                  key={o.days}
                  type="button"
                  onClick={() => { update("dueDays", String(o.days)); update("customDue", ""); }}
                  className={`px-3 py-2.5 text-sm rounded-lg border transition-all ${
                    form.dueDays === String(o.days)
                      ? "border-vodium-gold bg-vodium-gold/8 text-vodium-black font-medium"
                      : "border-border text-muted-foreground hover:border-vodium-gold/40"
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
                    ? "border-vodium-gold text-vodium-gold bg-vodium-gold/8"
                    : "border-border text-muted-foreground"
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
                  className="input-premium w-24 text-sm py-1.5"
                  autoFocus
                />
              )}
            </div>
            {form.dueDays && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Calendar size={11} /> Due: <strong className="text-vodium-black">{dueDate()}</strong>
              </p>
            )}
          </FormField>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          You can also record this via WhatsApp:{" "}
          <code className="text-vodium-gold font-mono">ADD {form.studentName || "[name]"} {form.amount || "[amount]"}</code>
        </p>
        <button
          onClick={() => setStep("confirm")}
          disabled={!isFormValid}
          className="btn-gold px-7 py-3.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Review & confirm →
        </button>
      </div>
    </div>
  );
}

function FormField({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-vodium-black mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function ConfirmRow({ icon, label, value, highlight }: {
  icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon} {label}
      </div>
      <span className={`text-sm font-semibold ${highlight ? "text-vodium-black text-base" : "text-vodium-black"}`}>
        {value}
      </span>
    </div>
  );
}
