"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CheckCircle, Store, MapPin, Phone,
  BookOpen, MessageCircle, Building2
} from "lucide-react";

const UNIVERSITIES = [
  "University of Lagos (UNILAG)",
  "Obafemi Awolowo University (OAU)",
  "University of Ibadan (UI)",
  "Covenant University",
  "Federal University of Technology, Akure (FUTA)",
  "Lagos State University (LASU)",
  "University of Benin (UNIBEN)",
  "Ahmadu Bello University (ABU)",
  "University of Nigeria, Nsukka (UNN)",
  "University of Ilorin (UNILORIN)",
  "Babcock University",
  "Pan-Atlantic University (PAU)",
  "Other",
];

const VENDOR_TYPES = [
  { value: "PROVISION_SHOP", label: "Provision / Grocery Shop" },
  { value: "FOOD_CANTEEN",   label: "Food Canteen / Restaurant" },
  { value: "LAUNDRY",        label: "Laundry Service" },
  { value: "PRINTING",       label: "Printing & Stationery" },
  { value: "BARBING_SALON",  label: "Barbing Salon" },
  { value: "HAIR_SALON",     label: "Hair Salon" },
  { value: "PHARMACY",       label: "Pharmacy / Drug Store" },
  { value: "MINI_MART",      label: "Mini Mart / Supermarket" },
  { value: "OTHER",          label: "Other" },
];

type FormData = {
  businessName: string;
  vendorType: string;
  campusLocation: string;
  university: string;
  ownerName: string;
  phone: string;
  email: string;
  otp: string;
};

const STEPS = [
  { id: 1, label: "Business" },
  { id: 2, label: "Campus" },
  { id: 3, label: "Contact" },
  { id: 4, label: "Verify" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    businessName: "",
    vendorType: "",
    campusLocation: "",
    university: "",
    ownerName: "",
    phone: "",
    email: "",
    otp: "",
  });

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSendOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });
      if (!res.ok) throw new Error("Could not send code. Check your number.");
      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndCreate() {
    setLoading(true);
    setError(null);
    try {
      // 1. Verify OTP → sets vodium_phone cookie
      const verRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, otp: form.otp }),
      });
      if (!verRes.ok) {
        const d = await verRes.json();
        throw new Error(d.error ?? "Wrong code. Please try again.");
      }

      // 2. Create vendor account
      const regRes = await fetch("/api/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          vendorType: form.vendorType,
          campusLocation: form.campusLocation,
          university: form.university,
          ownerName: form.ownerName,
          email: form.email || undefined,
        }),
      });
      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error ?? "Could not create account");

      // Already registered → go to dashboard
      if (regData.alreadyExists) {
        window.location.href = "/dashboard";
        return;
      }

      setStep(5);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const canAdvance = () => {
    if (step === 1) return form.businessName.length > 1 && form.vendorType && form.campusLocation.length > 2;
    if (step === 2) return form.university.length > 1;
    if (step === 3) return form.ownerName.length > 2 && form.phone.length >= 11;
    if (step === 4) return form.otp.length === 6;
    return false;
  };

  if (step === 5) return <SuccessScreen name={form.ownerName} business={form.businessName} phone={form.phone} />;

  return (
    <div className="min-h-screen bg-vodium-black text-vodium-cream">
      {/* Nav */}
      <nav className="px-6 md:px-12 py-5 border-b border-white/[0.07] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-lg">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-gold text-sm">VODIUM LEDGER</span>
        </Link>
        <Link href="/login" className="text-sm text-vodium-cream/50 hover:text-vodium-gold transition-colors">
          Already have an account? Sign in
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-12">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.id ? "bg-vodium-gold text-vodium-black" :
                  step === s.id ? "bg-vodium-gold text-vodium-black" :
                  "bg-vodium-slate text-vodium-cream/30"
                }`}>
                  {step > s.id ? <CheckCircle size={14} /> : s.id}
                </div>
                <span className={`text-xs transition-colors hidden sm:block ${step >= s.id ? "text-vodium-cream/70" : "text-vodium-cream/25"}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-3 mb-5 transition-colors ${step > s.id ? "bg-vodium-gold/50" : "bg-vodium-slate"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Business info */}
        {step === 1 && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center mb-5">
                <Store size={22} className="text-vodium-gold" />
              </div>
              <h1 className="font-serif text-3xl mb-2">Tell us about your business</h1>
              <p className="text-vodium-cream/50 text-sm">
                This is how your shop will appear to students.
              </p>
            </div>
            <div className="space-y-4">
              <Field label="Business name" required>
                <input
                  type="text"
                  placeholder="e.g. Mama Taiwo's Provisions"
                  value={form.businessName}
                  onChange={(e) => update("businessName", e.target.value)}
                  className="input-dark"
                  autoFocus
                />
              </Field>
              <Field label="Type of business" required>
                <select
                  value={form.vendorType}
                  onChange={(e) => update("vendorType", e.target.value)}
                  className="input-dark"
                >
                  <option value="">Select business type…</option>
                  {VENDOR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Campus location" required hint="Where on campus can students find you?">
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
                  <input
                    type="text"
                    placeholder="e.g. Faculty of Arts Complex, Block C"
                    value={form.campusLocation}
                    onChange={(e) => update("campusLocation", e.target.value)}
                    className="input-dark pl-10"
                  />
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* Step 2: University */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center mb-5">
                <Building2 size={22} className="text-vodium-gold" />
              </div>
              <h1 className="font-serif text-3xl mb-2">Which campus?</h1>
              <p className="text-vodium-cream/50 text-sm">
                We use this to connect you with students at your university.
              </p>
            </div>
            <div className="space-y-3">
              {UNIVERSITIES.map((uni) => (
                <button
                  key={uni}
                  type="button"
                  onClick={() => update("university", uni)}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all text-sm ${
                    form.university === uni
                      ? "border-vodium-gold bg-vodium-gold/10 text-vodium-cream"
                      : "border-white/[0.08] bg-vodium-charcoal/60 text-vodium-cream/65 hover:border-vodium-gold/30 hover:text-vodium-cream"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{uni}</span>
                    {form.university === uni && (
                      <CheckCircle size={16} className="text-vodium-gold flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Contact info */}
        {step === 3 && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center mb-5">
                <Phone size={22} className="text-vodium-gold" />
              </div>
              <h1 className="font-serif text-3xl mb-2">Your contact details</h1>
              <p className="text-vodium-cream/50 text-sm">
                We&rsquo;ll verify your phone number in the next step.
              </p>
            </div>
            <div className="space-y-4">
              <Field label="Your full name" required>
                <input
                  type="text"
                  placeholder="e.g. Taiwo Adeyemi"
                  value={form.ownerName}
                  onChange={(e) => update("ownerName", e.target.value)}
                  className="input-dark"
                  autoFocus
                />
              </Field>
              <Field label="WhatsApp phone number" required hint="This becomes your Vodium login and bot number.">
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="0801 234 5678"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="input-dark pl-10"
                  />
                </div>
              </Field>
              <Field label="Email address" hint="Optional — for receipts and account recovery.">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="input-dark"
                />
              </Field>
            </div>
          </div>
        )}

        {/* Step 4: OTP verification */}
        {step === 4 && (
          <div className="animate-fade-up">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center mb-5">
                <BookOpen size={22} className="text-vodium-gold" />
              </div>
              <h1 className="font-serif text-3xl mb-2">Verify your number</h1>
              <p className="text-vodium-cream/50 text-sm">
                Enter the 6-digit code we sent to{" "}
                <span className="text-vodium-cream font-semibold">{form.phone}</span>.
              </p>
            </div>
            <div className="space-y-4">
              <Field label="6-digit code" required>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={form.otp}
                  onChange={(e) => update("otp", e.target.value.replace(/\D/g, ""))}
                  className="input-dark text-center tracking-[0.6em] text-2xl font-mono"
                  autoFocus
                />
              </Field>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                className="text-sm text-vodium-cream/40 hover:text-vodium-gold transition-colors"
              >
                Resend code
              </button>
            </div>

            {/* Summary card */}
            <div className="mt-8 card-dark p-5 space-y-2">
              <p className="text-xs text-vodium-cream/40 uppercase tracking-wider mb-3">Review your details</p>
              <SummaryRow label="Business" value={form.businessName} />
              <SummaryRow label="Campus" value={form.university} />
              <SummaryRow label="Location" value={form.campusLocation} />
              <SummaryRow label="Name" value={form.ownerName} />
              <SummaryRow label="Phone" value={form.phone} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.07]">
          {step > 1 ? (
            <button
              onClick={() => { setStep(step - 1); setError(null); }}
              className="flex items-center gap-2 text-sm text-vodium-cream/50 hover:text-vodium-cream transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2 text-sm text-vodium-cream/50 hover:text-vodium-cream transition-colors">
              <ArrowLeft size={16} /> Back to home
            </Link>
          )}

          {step < 3 && (
            <button
              onClick={() => canAdvance() && setStep(step + 1)}
              disabled={!canAdvance()}
              className="btn-gold px-6 py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Continue <ArrowRight size={16} />
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleSendOtp}
              disabled={!canAdvance() || loading}
              className="btn-gold px-6 py-3 rounded-xl text-sm disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? "Sending…" : <>Send verification code <ArrowRight size={16} /></>}
            </button>
          )}

          {step === 4 && (
            <button
              onClick={handleVerifyAndCreate}
              disabled={!canAdvance() || loading}
              className="btn-gold px-6 py-3 rounded-xl text-sm disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? "Verifying…" : <>Create my account <ArrowRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
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
      <label className="block text-sm font-medium text-vodium-cream/80 mb-2">
        {label} {required && <span className="text-vodium-gold">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-vodium-cream/35 mt-1.5">{hint}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-vodium-cream/40">{label}</span>
      <span className="text-vodium-cream text-right">{value || "—"}</span>
    </div>
  );
}

function SuccessScreen({
  name,
  business,
  phone,
}: {
  name: string;
  business: string;
  phone: string;
}) {
  const firstName = name.split(" ")[0];
  const waPhone = "+2348012345678";

  return (
    <div className="min-h-screen bg-vodium-black flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-vodium-gold/10 border border-vodium-gold/30 flex items-center justify-center mx-auto mb-8 animate-pulse-gold">
          <CheckCircle size={36} className="text-vodium-gold" />
        </div>

        <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-4">You&rsquo;re in</p>
        <h1 className="font-serif text-4xl text-vodium-cream mb-4">
          Welcome, {firstName}!
        </h1>
        <p className="text-vodium-cream/60 mb-10 leading-relaxed">
          <strong className="text-vodium-cream">{business}</strong> is now on Vodium Ledger.
          Your 60-day free trial has started. Let&rsquo;s record your first credit.
        </p>

        <div className="space-y-3">
          <a
            href={`https://wa.me/${waPhone.replace("+", "")}?text=START`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full py-4 rounded-xl inline-flex items-center justify-center gap-2 text-base"
          >
            <MessageCircle size={20} /> Activate WhatsApp bot
          </a>
          <Link
            href="/dashboard"
            className="btn-ghost w-full py-4 rounded-xl inline-flex items-center justify-center gap-2 text-base"
          >
            Go to my dashboard <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-10 card-dark p-5 text-left space-y-3">
          <p className="text-xs text-vodium-cream/40 uppercase tracking-wider mb-4">Quick start</p>
          {[
            "Send START to our WhatsApp to activate your bot",
            "Record your first credit with the ADD command",
            "Check your dashboard for a full overview",
          ].map((s, i) => (
            <div key={s} className="flex items-start gap-3 text-sm text-vodium-cream/70">
              <span className="w-5 h-5 rounded-full bg-vodium-gold/20 text-vodium-gold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
