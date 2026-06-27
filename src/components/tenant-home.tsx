import Link from "next/link";
import { ArrowRight, BellRing, MessageCircle, Package, Receipt, ShieldCheck } from "lucide-react";
import { formatNaira } from "@/lib/utils";

export type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

/**
 * Branded landing shown on a supermarket's own host
 * (e.g. oreofestores.vodiumledger.com or a verified custom domain).
 * Server component — no customer data is exposed here; balances live behind
 * the per-order receipt links only.
 */
export function TenantHome({
  name,
  brandColor,
  logoUrl,
  whatsappNumber = null,
  products = [],
}: {
  name: string;
  brandColor: string | null;
  logoUrl: string | null;
  whatsappNumber?: string | null;
  products?: StoreProduct[];
}) {
  const brand = brandColor || "#C9A961";
  const initial = name.trim().charAt(0).toUpperCase() || "V";
  const waLink = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi ${name}! I'd like to ask about Buy-Now-Pay-Later.`)}`
    : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-vodium-cream flex flex-col">
      {/* Header */}
      <header className="px-5 md:px-10 h-16 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className="w-9 h-9 rounded-xl object-cover border" style={{ borderColor: `${brand}55` }} />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-vodium-charcoal border flex items-center justify-center font-serif text-lg" style={{ borderColor: `${brand}55`, color: brand }}>
              {initial}
            </div>
          )}
          <span className="font-serif text-sm tracking-[0.14em]" style={{ color: brand }}>{name.toUpperCase()}</span>
        </div>
        <Link
          href="/login"
          className="text-xs font-bold text-vodium-black px-4 py-2 rounded-lg inline-flex items-center gap-1.5"
          style={{ backgroundColor: brand }}
        >
          Staff sign in <ArrowRight size={14} />
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 px-5 md:px-10">
        <section className="max-w-3xl mx-auto py-16 md:py-24 text-center">
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: brand }}>Buy now, pay later</p>
          <h1 className="font-serif text-3xl md:text-5xl mt-4 leading-tight">
            Shop at {name},<br />pay on your terms.
          </h1>
          <p className="text-vodium-cream/50 mt-5 max-w-xl mx-auto leading-relaxed">
            {name} lets trusted customers take what they need today and pay back on a clear schedule. Every order comes with
            a private receipt link to track and settle your balance.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="px-5 py-2.5 rounded-lg text-sm font-bold text-vodium-black inline-flex items-center gap-2" style={{ backgroundColor: brand }}>
              Staff sign in <ArrowRight size={15} />
            </Link>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10">
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
            )}
            <Link href="/legal/bnpl-terms" className="px-5 py-2.5 rounded-lg text-sm border border-white/10 text-vodium-cream/70 hover:text-vodium-cream">
              How it works
            </Link>
          </div>
        </section>

        {/* Products available on BNPL */}
        {products.length > 0 && (
          <section className="max-w-5xl mx-auto pb-16">
            <h2 className="font-serif text-xl text-vodium-cream mb-4">Available on Buy-Now-Pay-Later</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden flex flex-col">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-black/30 flex items-center justify-center"><Package size={30} className="text-vodium-cream/20" /></div>
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-vodium-cream font-medium">{p.name}</p>
                    {p.description && <p className="text-xs text-vodium-cream/40 mt-1 line-clamp-2">{p.description}</p>}
                    <p className="mt-2 text-lg" style={{ color: brand }}>{formatNaira(p.price)}</p>
                    <Link
                      href={`/checkout?p=${p.id}`}
                      className="mt-3 w-full text-center py-2 rounded-lg text-sm font-bold text-vodium-black"
                      style={{ backgroundColor: brand }}
                    >
                      Buy on BNPL
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How it works for customers */}
        <section className="max-w-4xl mx-auto pb-16 grid sm:grid-cols-3 gap-4">
          <Feature icon={<Receipt size={18} />} brand={brand} title="Get your receipt link" body="At checkout you receive a private link showing your items, total and due date." />
          <Feature icon={<ShieldCheck size={18} />} brand={brand} title="Accept the terms" body="Tap to confirm you agree to pay by the due date. Your acceptance is recorded." />
          <Feature icon={<BellRing size={18} />} brand={brand} title="Friendly reminders" body="We send respectful reminders so you never miss a payment and keep good standing." />
        </section>

        {/* Customer help strip */}
        <section className="max-w-3xl mx-auto pb-20">
          <div className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-3">
              <MessageCircle size={18} style={{ color: brand }} className="mt-0.5" />
              <div>
                <p className="font-semibold text-vodium-cream">Already a customer?</p>
                <p className="text-sm text-vodium-cream/50 mt-1">Open the receipt link {name} sent you on WhatsApp to view or pay your balance.</p>
              </div>
            </div>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="shrink-0 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 text-vodium-black" style={{ backgroundColor: brand }}>
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-5 md:px-10 py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-vodium-cream/35">
        <span>© {new Date().getFullYear()} {name}</span>
        <div className="flex items-center gap-4">
          <Link href="/legal/bnpl-terms" className="hover:text-vodium-gold">BNPL terms</Link>
          <Link href="/legal/privacy" className="hover:text-vodium-gold">Privacy</Link>
          <span>Powered by Vodium Ledger</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, body, brand }: { icon: React.ReactNode; title: string; body: string; brand: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${brand}1a`, color: brand }}>
        {icon}
      </div>
      <p className="font-semibold text-vodium-cream">{title}</p>
      <p className="text-sm text-vodium-cream/50 mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}
