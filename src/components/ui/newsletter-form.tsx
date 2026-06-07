"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

export function NewsletterForm() {
  const [email,     setEmail]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("Could not subscribe");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle size={22} className="text-emerald-400" />
        </div>
        <p className="text-vodium-cream font-medium text-sm">You&apos;re in.</p>
        <p className="text-vodium-cream/40 text-xs">Check your inbox — we&apos;ll send the next article there.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          required
          className="input-dark flex-1 rounded-xl"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-gold px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Subscribing…</>
            : <><ArrowRight size={14} /> Subscribe</>
          }
        </button>
      </form>
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
