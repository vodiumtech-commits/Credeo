"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, ChevronDown, ExternalLink, Info } from "lucide-react";

type Step = {
  title: string;
  body: React.ReactNode;
  link?: { label: string; href: string };
};

const STEPS: Step[] = [
  {
    title: "Create a Meta Business account",
    body: "Use your business email. If you already run a Facebook Page for your store, you likely have one already.",
    link: { label: "business.facebook.com", href: "https://business.facebook.com/" },
  },
  {
    title: "Add WhatsApp & your phone number",
    body: "In Meta for Developers, create an app (type: Business), add the WhatsApp product, then add and verify your store's phone number. Use a number that is NOT already on the WhatsApp consumer app.",
    link: { label: "Meta WhatsApp — Get started", href: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" },
  },
  {
    title: "Copy your Phone number ID & WABA ID",
    body: "On the WhatsApp → API Setup screen, copy the Phone number ID and the WhatsApp Business Account (WABA) ID. You'll paste these into Vodium below.",
    link: { label: "Open API Setup", href: "https://developers.facebook.com/apps/" },
  },
  {
    title: "Generate a permanent access token",
    body: "Create a System User with the whatsapp_business_messaging permission and generate a permanent token (the 24-hour token expires). Paste it into Vodium — it's stored encrypted, never in plain text.",
    link: { label: "System users settings", href: "https://business.facebook.com/settings/system-users" },
  },
  {
    title: "Paste into Vodium & test",
    body: "Use \"Add channel\" below, paste the display name, phone number, Phone number ID, WABA ID and token, then set the channel Active and press \"Send test\". We connect the webhook for you automatically.",
  },
];

export function WhatsAppSetupGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-black/20 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-vodium-cream">
          <BookOpen size={15} className="text-vodium-gold" /> How to connect your store&apos;s WhatsApp number
        </span>
        <ChevronDown size={16} className={`text-vodium-cream/40 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Reassurance callout */}
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-3 flex items-start gap-2.5">
            <Info size={15} className="text-emerald-300 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              <strong className="text-emerald-200">This is optional.</strong> Your customers&apos; one-time codes (OTP) and
              purchase confirmations are already sent by the <strong>Vodium Ledger bot</strong> — you don&apos;t need to set
              up anything for those. Connect your own number only if you want reminders and chat to come from your store&apos;s
              WhatsApp. We handle the webhook for you.
            </p>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-vodium-gold/10 border border-vodium-gold/25 text-vodium-gold text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-vodium-cream">{step.title}</p>
                  <p className="text-xs text-vodium-cream/50 mt-1 leading-relaxed">{step.body}</p>
                  {step.link && (
                    <a href={step.link.href} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs text-vodium-gold hover:underline">
                      {step.link.label} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-lg bg-black/25 border border-white/[0.05] p-3 flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-vodium-gold mt-0.5 shrink-0" />
            <p className="text-xs text-vodium-cream/55 leading-relaxed">
              Stuck? Send us the store name and we&apos;ll connect the number for you. Setup usually takes under 10 minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
