"use client";

import { useState, useEffect } from "react";
import { Check, Zap, Rocket, Crown, ArrowRight, Loader2 } from "lucide-react";
import { GlowBadge } from "@/components/ui/glow-badge";

type Plan = "STARTER" | "GROWTH" | "PRO";

interface PlanDetail {
  id: Plan;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ElementType;
  color: string;
}

const PLANS: PlanDetail[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: "₦2,000",
    description: "For small kiosks and new vendors",
    features: [
      "Up to 50 customers",
      "WhatsApp credit logging",
      "Auto-reminders (SMS/WA)",
      "Basic dashboard",
    ],
    icon: Zap,
    color: "text-vodium-cream/60",
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: "₦5,000",
    description: "For established shops and service vendors",
    features: [
      "Up to 200 customers",
      "Vodium Credit Scoring",
      "Bulk repayment reminders",
      "Customer history & analytics",
      "Priority support",
    ],
    icon: Rocket,
    color: "text-vodium-gold",
  },
  {
    id: "PRO",
    name: "Business Pro",
    price: "₦10,000",
    description: "For high-volume vendors & mini-marts",
    features: [
      "Unlimited customers",
      "Advanced risk insights",
      "Export to CSV/Excel",
      "Custom branding in reminders",
      "24/7 dedicated support",
    ],
    icon: Crown,
    color: "text-purple-400",
  },
];

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState<Plan | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/vendor/me")
      .then((r) => r.json())
      .then((data) => setCurrentPlan(data?.subscription?.plan ?? "STARTER"));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    if (!reference) return;

    let cancelled = false;
    setNotice({ type: "info", text: "Confirming your payment with Paystack..." });

    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Payment could not be confirmed");
        if (cancelled) return;
        setCurrentPlan(data.plan);
        setNotice({ type: "success", text: "Payment confirmed. Your plan is now active." });
        window.history.replaceState(null, "", "/dashboard/upgrade");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setNotice({
          type: "error",
          text: err instanceof Error ? err.message : "Payment could not be confirmed yet.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpgrade(plan: Plan) {
    if (plan === currentPlan) return;
    setLoading(plan);
    try {
      const res = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.authorizationUrl;
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="font-serif text-3xl md:text-5xl text-vodium-cream">
          Scale your credit business
        </h1>
        <p className="text-vodium-cream/40 max-w-xl mx-auto text-sm md:text-base">
          Choose the plan that fits your volume. Upgrade or downgrade anytime.
          Every plan starts with a 60-day free trial.
        </p>
      </div>

      {notice && (
        <div
          className={`mx-auto max-w-xl rounded-2xl border px-4 py-3 text-sm text-center ${
            notice.type === "success"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : notice.type === "error"
                ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
                : "border-vodium-gold/25 bg-vodium-gold/10 text-vodium-gold"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const Icon = plan.icon;
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 border transition-all duration-300 ${
                isCurrent
                  ? "bg-vodium-gold/5 border-vodium-gold/30 shadow-[0_0_40px_rgba(201,169,97,0.1)]"
                  : "bg-vodium-charcoal border-white/[0.06] hover:border-white/[0.15]"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <GlowBadge color="gold">Current Plan</GlowBadge>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-white/[0.03] ${plan.color}`}>
                    <Icon size={20} />
                  </div>
                  <h2 className="font-semibold text-vodium-cream">{plan.name}</h2>
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl text-vodium-cream">{plan.price}</span>
                    <span className="text-vodium-cream/30 text-sm">/ month</span>
                  </div>
                  <p className="text-xs text-vodium-cream/40 mt-2">{plan.description}</p>
                </div>

                <div className="space-y-3 pt-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-vodium-cream/60 leading-tight">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || !!loading}
                  className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    isCurrent
                      ? "bg-white/[0.05] text-vodium-cream/30 cursor-default"
                      : plan.id === "PRO"
                      ? "btn-gold"
                      : "bg-white/[0.03] text-vodium-cream hover:bg-white/[0.08] border border-white/[0.08]"
                  }`}
                >
                  {loading === plan.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isCurrent ? (
                    "Active Plan"
                  ) : (
                    <>
                      {plan.id === "STARTER" ? "Select Plan" : "Upgrade Now"}
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-vodium-charcoal/50 border border-white/[0.04] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-3">
          <h3 className="font-serif text-xl text-vodium-cream">Need a custom plan?</h3>
          <p className="text-sm text-vodium-cream/40">
            If you manage multiple shops across different communities, we offer enterprise
            pricing and centralized analytics for your entire operation.
          </p>
        </div>
        <a
          href="mailto:support@vodiumledger.com"
          className="px-8 py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-sm text-vodium-cream hover:bg-white/[0.1] transition-all whitespace-nowrap"
        >
          Contact sales
        </a>
      </div>
    </div>
  );
}
