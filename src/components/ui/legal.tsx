import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const COMPANY = "Vodium Ledger";
const SUPPORT_EMAIL = "support@vodiumledger.com";

export const LEGAL_DOCS = [
  { slug: "terms", title: "Terms of Service", blurb: "The agreement governing use of the Vodium Ledger platform." },
  { slug: "privacy", title: "Privacy Policy", blurb: "How we collect, use and protect personal data under the NDPA." },
  { slug: "bnpl-terms", title: "BNPL Customer Terms", blurb: "Repayment terms for customers buying on credit at a store." },
  { slug: "refund", title: "Refund & Dispute Policy", blurb: "How refunds, chargebacks and disputes are handled." },
  { slug: "service-agreement", title: "Supermarket Service Agreement", blurb: "Commercial terms for supermarket and enterprise tenants." },
  { slug: "dpa", title: "Data Processing Agreement", blurb: "Vodium's processor obligations for store-controlled customer data." },
  { slug: "payment-authorization", title: "Payment Authorization Terms", blurb: "How a customer authorises payments via a licensed provider." },
  { slug: "cookies", title: "Cookie Policy", blurb: "The cookies Vodium Ledger uses and why." },
];

export function LegalArticle({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-6">
      <Link href="/legal" className="inline-flex items-center gap-2 text-sm text-vodium-cream/45 hover:text-vodium-gold">
        <ArrowLeft size={15} /> All legal documents
      </Link>

      <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-xs text-amber-200/80">
        Template document. Review and adapt with a qualified Nigerian lawyer before relying on it for live customers.
      </div>

      <header>
        <h1 className="font-serif text-3xl text-vodium-cream">{title}</h1>
        <p className="text-sm text-vodium-cream/40 mt-2">Last updated: {updated} · {COMPANY}</p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-vodium-cream/70 [&_h2]:font-serif [&_h2]:text-lg [&_h2]:text-vodium-cream [&_h2]:mt-8 [&_h2]:mb-2 [&_a]:text-vodium-gold [&_a]:underline [&_strong]:text-vodium-cream [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:marker:text-vodium-gold/50">
        {children}
      </div>

      <footer className="border-t border-white/[0.06] pt-5 text-xs text-vodium-cream/35">
        Questions? Contact <a className="text-vodium-gold underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </footer>
    </article>
  );
}
