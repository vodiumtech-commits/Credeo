import Link from "next/link";
import { ArrowRight, BadgeCheck, BellRing, Clock, MessageCircle, Package, Receipt, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { formatNaira } from "@/lib/utils";

export type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

/**
 * Branded storefront shown on a supermarket's host (e.g. oreofe.vodiumledger.com).
 * Server component — no customer data is exposed; balances live behind per-order
 * receipt links only.
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
    <div className="min-h-screen bg-[#0A0A0A] text-vodium-cream">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0A0A0A]/85 border-b border-white/[0.06] pt-safe px-safe">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name} className="w-9 h-9 rounded-xl object-cover border" style={{ borderColor: `${brand}55` }} />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-vodium-charcoal border flex items-center justify-center font-serif text-lg" style={{ borderColor: `${brand}55`, color: brand }}>{initial}</div>
            )}
            <span className="font-serif text-sm tracking-[0.14em] truncate max-w-[40vw]" style={{ color: brand }}>{name.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <a href="#shop" className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 rounded-lg text-vodium-black items-center gap-1.5" style={{ backgroundColor: brand }}>
                <ShoppingBag size={14} /> Shop
              </a>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="text-xs font-semibold px-3 py-2 rounded-lg border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 inline-flex items-center gap-1.5">
                <MessageCircle size={14} /> <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            <Link href="/login" className="text-xs text-vodium-cream/45 hover:text-vodium-cream px-2">Staff</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(60% 80% at 50% -10%, ${brand}22, transparent 70%)` }} />
        <div className="absolute -top-24 right-0 w-80 h-80 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${brand}1f` }} />
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border" style={{ color: brand, borderColor: `${brand}33`, backgroundColor: `${brand}14` }}>
            <Sparkles size={13} /> Buy now, pay later
          </span>
          <h1 className="font-serif text-4xl md:text-6xl mt-6 leading-[1.05]">
            Shop at {name}.<br />
            <span style={{ color: brand }}>Pay on your terms.</span>
          </h1>
          <p className="text-vodium-cream/55 mt-5 max-w-xl mx-auto leading-relaxed">
            Take what you need today and pay back on a clear, friendly schedule. Every order comes with a private receipt link to track and settle your balance.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {products.length > 0 ? (
              <a href="#shop" className="px-6 py-3 rounded-xl text-sm font-bold text-vodium-black inline-flex items-center gap-2 shadow-lg" style={{ backgroundColor: brand }}>
                <ShoppingBag size={16} /> Start shopping
              </a>
            ) : (
              <Link href="/legal/bnpl-terms" className="px-6 py-3 rounded-xl text-sm font-bold text-vodium-black inline-flex items-center gap-2" style={{ backgroundColor: brand }}>
                How it works <ArrowRight size={15} />
              </Link>
            )}
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10">
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            )}
          </div>

          {/* Trust row */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { icon: <Clock size={15} />, label: "Quick approval" },
              { icon: <ShieldCheck size={15} />, label: "Secure & private" },
              { icon: <BellRing size={15} />, label: "Gentle reminders" },
              { icon: <BadgeCheck size={15} />, label: "Build your credit" },
            ].map((t) => (
              <div key={t.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 flex flex-col items-center gap-1.5">
                <span style={{ color: brand }}>{t.icon}</span>
                <span className="text-[11px] text-vodium-cream/55 text-center">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-5 md:px-8">
        {/* Products */}
        {products.length > 0 && (
          <section id="shop" className="py-16 scroll-mt-20">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em]" style={{ color: brand }}>Shop</p>
                <h2 className="font-serif text-2xl md:text-3xl mt-1">Available on Buy-Now-Pay-Later</h2>
              </div>
              <span className="text-xs text-vodium-cream/35">{products.length} item{products.length === 1 ? "" : "s"}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="group rounded-2xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden flex flex-col hover:border-white/[0.12] transition-colors">
                  <div className="relative">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-40 bg-black/30 flex items-center justify-center"><Package size={30} className="text-vodium-cream/20" /></div>
                    )}
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-md text-vodium-black" style={{ backgroundColor: brand }}>Pay later</span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-vodium-cream font-medium leading-snug">{p.name}</p>
                    {p.description && <p className="text-xs text-vodium-cream/40 mt-1 line-clamp-2">{p.description}</p>}
                    <p className="mt-2 text-lg font-semibold" style={{ color: brand }}>{formatNaira(p.price)}</p>
                    <Link href={`/checkout?p=${p.id}`} className="mt-3 w-full text-center py-2.5 rounded-xl text-sm font-bold text-vodium-black inline-flex items-center justify-center gap-1.5" style={{ backgroundColor: brand }}>
                      <ShoppingBag size={14} /> Buy on BNPL
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How it works */}
        <section className="py-16 border-t border-white/[0.06]">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: brand }}>Simple & transparent</p>
            <h2 className="font-serif text-2xl md:text-3xl mt-1">How Buy-Now-Pay-Later works</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Step n={1} brand={brand} icon={<ShoppingBag size={18} />} title="Pick your items" body="Choose what you need from the store and start a BNPL request." />
            <Step n={2} brand={brand} icon={<ShieldCheck size={18} />} title="Confirm & sign" body="Verify your WhatsApp number and accept the simple repayment terms." />
            <Step n={3} brand={brand} icon={<Receipt size={18} />} title="Get approved" body={`${name} reviews and approves, then sends your private receipt link.`} />
            <Step n={4} brand={brand} icon={<BellRing size={18} />} title="Pay back easily" body="Settle by your due date. We send respectful reminders so you stay on track." />
          </div>
        </section>

        {/* Customer help strip */}
        <section className="pb-20">
          <div className="rounded-2xl border border-white/[0.06] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between" style={{ background: `linear-gradient(120deg, ${brand}14, transparent)` }}>
            <div className="flex items-start gap-3">
              <MessageCircle size={20} style={{ color: brand }} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-vodium-cream">Already a customer?</p>
                <p className="text-sm text-vodium-cream/55 mt-1">Open the receipt link {name} sent you on WhatsApp to view or pay your balance.</p>
              </div>
            </div>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-vodium-black inline-flex items-center gap-2" style={{ backgroundColor: brand }}>
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-vodium-cream/35">
          <span>© {new Date().getFullYear()} {name}</span>
          <div className="flex items-center gap-4">
            <Link href="/legal/bnpl-terms" className="hover:text-vodium-gold">BNPL terms</Link>
            <Link href="/legal/privacy" className="hover:text-vodium-gold">Privacy</Link>
            <span className="text-vodium-cream/25">Powered by Vodium Ledger</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Step({ n, icon, title, body, brand }: { n: number; icon: React.ReactNode; title: string; body: string; brand: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-5 relative">
      <span className="absolute top-4 right-4 font-serif text-2xl text-white/[0.06]">{n}</span>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${brand}1a`, color: brand }}>{icon}</div>
      <p className="font-semibold text-vodium-cream">{title}</p>
      <p className="text-sm text-vodium-cream/50 mt-1.5 leading-relaxed">{body}</p>
    </div>
  );
}
