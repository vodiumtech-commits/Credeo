"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";

function AcceptForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) return setError("This link is missing its invitation token.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    const res = await fetch("/api/staff/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Could not activate your account.");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-vodium-gold" size={22} />
          </div>
          <p className="font-serif text-[11px] tracking-[0.28em] text-vodium-gold">VODIUM LEDGER</p>
          <h1 className="font-serif text-2xl text-vodium-cream mt-3">Activate your staff account</h1>
          <p className="text-sm text-vodium-cream/45 mt-2">Set a password to finish joining your team.</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs text-vodium-cream/40">New password</span>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-black/25 border border-white/[0.08] rounded-lg pl-9 pr-10 py-2.5 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-vodium-cream/40">Confirm password</span>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-black/25 border border-white/[0.08] rounded-lg pl-9 pr-3 py-2.5 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
              />
            </div>
          </label>

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Activate account
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StaffAcceptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
      <AcceptForm />
    </Suspense>
  );
}
