import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="border-b border-white/[0.06] px-5 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-sm">V</span>
          </div>
          <span className="font-serif text-[11px] tracking-[0.25em] text-vodium-gold">VODIUM LEDGER</span>
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-10">{children}</main>
    </div>
  );
}
