"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  Loader2,
} from "lucide-react";

type Mode = "super" | "staff";

const ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  CFO: "/admin/finance",
  CUSTOMER_CARE: "/admin/support",
  ANALYTICS: "/admin/analytics",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("super");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body = mode === "staff" ? { email, password } : { password };
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid credentials");

      // Route to the role-appropriate dashboard
      const redirect = ROLE_REDIRECTS[data.role as string] ?? "/admin";
      router.push(redirect);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-vodium-black mesh-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.08] p-10 shadow-[0_0_60px_rgba(201,169,97,0.08)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-vodium-gold/10 border border-vodium-gold/30 flex items-center justify-center mb-4">
              <Shield size={26} className="text-vodium-gold" />
            </div>
            <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase font-medium mb-1.5">
              Admin Console
            </p>
            <h1 className="font-serif text-2xl text-vodium-cream text-center">
              Vodium Ledger
            </h1>
            <p className="text-vodium-cream/30 text-xs mt-1.5">
              Restricted access authorised personnel only
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-black/30 border border-white/[0.06] rounded-xl p-1 mb-7">
            <button
              onClick={() => {
                setMode("super");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${mode === "super" ? "bg-vodium-gold/15 text-vodium-gold border border-vodium-gold/20" : "text-vodium-cream/35 hover:text-vodium-cream/60"}`}
            >
              Super Admin
            </button>
            <button
              onClick={() => {
                setMode("staff");
                setError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${mode === "staff" ? "bg-vodium-gold/15 text-vodium-gold border border-vodium-gold/20" : "text-vodium-cream/35 hover:text-vodium-cream/60"}`}
            >
              Staff Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email staff only */}
            {mode === "staff" && (
              <div>
                <label className="block text-xs font-medium text-vodium-cream/50 mb-2 uppercase tracking-wider">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={14}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="your@email.com"
                    className="input-dark pr-10 w-full"
                    autoFocus
                    required
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-vodium-cream/50 mb-2 uppercase tracking-wider">
                {mode === "super" ? "Admin password" : "Password"}
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none"
                />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  className="input-dark pl-4 pr-14 w-full"
                  autoFocus={mode === "super"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream/70 transition-colors"
                  tabIndex={-1}
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password || (mode === "staff" && !email)}
              className="btn-gold w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing in…
                </>
              ) : mode === "super" ? (
                "Sign in to Admin Console"
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-vodium-cream/25 hover:text-vodium-cream/55 text-xs transition-colors"
          >
            <ArrowLeft size={12} /> Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
