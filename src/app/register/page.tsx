"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CheckCircle, Store, MapPin, Phone,
  MessageCircle, Building2, ShoppingBag, UtensilsCrossed,
  WashingMachine, Printer, Scissors, Sparkles, Pill, ShoppingCart, HelpCircle,
  Shield, Zap, TrendingUp,
} from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Spotlight } from "@/components/ui/spotlight";

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
  { value: "PROVISION_SHOP", label: "Provision Shop",    icon: ShoppingBag },
  { value: "FOOD_CANTEEN",   label: "Food Canteen",      icon: UtensilsCrossed },
  { value: "LAUNDRY",        label: "Laundry",           icon: WashingMachine },
  { value: "PRINTING",       label: "Printing",          icon: Printer },
  { value: "BARBING_SALON",  label: "Barbing Salon",     icon: Scissors },
  { value: "HAIR_SALON",     label: "Hair Salon",        icon: Sparkles },
  { value: "PHARMACY",       label: "Pharmacy",          icon: Pill },
  { value: "MINI_MART",      label: "Mini Mart",         icon: ShoppingCart },
  { value: "OTHER",          label: "Other",             icon: HelpCircle },
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

// Steps: 1=Business, 2=Campus, 3=Contact, 4=OTP
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

  // OTP digit refs
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  // Sync digits array to form.otp
  function updateDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    update("otp", next.join(""));
    if (cleaned && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  }

  const handleDigitKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          const next = [...digits];
          next[index] = "";
          setDigits(next);
          update("otp", next.join(""));
        } else if (index > 0) {
          digitRefs.current[index - 1]?.focus();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [digits]
  );

  const handleDigitPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const next = [...digits];
      pasted.split("").forEach((char, i) => { if (i < 6) next[i] = char; });
      setDigits(next);
      update("otp", next.join(""));
      digitRefs.current[Math.min(pasted.length, 5)]?.focus();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [digits]
  );

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
      setDigits(["", "", "", "", "", ""]);
      update("otp", "");
      setCountdown(60);
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
    if (step === 1) return form.businessName.length > 1 && !!form.vendorType && form.campusLocation.length > 2;
    if (step === 2) return form.university.length > 1;
    if (step === 3) return form.ownerName.length > 2 && form.phone.length >= 11;
    if (step === 4) return form.otp.length === 6;
    return false;
  };

  if (step === 5) {
    return <SuccessScreen name={form.ownerName} business={form.businessName} />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left panel — brand ──────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[42%] min-h-screen bg-vodium-black relative overflow-hidden px-12 py-10 border-r border-white/[0.05]">
        {/* Background */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-vodium-gold/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-vodium-gold/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <Spotlight className="-top-60 left-0 opacity-20" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center group-hover:border-vodium-gold/70 transition-colors">
            <span className="font-serif text-vodium-gold text-xl leading-none">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-gold text-sm">VODIUM LEDGER</span>
        </Link>

        {/* Main copy */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <p className="text-vodium-gold text-xs tracking-[0.35em] uppercase mb-6">For campus vendors</p>
          <h2 className="font-serif text-4xl text-vodium-cream leading-tight mb-6">
            Start tracking<br />
            credit in<br />
            <em className="text-gradient-gold not-italic">minutes.</em>
          </h2>
          <p className="text-vodium-cream/45 leading-relaxed max-w-sm text-sm mb-12">
            Join hundreds of campus vendors who&rsquo;ve stopped losing money to defaults.
            Set up your ledger in under 3 minutes — no card needed.
          </p>

          {/* Trust bullets */}
          <div className="space-y-4">
            {[
              { icon: <Zap size={15} />,       label: "No card needed",     sub: "60-day free trial, cancel anytime" },
              { icon: <MessageCircle size={15} />, label: "WhatsApp-first",  sub: "Record credits right from WhatsApp" },
              { icon: <Shield size={15} />,    label: "Private by design",  sub: "Students only see their own balance" },
              { icon: <TrendingUp size={15} />, label: "Recover more",       sub: "Vendors recover 3× more credit on average" },
            ].map((b) => (
              <div key={b.label} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center text-vodium-gold flex-shrink-0 mt-0.5">
                  {b.icon}
                </div>
                <div>
                  <p className="text-vodium-cream text-sm font-medium">{b.label}</p>
                  <p className="text-vodium-cream/35 text-xs mt-0.5">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 border-t border-white/[0.07] pt-8">
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: "127+",  label: "Active vendors" },
              { value: "₦47M+", label: "Credit tracked" },
              { value: "73%",   label: "Repayment rate" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-2xl text-vodium-gold">{s.value}</p>
                <p className="text-vodium-cream/35 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-vodium-cream min-h-screen px-8 py-10 md:px-14">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-3 md:hidden mb-10">
          <div className="w-9 h-9 rounded-full bg-vodium-black border border-vodium-gold/40 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-lg">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-black text-sm">VODIUM LEDGER</span>
        </Link>

        {/* Sign-in link (desktop top-right look) */}
        <div className="hidden md:flex justify-end mb-6">
          <Link href="/login" className="text-sm text-vodium-black/50 hover:text-vodium-black transition-colors">
            Already have an account?{" "}
            <span className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors">Sign in</span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">

            {/* Step progress dots */}
            <div className="flex items-center gap-2 mb-10">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= s.id
                      ? "bg-vodium-gold w-8"
                      : "bg-vodium-black/10 w-4"
                  }`}
                />
              ))}
            </div>

            {/* ── Step 1: Business info ─────────────────────── */}
            {step === 1 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Store size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Tell us about your shop</h1>
                  <p className="text-muted-foreground text-sm">
                    This is how your business will appear to students.
                  </p>
                </div>

                <div className="space-y-4">
                  <RightField label="Business name" required>
                    <input
                      type="text"
                      placeholder="e.g. Mama Taiwo's Provisions"
                      value={form.businessName}
                      onChange={(e) => update("businessName", e.target.value)}
                      className="input-premium"
                      autoFocus
                    />
                  </RightField>

                  <RightField label="Type of business" required>
                    {/* Visual grid of vendor type cards */}
                    <div className="grid grid-cols-3 gap-2">
                      {VENDOR_TYPES.map((t) => {
                        const Icon = t.icon;
                        const isSelected = form.vendorType === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => update("vendorType", t.value)}
                            className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${
                              isSelected
                                ? "border-vodium-gold bg-vodium-gold/8 text-vodium-black shadow-[0_0_0_1px_rgba(201,169,97,0.3)]"
                                : "border-border text-muted-foreground hover:border-vodium-gold/40 hover:text-vodium-black"
                            }`}
                          >
                            <Icon
                              size={16}
                              className={isSelected ? "text-vodium-gold" : "text-muted-foreground"}
                            />
                            <span className="text-[10px] font-medium leading-tight">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </RightField>

                  <RightField label="Campus location" required hint="Where on campus can students find you?">
                    <div className="relative">
                      <MapPin
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <input
                        type="text"
                        placeholder="e.g. Faculty of Arts Complex, Block C"
                        value={form.campusLocation}
                        onChange={(e) => update("campusLocation", e.target.value)}
                        className="input-premium pl-9"
                      />
                    </div>
                  </RightField>
                </div>
              </div>
            )}

            {/* ── Step 2: University ────────────────────────── */}
            {step === 2 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Building2 size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Which campus?</h1>
                  <p className="text-muted-foreground text-sm">
                    We use this to connect you with students at your university.
                  </p>
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {UNIVERSITIES.map((uni) => (
                    <button
                      key={uni}
                      type="button"
                      onClick={() => update("university", uni)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all text-sm flex items-center justify-between ${
                        form.university === uni
                          ? "border-vodium-gold bg-vodium-gold/8 text-vodium-black font-medium"
                          : "border-border text-muted-foreground hover:border-vodium-gold/40 hover:text-vodium-black"
                      }`}
                    >
                      <span>{uni}</span>
                      {form.university === uni && (
                        <CheckCircle size={15} className="text-vodium-gold flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 3: Contact info ──────────────────────── */}
            {step === 3 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Phone size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Your details</h1>
                  <p className="text-muted-foreground text-sm">
                    We&rsquo;ll verify your phone number in the next step.
                  </p>
                </div>

                <div className="space-y-4">
                  <RightField label="Your full name" required>
                    <input
                      type="text"
                      placeholder="e.g. Taiwo Adeyemi"
                      value={form.ownerName}
                      onChange={(e) => update("ownerName", e.target.value)}
                      className="input-premium"
                      autoFocus
                    />
                  </RightField>

                  <RightField
                    label="WhatsApp phone number"
                    required
                    hint="This becomes your Vodium login and bot number."
                  >
                    {/* Nigerian flag + +234 prefix */}
                    <div className="flex">
                      <div className="flex items-center gap-2 px-3.5 bg-white border-y border-l border-border rounded-l-[10px] border-r-0 flex-shrink-0">
                        <span className="text-base leading-none select-none">🇳🇬</span>
                        <span className="text-sm text-vodium-black/70 font-medium">+234</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="801 234 5678"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="input-premium rounded-l-none border-l-0 focus:z-10"
                        style={{ borderRadius: "0 10px 10px 0" }}
                      />
                    </div>
                  </RightField>

                  <RightField label="Email address" hint="Optional — for receipts and account recovery.">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="input-premium"
                    />
                  </RightField>
                </div>
              </div>
            )}

            {/* ── Step 4: OTP ───────────────────────────────── */}
            {step === 4 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Phone size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Check your phone</h1>
                  <p className="text-muted-foreground text-sm">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-semibold text-vodium-black">{form.phone}</span>.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-vodium-black mb-3">
                      6-digit code
                    </label>
                    {/* 6 individual digit boxes */}
                    <div className="flex gap-2.5">
                      {digits.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { digitRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => updateDigit(i, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(i, e)}
                          onPaste={i === 0 ? handleDigitPaste : undefined}
                          autoFocus={i === 0}
                          className="w-full aspect-square text-center text-xl font-mono font-semibold text-vodium-black bg-white border-[1.5px] border-border rounded-xl outline-none transition-all duration-150 focus:border-vodium-gold focus:shadow-[0_0_0_3px_rgba(201,169,97,0.12)] caret-transparent"
                        />
                      ))}
                    </div>
                  </div>

                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Resend code in <span className="font-semibold text-vodium-black tabular-nums">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleSendOtp}
                      className="text-sm font-semibold text-vodium-gold hover:text-vodium-gold/70 transition-colors disabled:opacity-40"
                    >
                      Request a new code →
                    </button>
                  )}

                  {/* Summary review */}
                  <div className="bg-white border border-border rounded-xl p-4 space-y-2">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
                      Your details
                    </p>
                    {[
                      { label: "Business", value: form.businessName },
                      { label: "Campus",   value: form.university },
                      { label: "Location", value: form.campusLocation },
                      { label: "Name",     value: form.ownerName },
                      { label: "Phone",    value: form.phone },
                    ].map((row) => (
                      <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="text-vodium-black text-right font-medium">{row.value || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <button
                  onClick={() => { setStep(step - 1); setError(null); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors"
                >
                  <ArrowLeft size={16} /> Back to home
                </Link>
              )}

              {step < 3 && (
                <ShimmerButton
                  onClick={() => canAdvance() && setStep(step + 1)}
                  className={`px-6 h-11 text-sm gap-2 ${!canAdvance() ? "opacity-40 pointer-events-none" : ""}`}
                >
                  Continue <ArrowRight size={15} />
                </ShimmerButton>
              )}

              {step === 3 && (
                <ShimmerButton
                  onClick={handleSendOtp}
                  className={`px-6 h-11 text-sm gap-2 ${!canAdvance() || loading ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {loading ? "Sending…" : <><span>Send code</span> <ArrowRight size={15} /></>}
                </ShimmerButton>
              )}

              {step === 4 && (
                <ShimmerButton
                  onClick={handleVerifyAndCreate}
                  className={`px-6 h-11 text-sm gap-2 ${!canAdvance() || loading ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {loading ? "Verifying…" : <><span>Create account</span> <ArrowRight size={15} /></>}
                </ShimmerButton>
              )}
            </div>

            {/* Sign-in prompt (mobile) */}
            <p className="mt-8 text-center text-sm text-muted-foreground md:hidden">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By creating an account you agree to Vodium&rsquo;s{" "}
          <a href="#" className="underline underline-offset-2 hover:text-vodium-black transition-colors">Terms</a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-2 hover:text-vodium-black transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RightField({
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
      <label className="block text-sm font-medium text-vodium-black mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function SuccessScreen({ name, business }: { name: string; business: string }) {
  const firstName = name.split(" ")[0];
  const waPhone = "+2348012345678";

  return (
    <div className="min-h-screen bg-vodium-black flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-8 animate-pulse-gold">
          <CheckCircle size={36} className="text-emerald-400" />
        </div>

        <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-4">You&rsquo;re in</p>
        <h1 className="font-serif text-4xl text-vodium-cream mb-4">Welcome, {firstName}!</h1>
        <p className="text-vodium-cream/50 mb-10 leading-relaxed">
          <span className="text-vodium-cream font-semibold">{business}</span> is now on Vodium
          Ledger. Your 60-day free trial has started. Let&rsquo;s record your first credit.
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
            <div key={s} className="flex items-start gap-3 text-sm text-vodium-cream/60">
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
