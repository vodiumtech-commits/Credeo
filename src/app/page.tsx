import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-vodium-black text-vodium-cream">
      {/* Header */}
      <header className="px-6 py-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-vodium-charcoal border border-vodium-gold flex items-center justify-center">
            <span className="font-serif text-vodium-gold text-xl">V</span>
          </div>
          <span className="font-serif tracking-[0.2em] text-vodium-gold">VODIUM</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-vodium-cream/80 hover:text-vodium-gold transition"
        >
          Vendor login →
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-12 py-20 md:py-32 max-w-5xl mx-auto">
        <p className="text-vodium-gold text-sm tracking-[0.3em] mb-6">
          VODIUM LEDGER
        </p>
        <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-6">
          Africa's credit
          <br />
          <span className="italic text-vodium-gold">infrastructure layer.</span>
        </h1>
        <p className="text-lg md:text-xl text-vodium-cream/70 max-w-2xl mb-10">
          Track every credit. Recover what you're owed. Know which students pay back —
          across every shop on campus. Built for Nigerian vendors. Free for 60 days.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="btn-gold inline-flex items-center justify-center px-8 py-4 rounded-md text-base"
          >
            Get started — free
          </Link>
          <a
            href="https://wa.me/14155238886?text=join%20vodium"
            className="btn-ghost inline-flex items-center justify-center px-8 py-4 rounded-md text-base border-vodium-cream/40 text-vodium-cream"
          >
            Try on WhatsApp →
          </a>
        </div>
      </section>

      <div className="brand-divider mx-6 md:mx-12" />

      {/* Value props */}
      <section className="px-6 md:px-12 py-20 md:py-28 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10">
          <Feature
            title="One WhatsApp message"
            body="Add a credit, mark it paid, send a reminder — all from the chat you already use every day."
          />
          <Feature
            title="Cross-vendor scoring"
            body="See if a student paid back at other shops on campus before you give them credit."
          />
          <Feature
            title="Recover automatically"
            body="Polite reminders go out before due dates. Fewer defaults. More money in your pocket."
          />
        </div>
      </section>

      {/* CTA strip */}
      <section className="bg-vodium-charcoal px-6 md:px-12 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl mb-4">
            Built for the vendor. Owned by Africa.
          </h2>
          <p className="text-vodium-cream/70 mb-8">
            Vodium Ledger is Phase 1 of Vodium — Africa's premium credit & lifestyle ecosystem.
          </p>
          <Link
            href="/login"
            className="btn-gold inline-flex items-center justify-center px-8 py-4 rounded-md"
          >
            Sign your shop up
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-10 text-vodium-cream/50 text-sm flex flex-col md:flex-row justify-between gap-4">
        <p>© 2026 Vodium. Lagos, Nigeria.</p>
        <p>victor@vodium.co</p>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="w-8 h-px bg-vodium-gold mb-4" />
      <h3 className="font-serif text-2xl mb-3">{title}</h3>
      <p className="text-vodium-cream/70 leading-relaxed">{body}</p>
    </div>
  );
}
