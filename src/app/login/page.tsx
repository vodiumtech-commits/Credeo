"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Lock, Shield, Zap, Eye } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";

// ── Slide transition variants ─────────────────────────────────────────────────
const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const RESEND_SECONDS = 60;

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [dir, setDir] = useState(1); // 1 = forward, -1 = back
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Countdown timer for resend ──────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const goToOtp = () => {
    setDir(1);
    setStep("otp");
    setCountdown(RESEND_SECONDS);
    setDigits(["", "", "", "", "", ""]);
    setError(null);
  };

  const goToPhone = () => {
    setDir(-1);
    setStep("phone");
    setError(null);
    setDigits(["", "", "", "", "", ""]);
  };

  const otp = digits.join("");

  // ── OTP box handlers ────────────────────────────────────────────────────────
  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      const cleaned = value.replace(/\D/g, "").slice(-1);
      const next = [...digits];
      next[index] = cleaned;
      setDigits(next);
      if (cleaned && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleDigitKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          const next = [...digits];
          next[index] = "";
          setDigits(next);
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      }
    },
    [digits]
  );

  const handleDigitPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const next = [...digits];
      pasted.split("").forEach((char, i) => {
        if (i < 6) next[i] = char;
      });
      setDigits(next);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    },
    [digits]
  );

  // ── API calls ────────────────────────────────────────────────────────────────
  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("Could not send code. Check your number and try again.");
      goToOtp();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      if (!res.ok) throw new Error("Wrong code. Please try again.");
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (countdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("Could not resend code.");
      setCountdown(RESEND_SECONDS);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-vodium-black">
      {/* ── Left panel — brand ──────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[40%] min-h-screen bg-vodium-black relative overflow-hidden px-12 py-10 border-r border-white/[0.05]">
        {/* Background treatments */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-vodium-gold/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-vodium-gold/[0.03] rounded-full blur-[80px] pointer-events-none" />
        <Spotlight className="-top-60 left-0 opacity-20" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center group-hover:border-vodium-gold/70 transition-colors duration-200">
            <span className="font-serif text-vodium-gold text-xl leading-none">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-gold text-sm">VODIUM LEDGER</span>
        </Link>

        {/* Main copy */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <p className="text-vodium-gold text-xs tracking-[0.35em] uppercase mb-6">Vendor portal</p>
          <h2 className="font-serif text-4xl text-vodium-cream leading-tight mb-6">
            Your ledger.<br />
            Your money.<br />
            <em className="text-gradient-gold not-italic">Your terms.</em>
          </h2>
          <p className="text-vodium-cream/45 leading-relaxed max-w-sm text-sm mb-12">
            Log in to see who owes you, recover outstanding credits, and track your campus book in real time.
          </p>

          {/* Trust bullets */}
          <div className="space-y-4">
            {[
              { icon: <Shield size={15} />, label: "Bank-grade encryption", sub: "All data encrypted in transit and at rest" },
              { icon: <Zap size={15} />,    label: "Instant access",         sub: "Sign in with just your phone number" },
              { icon: <Eye size={15} />,    label: "Private by default",     sub: "Only you can see your customer book" },
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
              { value: "127+", label: "Active vendors" },
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

      {/* ── Right panel — form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-vodium-cream px-8 py-10 md:px-14 min-h-screen">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-3 md:hidden mb-10">
          <div className="w-9 h-9 rounded-full bg-vodium-black border border-vodium-gold/40 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-lg">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-black text-sm">VODIUM LEDGER</span>
        </Link>

        {/* Centered form area */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-10">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${step === "phone" ? "bg-vodium-gold" : "bg-vodium-black/20"}`} />
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${step === "otp" ? "bg-vodium-gold" : "bg-vodium-black/20"}`} />
            </div>

            <AnimatePresence mode="wait" custom={dir}>
              {step === "phone" ? (
                <motion.div
                  key="phone"
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Phone step */}
                  <div className="mb-8">
                    <h1 className="font-serif text-4xl text-vodium-black mb-2">Welcome back</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Enter your registered phone number and we&rsquo;ll send a 6-digit code via SMS.
                    </p>
                  </div>

                  <form onSubmit={requestOtp} className="space-y-4">
                    {/* Phone input with +234 prefix */}
                    <div>
                      <label className="block text-sm font-medium text-vodium-black mb-2">
                        Phone number
                      </label>
                      <div className="flex">
                        {/* Flag + prefix */}
                        <div className="flex items-center gap-2 px-3.5 bg-white border-y border-l border-border rounded-l-[10px] border-r-0 flex-shrink-0">
                          <span className="text-base leading-none select-none">🇳🇬</span>
                          <span className="text-sm text-vodium-black/70 font-medium">+234</span>
                        </div>
                        <input
                          type="tel"
                          inputMode="tel"
                          placeholder="801 234 5678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="input-premium rounded-l-none border-l-0 focus:z-10"
                          required
                          autoFocus
                          style={{ borderRadius: "0 10px 10px 0" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        We&rsquo;ll send a 6-digit code via SMS
                      </p>
                    </div>

                    {error && <ErrorBanner message={error} />}

                    <ShimmerButton
                      type="submit"
                      className={`w-full h-12 gap-2 ${loading || !phone.trim() ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <Spinner /> Sending code…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 justify-center">
                          Send OTP <ArrowRight size={16} />
                        </span>
                      )}
                    </ShimmerButton>
                  </form>

                  <p className="mt-10 text-center text-sm text-muted-foreground">
                    No account yet?{" "}
                    <Link
                      href="/register"
                      className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors duration-150"
                    >
                      Register your shop
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  custom={dir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* OTP step */}
                  <button
                    onClick={goToPhone}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors duration-150 mb-8 -ml-1"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>

                  <div className="mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                      <Lock size={24} className="text-vodium-gold" />
                    </div>
                    <h1 className="font-serif text-4xl text-vodium-black mb-2">Check your phone</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      We sent a 6-digit code to{" "}
                      <span className="font-semibold text-vodium-black">+234 {phone}</span>.
                      It expires in 10 minutes.
                    </p>
                  </div>

                  <form onSubmit={verifyOtp} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-vodium-black mb-3">
                        Enter 6-digit code
                      </label>

                      {/* 6-box OTP input */}
                      <div className="flex gap-2.5">
                        {digits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleDigitChange(i, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(i, e)}
                            onPaste={i === 0 ? handleDigitPaste : undefined}
                            autoFocus={i === 0}
                            className="w-full aspect-square text-center text-xl font-mono font-semibold text-vodium-black bg-white border-[1.5px] border-border rounded-xl outline-none transition-all duration-150 focus:border-vodium-gold focus:shadow-[0_0_0_3px_rgba(201,169,97,0.12)] caret-transparent"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Countdown / resend */}
                    <div className="text-sm text-muted-foreground">
                      {countdown > 0 ? (
                        <span>Resend code in <span className="font-semibold text-vodium-black tabular-nums">{countdown}s</span></span>
                      ) : (
                        <button
                          type="button"
                          onClick={resendOtp}
                          disabled={loading}
                          className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors duration-150 disabled:opacity-50"
                        >
                          Resend code
                        </button>
                      )}
                    </div>

                    {error && <ErrorBanner message={error} />}

                    <ShimmerButton
                      type="submit"
                      className={`w-full h-12 gap-2 ${loading || otp.length !== 6 ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2 justify-center">
                          <Spinner /> Verifying…
                        </span>
                      ) : (
                        "Verify & sign in"
                      )}
                    </ShimmerButton>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer legal */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing you agree to Vodium&rsquo;s{" "}
          <a href="#" className="underline underline-offset-2 hover:text-vodium-black transition-colors">Terms</a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-2 hover:text-vodium-black transition-colors">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

// ── Utility sub-components ────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2"
    >
      <span className="flex-shrink-0 mt-0.5">⚠</span>
      <span>{message}</span>
    </motion.div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
