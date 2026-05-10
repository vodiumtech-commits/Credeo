"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Shield, Zap, MessageCircle, TrendingUp } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left panel — brand ───────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col w-[42%] min-h-screen bg-vodium-black relative overflow-hidden px-12 py-10 border-r border-white/[0.05]">
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

        <div className="flex-1 flex flex-col justify-center relative z-10">
          <p className="text-vodium-gold text-xs tracking-[0.35em] uppercase mb-6">Welcome back</p>
          <h2 className="font-serif text-4xl text-vodium-cream leading-tight mb-6">
            Your credit<br />ledger<br />
            <em className="text-gradient-gold not-italic">awaits.</em>
          </h2>
          <p className="text-vodium-cream/45 leading-relaxed max-w-sm text-sm mb-12">
            Sign in to track credits, send reminders, and view your repayment dashboard.
          </p>

          <div className="space-y-4">
            {[
              { icon: <Zap size={15} />,           label: "Instant access",    sub: "Your full dashboard in seconds" },
              { icon: <MessageCircle size={15} />,  label: "WhatsApp-first",   sub: "Record credits right from WhatsApp" },
              { icon: <Shield size={15} />,         label: "Secure by default", sub: "Your data is encrypted end-to-end" },
              { icon: <TrendingUp size={15} />,     label: "Recovery insights", sub: "See which students owe and how much" },
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
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-3 md:hidden mb-10">
          <div className="w-9 h-9 rounded-full bg-vodium-black border border-vodium-gold/40 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-lg">V</span>
          </div>
          <span className="font-serif tracking-[0.18em] text-vodium-black text-sm">VODIUM LEDGER</span>
        </Link>

        <div className="hidden md:flex justify-end mb-6">
          <Link href="/register" className="text-sm text-vodium-black/50 hover:text-vodium-black transition-colors">
            No account?{" "}
            <span className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors">Sign up free</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
              <div className="w-11 h-11 rounded-2xl bg-vodium-gold/10 border border-vodium-gold/25 flex items-center justify-center mb-5">
                <Lock size={20} className="text-vodium-gold" />
              </div>
              <h1 className="font-serif text-3xl text-vodium-black mb-2">Sign in</h1>
              <p className="text-muted-foreground text-sm">Enter your email and password to access your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-vodium-black mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    required
                    className="input-premium pl-9 w-full"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-vodium-black">Password</label>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    required
                    className="input-premium pl-9 pr-10 w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-vodium-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-danger flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <ShimmerButton
                type="submit"
                className={`w-full h-11 text-sm mt-2 ${loading ? "opacity-50 pointer-events-none" : ""}`}
              >
                {loading ? "Signing in…" : "Sign in"}
              </ShimmerButton>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground md:hidden">
              No account?{" "}
              <Link href="/register" className="text-vodium-black font-semibold hover:text-vodium-gold transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
