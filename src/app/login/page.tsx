"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("Could not send code. Check your number and try again.");
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
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

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* ── Left panel (dark brand) ─────────────────────── */}
      <div className="hidden md:flex flex-col bg-vodium-black px-12 py-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,169,97,0.08),transparent_60%)]" />
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-lg">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-gold text-sm">VODIUM LEDGER</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-6">Vendor portal</p>
          <h2 className="font-serif text-4xl text-vodium-cream leading-tight mb-6">
            Your ledger.<br />Your money.<br />
            <em className="text-vodium-gold not-italic">Your terms.</em>
          </h2>
          <p className="text-vodium-cream/50 leading-relaxed max-w-sm">
            Log in to see who owes you, recover outstanding credits, and track your campus book in real time.
          </p>
        </div>

        {/* Social proof strip */}
        <div className="border-t border-white/[0.08] pt-8 relative z-10">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="font-serif text-2xl text-vodium-gold">127</p>
              <p className="text-vodium-cream/40 text-xs mt-0.5">Active vendors</p>
            </div>
            <div>
              <p className="font-serif text-2xl text-vodium-gold">₦47M+</p>
              <p className="text-vodium-cream/40 text-xs mt-0.5">Credit tracked</p>
            </div>
            <div>
              <p className="font-serif text-2xl text-vodium-gold">73%</p>
              <p className="text-vodium-cream/40 text-xs mt-0.5">Repayment rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel (form) ──────────────────────────── */}
      <div className="flex flex-col bg-vodium-cream px-8 py-10 md:px-14">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-3 md:hidden mb-10">
          <div className="w-9 h-9 rounded-full bg-vodium-black border border-vodium-gold/40 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-lg">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-black text-sm">VODIUM</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          {step === "phone" ? (
            <>
              <div className="mb-10">
                <h1 className="font-serif text-4xl text-vodium-black mb-2">Welcome back</h1>
                <p className="text-muted-foreground text-sm">
                  Enter your phone number and we&rsquo;ll send a 6-digit code.
                </p>
              </div>

              <form onSubmit={requestOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vodium-black mb-2">
                    Phone number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="0801 234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-premium pl-10"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Format: 0801 234 5678 or +234 801 234 5678</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-danger">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="btn-gold w-full py-3.5 rounded-xl disabled:opacity-50 gap-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <LoadingSpinner /> Sending code…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 justify-center">
                      Send code <ArrowRight size={16} />
                    </span>
                  )}
                </button>
              </form>

              <p className="mt-10 text-center text-sm text-muted-foreground">
                No account yet?{" "}
                <Link href="/register" className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors">
                  Register your shop
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); setError(null); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-vodium-black transition-colors mb-10 -ml-1"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="mb-10">
                <div className="w-14 h-14 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center mb-6">
                  <Lock size={24} className="text-vodium-gold" />
                </div>
                <h1 className="font-serif text-4xl text-vodium-black mb-2">Check your phone</h1>
                <p className="text-muted-foreground text-sm">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-vodium-black">{phone}</span>.
                  It expires in 10 minutes.
                </p>
              </div>

              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vodium-black mb-2">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="input-premium text-center tracking-[0.6em] text-2xl font-mono"
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-danger">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="btn-gold w-full py-3.5 rounded-xl disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <LoadingSpinner /> Verifying…
                    </span>
                  ) : (
                    "Verify & sign in"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("phone"); setError(null); setOtp(""); }}
                  className="w-full text-sm text-muted-foreground hover:text-vodium-black transition-colors py-2"
                >
                  Resend code or use a different number
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing you agree to Vodium&rsquo;s{" "}
          <a href="#" className="underline underline-offset-2 hover:text-vodium-black transition-colors">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-2 hover:text-vodium-black transition-colors">
            Privacy Policy
          </a>.
        </p>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
