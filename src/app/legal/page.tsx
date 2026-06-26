import Link from "next/link";
import { FileText } from "lucide-react";
import { LEGAL_DOCS } from "@/components/ui/legal";

export const metadata = { title: "Legal · Vodium Ledger" };

export default function LegalIndexPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Legal</p>
        <h1 className="font-serif text-3xl text-vodium-cream mt-1">Policies & agreements</h1>
        <p className="text-sm text-vodium-cream/45 mt-2">The documents that govern Vodium Ledger and credit purchases made through it.</p>
      </header>

      <div className="space-y-3">
        {LEGAL_DOCS.map((doc) => (
          <Link
            key={doc.slug}
            href={`/legal/${doc.slug}`}
            className="block rounded-xl border border-white/[0.06] bg-vodium-charcoal p-4 hover:border-vodium-gold/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <FileText size={16} className="text-vodium-gold mt-0.5 shrink-0" />
              <div>
                <p className="text-vodium-cream font-semibold">{doc.title}</p>
                <p className="text-sm text-vodium-cream/45 mt-1">{doc.blurb}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
