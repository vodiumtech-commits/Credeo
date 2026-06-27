"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";

type Product = { id: string; name: string; description: string | null; price: number; imageUrl: string | null };
type Org = { id: string; name: string; brandColor: string | null; logoUrl: string | null };

function naira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

function CheckoutInner() {
  const params = useSearchParams();
  const productId = params.get("p") ?? "";

  const [org, setOrg] = useState<Org | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const [step, setStep] = useState<"details" | "otp" | "done">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/storefront/products")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.organization) { setLoadErr("This store is not available."); return; }
        setOrg(data.organization);
        const p = (data.products as Product[]).find((x) => x.id === productId);
        if (!p) setLoadErr("This item is no longer available.");
        else setProduct(p);
      })
      .catch(() => setLoadErr("Could not load the store."));
  }, [productId]);

  const brand = org?.brandColor || "#C9A961";
  const total = useMemo(() => (product ? product.price * qty : 0), [product, qty]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !phone.trim()) return setError("Enter your name and phone number.");
    setBusy(true);
    const res = await fetch("/api/storefront/otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not send a code.");
    setStep("otp");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) return setError("Please accept the BNPL terms to continue.");
    setBusy(true);
    const res = await fetch("/api/storefront/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: fullName.trim(), phone: phone.trim(), otp, consent: true,
        items: [{ productId, quantity: qty }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not submit your request.");
    setStep("done");
  }

  if (loadErr) {
    return <Shell brand="#C9A961"><p className="text-vodium-cream/60 text-sm">{loadErr}</p><Link href="/" className="text-vodium-gold text-sm hover:underline mt-3 inline-block">Back to store</Link></Shell>;
  }
  if (!org || !product) {
    return <Shell brand="#C9A961"><Loader2 className="animate-spin text-vodium-gold" /></Shell>;
  }
  if (step === "done") {
    return (
      <Shell brand={brand} org={org}>
        <div className="text-center">
          <CheckCircle2 size={40} style={{ color: brand }} className="mx-auto" />
          <h1 className="font-serif text-2xl text-vodium-cream mt-4">Request sent!</h1>
          <p className="text-sm text-vodium-cream/55 mt-2">
            {org.name} will review your BNPL request for <strong className="text-vodium-cream">{product.name}</strong> and message you on WhatsApp once it&apos;s approved.
          </p>
          <Link href="/" className="mt-6 inline-block text-sm hover:underline" style={{ color: brand }}>Back to store</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell brand={brand} org={org}>
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-vodium-cream/45 hover:text-vodium-cream mb-5"><ArrowLeft size={14} /> Back to store</Link>

      {/* Item summary */}
      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 flex items-center gap-3 mb-5">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
        ) : <div className="w-14 h-14 rounded-lg bg-black/40" />}
        <div className="min-w-0 flex-1">
          <p className="text-vodium-cream truncate">{product.name}</p>
          <p className="text-sm" style={{ color: brand }}>{naira(product.price)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-lg border border-white/10 text-vodium-cream/70 flex items-center justify-center"><Minus size={13} /></button>
          <span className="text-vodium-cream w-5 text-center">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(99, q + 1))} className="w-7 h-7 rounded-lg border border-white/10 text-vodium-cream/70 flex items-center justify-center"><Plus size={13} /></button>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm mb-5">
        <span className="text-vodium-cream/45">Total</span>
        <span className="font-semibold" style={{ color: brand }}>{naira(total)}</span>
      </div>

      {step === "details" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={inputClass} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp phone (0803… or +234…)" className={inputClass} />
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg text-sm font-bold text-vodium-black inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: brand }}>
            {busy && <Loader2 size={15} className="animate-spin" />} Send confirmation code
          </button>
          <p className="text-[11px] text-vodium-cream/35 text-center">We&apos;ll send a 6-digit code to your WhatsApp to confirm your number.</p>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="Enter 6-digit code" className={`${inputClass} tracking-[0.4em] text-center`} />
          <label className="flex items-start gap-2.5 rounded-lg bg-black/20 border border-white/[0.06] p-3 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-vodium-gold" />
            <span className="text-xs text-vodium-cream/55">
              I agree to {org.name}&apos;s <Link href="/legal/bnpl-terms" className="underline" style={{ color: brand }}>Buy-Now-Pay-Later terms</Link> and to repay the amount owed by the agreed due date.
            </span>
          </label>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg text-sm font-bold text-vodium-black inline-flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: brand }}>
            {busy && <Loader2 size={15} className="animate-spin" />} <ShieldCheck size={15} /> Submit BNPL request
          </button>
          <button type="button" onClick={() => { setStep("details"); setError(null); }} className="w-full text-xs text-vodium-cream/40 hover:text-vodium-cream">Change my details</button>
        </form>
      )}
    </Shell>
  );
}

function Shell({ children, brand, org }: { children: React.ReactNode; brand: string; org?: Org }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {org && (
          <div className="flex items-center gap-3 mb-6 justify-center">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={org.name} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-serif" style={{ backgroundColor: `${brand}1a`, color: brand }}>{org.name.charAt(0).toUpperCase()}</div>
            )}
            <span className="font-serif tracking-[0.14em] text-sm" style={{ color: brand }}>{org.name.toUpperCase()}</span>
          </div>
        )}
        <div className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-6">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
      <CheckoutInner />
    </Suspense>
  );
}
