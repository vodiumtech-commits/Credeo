"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, Mail } from "lucide-react";

type Step = "email" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Could not send a reset code.");
    setStep("reset");
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), otp, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Could not reset your password.");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-vodium-cream/45 hover:text-vodium-gold mb-6">
          <ArrowLeft size={15} /> Back to sign in
        </Link>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="text-vodium-gold" size={22} />
          </div>
          <h1 className="font-serif text-2xl text-vodium-cream">Reset your password</h1>
          <p className="text-sm text-vodium-cream/45 mt-2">
            {step === "email"
              ? "Enter your email and we'll send a 6-digit code."
              : `Enter the code sent to ${email} and choose a new password.`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={requestCode} className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs text-vodium-cream/40">Email</span>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@store.com"
                  className="w-full bg-black/25 border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
                />
              </div>
            </label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 size={15} className="animate-spin" />} Send reset code
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs text-vodium-cream/40">6-digit code</span>
              <input
                inputMode="numeric" maxLength={6} required value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-vodium-cream tracking-[0.4em] text-center placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-vodium-cream/40">New password</span>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
                <input
                  type={show ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-black/25 border border-white/[0.08] rounded-lg pl-9 pr-10 py-2.5 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <Loader2 size={15} className="animate-spin" />} Set new password
            </button>
            <button type="button" onClick={() => { setStep("email"); setError(null); }} className="w-full text-xs text-vodium-cream/40 hover:text-vodium-gold">
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
