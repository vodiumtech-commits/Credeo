import Link from "next/link";
import {
  ArrowLeft, MapPin, Briefcase, ArrowRight,
  Heart, Wifi, Shield, Zap, Globe, Users,
} from "lucide-react";
import { AnimatedBorder } from "@/components/ui/animated-border";
import { MagicCard } from "@/components/ui/magic-card";
import { GlowBadge } from "@/components/ui/glow-badge";

export const metadata = {
  title: "Careers — Vodium Ledger",
  description: "Join us in building Africa's credit infrastructure.",
};

interface JobPost {
  title: string;
  location: string;
  type: string;
  description: string;
  mailto: string;
}

const jobs: JobPost[] = [
  {
    title: "Senior Full-Stack Engineer",
    location: "Lagos, Nigeria",
    type: "Full-time",
    description:
      "Own the technical architecture of a platform that will process billions of naira in credit data. Next.js, TypeScript, PostgreSQL, Prisma. You'll build features used by thousands of campus vendors.",
    mailto: "careers@vodium.co?subject=Application: Senior Full-Stack Engineer",
  },
  {
    title: "Growth & Partnerships Manager",
    location: "Lagos, Nigeria",
    type: "Full-time",
    description:
      "Sign Vodium's first 500 paying vendors. Build the playbook. Own the pipeline. Work directly with the CEO on market expansion across Nigerian universities.",
    mailto: "careers@vodium.co?subject=Application: Growth %26 Partnerships Manager",
  },
  {
    title: "Customer Success Lead",
    location: "Lagos / Remote",
    type: "Full-time",
    description:
      "Be the voice of Vodium to vendors and students. Onboard new shops, gather feedback, drive retention. You'll know every pilot vendor by name.",
    mailto: "careers@vodium.co?subject=Application: Customer Success Lead",
  },
  {
    title: "UI/UX Designer",
    location: "Lagos / Remote",
    type: "Contract",
    description:
      "Raise the bar on what a Nigerian fintech product looks like. Own every pixel from WhatsApp message templates to the web dashboard.",
    mailto: "careers@vodium.co?subject=Application: UI/UX Designer",
  },
];

const benefits = [
  { icon: Zap, label: "Competitive salary in NGN + ESOP" },
  { icon: Globe, label: "Remote-first culture" },
  { icon: Wifi, label: "Monthly data allowance" },
  { icon: Heart, label: "Health insurance" },
  { icon: Shield, label: "Direct impact on Africa's credit ecosystem" },
  { icon: Users, label: "Team from Paystack, Google, GTBank" },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-vodium-black text-vodium-cream">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-lg leading-none">V</span>
            </div>
            <span className="font-serif tracking-[0.18em] text-vodium-gold text-sm">VODIUM LEDGER</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-vodium-cream/50 hover:text-vodium-gold transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} /> Home
            </Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 btn-gold px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(201,169,97,0.3)] transition-all">
              Get started <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero */}
        <section className="mesh-bg bg-dots relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 md:px-12 pt-28 pb-24">
            <div className="max-w-3xl">
              <GlowBadge color="gold" className="mb-6">Careers at Vodium</GlowBadge>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-vodium-cream leading-[1.05] mb-6">
                Build Africa&apos;s{" "}
                <span className="text-gradient-gold">financial future.</span>
              </h1>
              <p className="text-vodium-cream/55 text-xl leading-relaxed max-w-2xl">
                We&apos;re a small team with an audacious goal. If you want your work to matter —
                this is it.
              </p>
            </div>
          </div>
          <div className="brand-divider" />
        </section>

        {/* Open Positions */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="mb-12">
            <span className="text-vodium-gold text-xs tracking-[0.3em] uppercase font-semibold block mb-3">
              Open roles
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-vodium-cream">
              {jobs.length} open positions.
            </h2>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <AnimatedBorder key={job.title}>
                <div className="group p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="font-serif text-xl text-vodium-cream group-hover:text-vodium-gold transition-colors duration-200">
                        {job.title}
                      </h3>
                      <span className="text-[10px] font-semibold tracking-[0.15em] px-2.5 py-1 rounded-full bg-vodium-charcoal border border-white/[0.08] text-vodium-cream/50">
                        {job.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-vodium-cream/40">
                      <span className="flex items-center gap-1.5"><MapPin size={11} />{job.location}</span>
                      <span className="flex items-center gap-1.5"><Briefcase size={11} />{job.type}</span>
                    </div>
                    <p className="text-vodium-cream/55 text-sm leading-relaxed max-w-2xl">{job.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <a
                      href={`mailto:${job.mailto}`}
                      className="inline-flex items-center gap-2 btn-gold px-6 py-3 rounded-xl text-sm font-semibold group-hover:gap-3 hover:shadow-[0_0_20px_rgba(201,169,97,0.3)] transition-all duration-200"
                    >
                      Apply now <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </AnimatedBorder>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="border-y border-white/[0.06] bg-vodium-charcoal/30">
          <div className="max-w-6xl mx-auto px-6 md:px-12 py-20">
            <div className="mb-12 text-center">
              <span className="text-vodium-gold text-xs tracking-[0.3em] uppercase font-semibold block mb-3">
                Why Vodium
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-vodium-cream">
                What you get.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map(({ icon: Icon, label }) => (
                <MagicCard key={label} className="rounded-xl">
                  <div className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={16} className="text-vodium-gold" />
                    </div>
                    <span className="text-vodium-cream/70 text-sm font-medium">{label}</span>
                  </div>
                </MagicCard>
              ))}
            </div>
          </div>
        </section>

        {/* Culture note */}
        <section className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-serif text-3xl text-vodium-cream mb-5">
              We&apos;re a startup.{" "}
              <span className="text-gradient-gold">No bureaucracy.</span>
            </h2>
            <p className="text-vodium-cream/55 text-lg leading-relaxed">
              We move fast. You&apos;ll own your work from day one. No long hiring pipelines — if
              you&apos;re good, we move in days.
            </p>
            <div className="brand-divider my-10" />
            <p className="text-vodium-cream/50 text-sm mb-4">Questions? Reach us at</p>
            <a
              href="mailto:careers@vodium.co"
              className="text-vodium-gold hover:text-vodium-gold/80 transition-colors font-medium"
            >
              careers@vodium.co
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 md:px-12 mt-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-vodium-cream/30">
          <span>© 2026 Vodium. Lagos, Nigeria.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-vodium-gold transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-vodium-gold transition-colors">Terms</Link>
            <Link href="/about" className="hover:text-vodium-gold transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
