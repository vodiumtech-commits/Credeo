"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, Lock, ArrowLeft, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid password");
      router.push("/admin");
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
        <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.08] p-10 w-full shadow-[0_0_60px_rgba(201,169,97,0.08)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            {/* Shield icon in gold circle */}
            <div className="w-16 h-16 rounded-full bg-vodium-gold/10 border border-vodium-gold/30 flex items-center justify-center mb-5">
              <Shield size={28} className="text-vodium-gold" />
            </div>
            <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase font-medium mb-2">
              Admin Console
            </p>
            <h1 className="font-serif text-2xl text-vodium-cream text-center">
              Vodium Ledger
            </h1>
            <p className="text-vodium-cream/35 text-xs mt-1.5 text-center">
              Restricted access — authorised personnel only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password field */}
            <div>
              <label className="block text-xs font-medium text-vodium-cream/50 mb-2 uppercase tracking-wider">
                Admin Password
              </label>
              <div className="relative">
                {/* Lock icon on left */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none">
                  <Lock size={15} />
                </div>
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter admin password"
                  className="input-dark pl-11 pr-12"
                  autoFocus
                  required
                />
                {/* Eye toggle on right */}
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream/70 transition-colors"
                  tabIndex={-1}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-gold w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in to Admin Console"
              )}
            </button>
          </form>
        </div>

        {/* Back to site link */}
        <div className="flex justify-center mt-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-vodium-cream/30 hover:text-vodium-cream/60 text-xs transition-colors"
          >
            <ArrowLeft size={13} />
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
