"use client";

import { useState } from "react";
import Link from "next/link";

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
      if (!res.ok) throw new Error("Could not send code");
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
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
      if (!res.ok) throw new Error("Wrong code, please try again");
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-vodium-cream px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-full bg-vodium-black border border-vodium-gold flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-xl">V</span>
          </div>
          <span className="font-serif tracking-[0.2em] text-vodium-black">VODIUM</span>
        </Link>

        <h1 className="font-serif text-4xl mb-2">Vendor login</h1>
        <p className="text-muted-foreground mb-10">
          {step === "phone"
            ? "We'll send a 6-digit code to your phone."
            : `Enter the 6-digit code we sent to ${phone}.`}
        </p>

        {step === "phone" && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Phone number</label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="0801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-md bg-white focus:outline-none focus:border-vodium-gold"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 rounded-md disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-md bg-white text-center tracking-[0.5em] text-xl focus:outline-none focus:border-vodium-gold"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 rounded-md disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full text-sm text-muted-foreground hover:text-vodium-black"
            >
              Use a different number
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-sm text-danger">{error}</p>
        )}

        <p className="mt-12 text-xs text-muted-foreground text-center">
          By continuing, you agree to Vodium's terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
