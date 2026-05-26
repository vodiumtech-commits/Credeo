"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, CheckCircle, Store, MapPin, Phone,
  MessageCircle, Building2, ShoppingBag, UtensilsCrossed,
  WashingMachine, Printer, Scissors, Sparkles, Pill, ShoppingCart, HelpCircle,
  Shield, Zap, TrendingUp, Lock, Eye, EyeOff, Mail, RefreshCw,
} from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Spotlight } from "@/components/ui/spotlight";


const VENDOR_TYPES = [
  { value: "PROVISION_SHOP", label: "Provision Shop",  icon: ShoppingBag },
  { value: "FOOD_CANTEEN",   label: "Food Canteen",    icon: UtensilsCrossed },
  { value: "LAUNDRY",        label: "Laundry",         icon: WashingMachine },
  { value: "PRINTING",       label: "Printing",        icon: Printer },
  { value: "BARBING_SALON",  label: "Barbing Salon",   icon: Scissors },
  { value: "HAIR_SALON",     label: "Hair Salon",      icon: Sparkles },
  { value: "PHARMACY",       label: "Pharmacy",        icon: Pill },
  { value: "MINI_MART",      label: "Mini Mart",       icon: ShoppingCart },
  { value: "OTHER",          label: "Other",           icon: HelpCircle },
];

type FormData = {
  businessName:   string;
  vendorType:     string;
  campusLocation: string;
  university:     string;
  ownerName:      string;
  phone:          string;
  email:          string;
  password:       string;
};

const STEPS = [
  { id: 1, label: "Business" },
  { id: 2, label: "Campus" },
  { id: 3, label: "Contact" },
  { id: 4, label: "Verify" },
];

export default function RegisterPage() {
  const router = useRouter();
  const submitting  = useRef(false);
  const otpRefs     = useRef<(HTMLInputElement | null)[]>([]);
  const [step, setStep]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [resending, setResending]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError]             = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp]                 = useState(["", "", "", "", "", ""]);
  const [done, setDone]               = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);
  const [form, setForm] = useState<FormData>({
    businessName:   "",
    vendorType:     "",
    campusLocation: "",
    university:     "",
    ownerName:      "",
    phone:          "",
    email:          "",
    password:       "",
  });

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  const canAdvance = () => {
    if (step === 1) return form.businessName.length > 1 && !!form.vendorType && form.campusLocation.length > 2;
    if (step === 2) return form.university.length > 1;
    if (step === 3) return (
      form.ownerName.length > 2 &&
      form.phone.length >= 10 &&
      form.email.includes("@") &&
      form.password.length >= 8
    );
    if (step === 4) return otp.join("").length === 6;
    return false;
  };

  const formPayload = () => ({
    businessName:   form.businessName,
    vendorType:     form.vendorType,
    campusLocation: form.campusLocation,
    university:     form.university,
    ownerName:      form.ownerName,
    phone:          form.phone,
    email:          form.email,
    password:       form.password,
  });

  // Step 3 → send OTP
  async function handleRequestOtp() {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/vendor/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setStep(4);
      setResendCooldown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  // Step 4 → verify OTP + create account
  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6 || submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/vendor/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...formPayload(), otp: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res  = await fetch("/api/vendor/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setResending(false);
    }
  }

  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    setError(null);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text   = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const digits = text.split("");
    const next   = [...otp];
    digits.forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  }

  if (done) return <SuccessScreen name={form.ownerName} business={form.businessName} onDashboard={() => router.push("/dashboard")} />;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[42%] min-h-screen bg-vodium-black relative overflow-hidden px-12 py-10 border-r border-white/[0.05]">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-vodium-gold/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-vodium-gold/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <Spotlight className="-top-60 left-0 opacity-20" />

        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center group-hover:border-vodium-gold/70 transition-colors">
            <span className="font-serif text-vodium-gold text-xl leading-none">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-gold text-sm">VODIUM LEDGER</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <p className="text-vodium-gold text-xs tracking-[0.35em] uppercase mb-6">For campus vendors</p>
          <h2 className="font-serif text-4xl text-vodium-cream leading-tight mb-6">
            Start tracking<br />credit in<br />
            <em className="text-gradient-gold not-italic">minutes.</em>
          </h2>
          <p className="text-vodium-cream/45 leading-relaxed max-w-sm text-sm mb-12">
            Join hundreds of campus vendors who&rsquo;ve stopped losing money to defaults.
            Set up your ledger in under 3 minutes — no card needed.
          </p>
          <div className="space-y-4">
            {[
              { icon: <Zap size={15} />,           label: "No card needed",    sub: "60-day free trial, cancel anytime" },
              { icon: <MessageCircle size={15} />,  label: "WhatsApp-first",   sub: "Record credits right from WhatsApp" },
              { icon: <Shield size={15} />,         label: "Private by design", sub: "Students only see their own balance" },
              { icon: <TrendingUp size={15} />,     label: "Recover more",      sub: "Vendors recover 3× more on average" },
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

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-vodium-cream min-h-screen px-8 py-10 md:px-14">
        <Link href="/" className="flex items-center gap-3 md:hidden mb-10">
          <div className="w-9 h-9 rounded-full bg-vodium-black border border-vodium-gold/40 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-lg">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-black text-sm">VODIUM LEDGER</span>
        </Link>

        <div className="hidden md:flex justify-end mb-6">
          <Link href="/login" className="text-sm text-vodium-black/50 hover:text-vodium-black transition-colors">
            Already have an account?{" "}
            <span className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors">Sign in</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">

            {/* Step progress */}
            <div className="flex items-center gap-2 mb-10">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step >= s.id ? "bg-vodium-gold w-8" : "bg-vodium-black/10 w-4"
                  }`}
                />
              ))}
            </div>

            {/* ── Step 1: Business info ─────────────────────────────── */}
            {step === 1 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Store size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Tell us about your shop</h1>
                  <p className="text-muted-foreground text-sm">This is how your business will appear to students.</p>
                </div>
                <div className="space-y-4">
                  <Field label="Business name" required>
                    <input
                      type="text"
                      placeholder="e.g. Mama Taiwo's Provisions"
                      value={form.businessName}
                      onChange={(e) => update("businessName", e.target.value)}
                      className="input-premium"
                      autoFocus
                    />
                  </Field>
                  <Field label="Type of business" required>
                    <div className="grid grid-cols-3 gap-2">
                      {VENDOR_TYPES.map((t) => {
                        const Icon = t.icon;
                        const sel = form.vendorType === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => update("vendorType", t.value)}
                            className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${
                              sel
                                ? "border-vodium-gold bg-vodium-gold/8 text-vodium-black shadow-[0_0_0_1px_rgba(201,169,97,0.3)]"
                                : "border-border text-muted-foreground hover:border-vodium-gold/40 hover:text-vodium-black"
                            }`}
                          >
                            <Icon size={16} className={sel ? "text-vodium-gold" : "text-muted-foreground"} />
                            <span className="text-[10px] font-medium leading-tight">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Campus location" required hint="Where on campus can students find you?">
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="e.g. Faculty of Arts Complex, Block C"
                        value={form.campusLocation}
                        onChange={(e) => update("campusLocation", e.target.value)}
                        className="input-premium pl-9"
                      />
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 2: University (free-text) ───────────────────── */}
            {step === 2 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Building2 size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Which campus?</h1>
                  <p className="text-muted-foreground text-sm">
                    Type your university name exactly as you know it — abbreviation or full name both work.
                  </p>
                </div>

                <Field label="University / campus name" required hint="e.g. Dominion University, UNILAG, Covenant University">
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Dominion University"
                      value={form.university}
                      onChange={(e) => update("university", e.target.value)}
                      className="input-premium pl-9"
                      autoFocus
                      autoComplete="off"
                    />
                  </div>
                </Field>

                {/* Live normalisation preview — shows exactly what will be stored */}
                {form.university.trim().length > 1 && (
                  <div className="mt-3 flex items-center gap-2 px-3.5 py-2.5 bg-vodium-gold/5 border border-vodium-gold/20 rounded-xl">
                    <CheckCircle size={13} className="text-vodium-gold flex-shrink-0" />
                    <p className="text-xs text-vodium-black/60">
                      Will be saved as{" "}
                      <span className="font-semibold text-vodium-black font-mono">
                        {form.university.trim().replace(/\s+/g, " ").toLowerCase()}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Contact + password ────────────────────────── */}
            {step === 3 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Phone size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Your details</h1>
                  <p className="text-muted-foreground text-sm">Set up your login credentials.</p>
                </div>
                <div className="space-y-4">
                  <Field label="Your full name" required>
                    <input
                      type="text"
                      placeholder="e.g. Taiwo Adeyemi"
                      value={form.ownerName}
                      onChange={(e) => update("ownerName", e.target.value)}
                      className="input-premium"
                      autoFocus
                    />
                  </Field>

                  <Field label="WhatsApp phone number" required hint="Used for the WhatsApp bot — must be your active WhatsApp number.">
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
                  </Field>

                  <Field label="Email address" required>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="input-premium pl-9"
                      />
                    </div>
                  </Field>

                  <Field label="Password" required hint="Minimum 8 characters.">
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        className="input-premium pl-9 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-vodium-black transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.password.length > 0 && form.password.length < 8 && (
                      <p className="text-xs text-danger mt-1.5">Password too short — needs {8 - form.password.length} more character{8 - form.password.length !== 1 ? "s" : ""}.</p>
                    )}
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 4: OTP verification ──────────────────────────── */}
            {step === 4 && (
              <div className="animate-fade-up">
                <div className="mb-7">
                  <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                    <Shield size={20} className="text-vodium-gold" />
                  </div>
                  <h1 className="font-serif text-3xl text-vodium-black mb-2">Verify your email</h1>
                  <p className="text-muted-foreground text-sm">
                    We sent a 6-digit code to{" "}
                    <span className="text-vodium-black font-semibold">{form.email}</span>.
                    <br />It expires in 10 minutes.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-vodium-black mb-3">Verification code</label>
                  <div className="flex gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpInput(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className={`w-full aspect-square text-center text-xl font-bold border rounded-xl transition-all outline-none
                          ${digit ? "border-vodium-gold bg-vodium-gold/5 text-vodium-black" : "border-border bg-white text-vodium-black"}
                          focus:border-vodium-gold focus:ring-2 focus:ring-vodium-gold/20`}
                      />
                    ))}
                  </div>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || resending}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
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
              {step > 1 && step < 4 ? (
                <button
                  onClick={() => { setStep(step - 1); setError(null); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : step === 4 ? (
                <button
                  onClick={() => { setStep(3); setOtp(["", "", "", "", "", ""]); setError(null); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors">
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
                  onClick={handleRequestOtp}
                  className={`px-6 h-11 text-sm gap-2 ${!canAdvance() || loading ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {loading ? "Sending code…" : <><span>Continue</span> <ArrowRight size={15} /></>}
                </ShimmerButton>
              )}

              {step === 4 && (
                <ShimmerButton
                  onClick={handleVerifyOtp}
                  className={`px-6 h-11 text-sm gap-2 ${!canAdvance() || loading ? "opacity-40 pointer-events-none" : ""}`}
                >
                  {loading ? "Creating account…" : <><span>Create account</span> <ArrowRight size={15} /></>}
                </ShimmerButton>
              )}
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground md:hidden">
              Already have an account?{" "}
              <Link href="/login" className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors">Sign in</Link>
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

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
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

function SuccessScreen({ name, business, onDashboard }: { name: string; business: string; onDashboard: () => void }) {
  const firstName = name.split(" ")[0];
  const waPhone = "+2348012345678";
  return (
    <div className="min-h-screen bg-vodium-black flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-8">
          <CheckCircle size={36} className="text-emerald-400" />
        </div>
        <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-4">You&rsquo;re in</p>
        <h1 className="font-serif text-4xl text-vodium-cream mb-4">Welcome, {firstName}!</h1>
        <p className="text-vodium-cream/50 mb-10 leading-relaxed">
          <span className="text-vodium-cream font-semibold">{business}</span> is now on Vodium Ledger.
          Your 60-day free trial has started.
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
          <button
            onClick={onDashboard}
            className="btn-ghost w-full py-4 rounded-xl inline-flex items-center justify-center gap-2 text-base"
          >
            Go to my dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
