"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  STARTER:    "Starter",
  GROWTH:     "Growth",
  PRO:        "Business Pro",
};

export function SubscriptionActions({
  currentPlan,
  currentStatus,
}: {
  currentPlan: SubscriptionPlan;
  currentStatus: SubscriptionStatus;
}) {
  const [loading, setLoading] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isExpired = currentStatus === "CANCELLED" || currentStatus === "EXPIRED";
  const isPastDue = currentStatus === "PAST_DUE";

  // If on Business Pro already, no upgrade available
  const upgradePlans: SubscriptionPlan[] =
    currentPlan === "STARTER"
      ? ["GROWTH", "PRO"]
      : currentPlan === "GROWTH"
      ? ["PRO"]
      : [];

  async function handleSubscribe(plan: SubscriptionPlan) {
    if (loading) return;
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      // Redirect to Paystack checkout
      window.location.href = data.authorizationUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not initiate payment");
      setLoading(null);
    }
  }

  if (currentPlan === "PRO" && currentStatus === "ACTIVE") {
    return (
      <p className="text-xs text-vodium-cream/35 text-center py-1">
        You&rsquo;re on the highest plan.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      {error && (
        <p className="text-xs text-rose-400 text-center">{error}</p>
      )}

      {(isPastDue || isExpired) && (
        <button
          onClick={() => handleSubscribe(currentPlan)}
          disabled={!!loading}
          className="btn-gold w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading === currentPlan ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ArrowUpRight size={14} />
          )}
          {loading === currentPlan ? "Redirecting…" : `Renew ${PLAN_LABELS[currentPlan]}`}
        </button>
      )}

      {upgradePlans.map((plan) => (
        <button
          key={plan}
          onClick={() => handleSubscribe(plan)}
          disabled={!!loading}
          className={`w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
            plan === "PRO"
              ? "btn-gold"
              : "border border-white/[0.12] text-vodium-cream hover:border-vodium-gold hover:text-vodium-gold"
          }`}
        >
          {loading === plan ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ArrowUpRight size={14} />
          )}
          {loading === plan ? "Redirecting…" : `Upgrade to ${PLAN_LABELS[plan]}`}
        </button>
      ))}

      <button className="w-full py-2.5 rounded-xl text-sm text-vodium-cream/40 hover:text-vodium-cream/70 transition-colors border border-white/[0.06] hover:border-white/[0.12]">
        Manage billing
      </button>
    </div>
  );
}
