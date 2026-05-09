import Link from "next/link";
import { ArrowRight, MessageCircle, BarChart3, Shield, Bell, Users, TrendingUp, CheckCircle, ChevronDown } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="bg-vodium-black text-vodium-cream overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-dark border-b border-white/[0.06] px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-lg leading-none">V</span>
            </div>
            <span className="font-serif tracking-[0.18em] text-vodium-gold text-sm">VODIUM LEDGER</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-vodium-cream/60">
            <a href="#how-it-works" className="hover:text-vodium-gold transition-colors">How it works</a>
            <a href="#features"     className="hover:text-vodium-gold transition-colors">Features</a>
            <a href="#pricing"      className="hover:text-vodium-gold transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-vodium-cream/60 hover:text-vodium-gold transition-colors hidden md:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="btn-gold px-5 py-2.5 rounded-lg text-sm"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-4xl">
            <p className="text-vodium-gold text-xs tracking-[0.35em] font-medium mb-6 uppercase">
              Vodium Ledger — Phase 1
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.02] mb-7">
              Africa&rsquo;s credit
              <br />
              <em className="text-vodium-gold not-italic">infrastructure</em>
              <br />
              layer.
            </h1>
            <p className="text-lg md:text-xl text-vodium-cream/65 max-w-2xl leading-relaxed mb-10">
              Track every credit. Recover what you&rsquo;re owed. Know which students pay back
              across every shop on campus. Built for Nigerian vendors — free for 60 days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="btn-gold inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base"
              >
                Start free — 60-day trial <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/2348012345678?text=START"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2 px-7 py-4 rounded-xl text-base"
              >
                <MessageCircle size={18} /> Try on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform stats ticker ──────────────────────────── */}
      <div className="border-y border-white/[0.07] py-7 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat value="127" label="Vendors on platform" />
            <Stat value="₦47M+" label="Total credit tracked" />
            <Stat value="4,832" label="Students with history" />
            <Stat value="73.4%" label="Repayment rate" />
          </div>
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-4">Simple by design</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-16 max-w-xl">
            Set up in 5 minutes.<br />Use for life.
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number="01"
              title="Register your shop"
              body="Tell us your business name, campus, and verify your phone. No paperwork, no bank account needed."
            />
            <Step
              number="02"
              title="Add credits via WhatsApp"
              body="Send a WhatsApp message: ADD. We walk you through it. 15 seconds per transaction."
            />
            <Step
              number="03"
              title="Recover automatically"
              body="Polite reminders go out 2 days before due. Students pay, you mark it. Defaults go down."
            />
          </div>
        </div>
      </section>

      <div className="brand-divider mx-6 md:mx-12" />

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-4">Everything you need</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-16">Built for the vendor.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageCircle size={22} />}
              title="WhatsApp-first"
              body="Every core action — adding credit, marking paid, sending reminders — works from the chat app you already use."
            />
            <FeatureCard
              icon={<Users size={22} />}
              title="Cross-vendor scores"
              body="See a student&rsquo;s repayment history across all campus vendors before you extend credit. Powered by the Vodium graph."
            />
            <FeatureCard
              icon={<Bell size={22} />}
              title="Automatic reminders"
              body="Respectful WhatsApp reminders go out 2 days before due. Students pay, you recover. No chasing needed."
            />
            <FeatureCard
              icon={<BarChart3 size={22} />}
              title="Web dashboard"
              body="See everything at once: who owes, who&rsquo;s paid, what&rsquo;s overdue. Clean, fast, mobile-ready."
            />
            <FeatureCard
              icon={<TrendingUp size={22} />}
              title="Recovery analytics"
              body="Track your monthly credit volume, recovery rate, and top-performing customers. Know your business."
            />
            <FeatureCard
              icon={<Shield size={22} />}
              title="Secure & NDPR-compliant"
              body="Your data is encrypted and isolated. No other vendor can see your customers. Privacy policy backed by legal."
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="bg-vodium-charcoal py-20 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-12 text-center">What vendors say</p>
          <div className="grid md:grid-cols-2 gap-8">
            <Testimonial
              quote="Vodium saved me ₦45,000 last semester. Three students I would have written off paid because of the reminders."
              name="Mama Taiwo"
              role="Provisions vendor, UNILAG — 63 students tracked"
            />
            <Testimonial
              quote="I check every student's Vodium score before I give credit now. One girl had a score of 320 — I said no. Turned out she owed 4 other shops. Game changer."
              name="Baba Wale"
              role="Food Canteen, UNILAG — 89 students tracked"
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-4 text-center">Pricing</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-center">Simple. Honest. Naira.</h2>
          <p className="text-vodium-cream/60 text-center mb-14 max-w-lg mx-auto">
            All plans include 60 days free. No credit card. No hidden fees. Cancel anytime.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              plan="Starter"
              price="₦2,000"
              description="Up to 50 students. Perfect to get started."
              features={[
                "WhatsApp bot access",
                "Credit tracking",
                "Auto-reminders",
                "Web dashboard",
                "Up to 50 students",
              ]}
            />
            <PricingCard
              plan="Growth"
              price="₦5,000"
              description="Up to 200 students + cross-vendor scores."
              popular
              features={[
                "Everything in Starter",
                "Cross-vendor credit scores",
                "Dashboard analytics",
                "Up to 200 students",
                "CSV export",
              ]}
            />
            <PricingCard
              plan="Campus Pro"
              price="₦10,000"
              description="Unlimited students. Full analytics. Priority support."
              features={[
                "Everything in Growth",
                "Unlimited students",
                "Priority WhatsApp support",
                "Monthly report PDF",
                "API access (beta)",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="bg-vodium-charcoal py-20 px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-4">Common questions</p>
          <h2 className="font-serif text-3xl md:text-4xl mb-12">FAQ</h2>
          <div className="space-y-1">
            <FaqItem
              q="How does the WhatsApp bot work?"
              a="Your shop&rsquo;s WhatsApp number is registered in our system. Send ADD to record a credit, PAID to close it, LIST to see who owes. That&rsquo;s it. No app to download."
            />
            <FaqItem
              q="Do students know they&rsquo;re being tracked?"
              a="Yes, always. Students receive a WhatsApp message when a credit is recorded, when a reminder is sent, and when their score changes. Transparency is part of the Vodium promise."
            />
            <FaqItem
              q="Is my data secure?"
              a="All data is encrypted in transit and at rest. Your customers are isolated from other vendors — nobody else can see your book. We comply with Nigeria&rsquo;s NDPR data protection regulations."
            />
            <FaqItem
              q="What happens after my 60-day free trial?"
              a="You choose a plan that fits your book. If you have fewer than 50 students, Starter at ₦2,000/month works. Most vendors on multiple campuses go Growth or Campus Pro. You can cancel any time."
            />
            <FaqItem
              q="Can multiple people use the same shop account?"
              a="Not in v1. One phone number, one account. Multi-user shop access is coming in the next update — tell us if it&rsquo;s blocking you and we&rsquo;ll prioritize it."
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-6">Join 127 vendors</p>
          <h2 className="font-serif text-4xl md:text-6xl mb-6 leading-tight">
            Built for the vendor.<br />
            <em className="text-vodium-gold not-italic">Owned by Africa.</em>
          </h2>
          <p className="text-vodium-cream/60 mb-10 text-lg">
            Vodium Ledger is Phase 1 of Africa&rsquo;s premium credit ecosystem. Every credit you track becomes part of something bigger.
          </p>
          <Link
            href="/register"
            className="btn-gold inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base"
          >
            Sign your shop up — free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.07] py-12 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
                  <span className="font-serif text-vodium-gold text-sm">V</span>
                </div>
                <span className="font-serif tracking-[0.15em] text-vodium-gold text-xs">VODIUM</span>
              </div>
              <p className="text-vodium-cream/40 text-sm leading-relaxed">
                Africa&rsquo;s credit infrastructure layer. Starting with university campus vendors.
              </p>
            </div>
            <FooterLinks
              title="Product"
              links={[
                { label: "How it works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
                { label: "Pricing", href: "#pricing" },
                { label: "WhatsApp bot", href: "#" },
              ]}
            />
            <FooterLinks
              title="Company"
              links={[
                { label: "About Vodium", href: "#" },
                { label: "The team", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Careers", href: "#" },
              ]}
            />
            <FooterLinks
              title="Legal"
              links={[
                { label: "Privacy policy", href: "#" },
                { label: "Terms of service", href: "#" },
                { label: "NDPR compliance", href: "#" },
              ]}
            />
          </div>
          <div className="brand-divider mb-8" />
          <div className="flex flex-col md:flex-row justify-between gap-4 text-vodium-cream/35 text-xs">
            <p>© 2026 Vodium. Lagos, Nigeria. Proprietary — all rights reserved.</p>
            <p>victor@vodium.co</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-3xl md:text-4xl text-vodium-gold mb-1">{value}</p>
      <p className="text-vodium-cream/50 text-sm">{label}</p>
    </div>
  );
}

function Step({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="relative">
      <p className="font-serif text-6xl text-vodium-gold/20 mb-4 leading-none">{number}</p>
      <h3 className="font-serif text-2xl mb-3">{title}</h3>
      <p className="text-vodium-cream/60 leading-relaxed">{body}</p>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card-dark-hover p-7 group">
      <div className="w-10 h-10 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center text-vodium-gold mb-5 group-hover:bg-vodium-gold/15 transition-colors">
        {icon}
      </div>
      <h3 className="font-serif text-xl mb-3">{title}</h3>
      <p className="text-vodium-cream/55 leading-relaxed text-sm">{body}</p>
    </div>
  );
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <div className="border border-vodium-gold/12 rounded-2xl p-8">
      <div className="flex gap-1 mb-5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-vodium-gold text-sm">★</span>
        ))}
      </div>
      <p className="text-vodium-cream/80 leading-relaxed mb-6 text-base italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div>
        <p className="font-medium text-vodium-cream text-sm">{name}</p>
        <p className="text-vodium-cream/45 text-xs mt-0.5">{role}</p>
      </div>
    </div>
  );
}

function PricingCard({
  plan,
  price,
  description,
  features,
  popular,
}: {
  plan: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-7 flex flex-col ${popular ? "bg-vodium-charcoal border-2 border-vodium-gold" : "border border-white/[0.08] bg-vodium-charcoal/60"}`}>
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-vodium-gold text-vodium-black text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
            MOST POPULAR
          </span>
        </div>
      )}
      <p className="text-vodium-cream/50 text-sm font-medium mb-3">{plan}</p>
      <p className="font-serif text-4xl text-vodium-cream mb-1">{price}</p>
      <p className="text-xs text-vodium-cream/40 mb-4">/month after trial</p>
      <p className="text-vodium-cream/65 text-sm mb-7 leading-relaxed">{description}</p>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-vodium-cream/75">
            <CheckCircle size={15} className="text-vodium-gold flex-shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`w-full py-3.5 rounded-xl text-sm font-semibold text-center transition-all ${popular ? "btn-gold" : "border border-white/15 text-vodium-cream hover:border-vodium-gold hover:text-vodium-gold"}`}
      >
        Start free trial
      </Link>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-white/[0.06] rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer text-base font-medium text-vodium-cream hover:text-vodium-gold transition-colors list-none">
        {q}
        <ChevronDown size={18} className="flex-shrink-0 text-vodium-cream/40 group-open:rotate-180 transition-transform duration-200" />
      </summary>
      <div className="px-6 pb-5 text-vodium-cream/60 text-sm leading-relaxed border-t border-white/[0.06]">
        <div className="pt-4">{a}</div>
      </div>
    </details>
  );
}

function FooterLinks({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-vodium-cream text-xs font-semibold tracking-widest uppercase mb-4">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-vodium-cream/40 hover:text-vodium-gold text-sm transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
