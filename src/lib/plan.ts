import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

// Maximum unique customers a vendor can have credits with per plan tier.
// null = unlimited
export const PLAN_STUDENT_LIMITS: Record<SubscriptionPlan, number | null> = {
  STARTER:    50,
  GROWTH:     200,
  PRO:        null,
};

export function getStudentLimit(plan: SubscriptionPlan): number | null {
  return PLAN_STUDENT_LIMITS[plan];
}

// Returns true if the vendor is allowed to add more customers.
export function isPlanActive(subscription: {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
} | null): boolean {
  if (!subscription) return true; // Default to allowing if no record (though register creates one)

  const { status, trialEndsAt, currentPeriodEnd } = subscription;
  const now = new Date();

  if (status === "ACTIVE") {
    // If we have an end date, check it. If not, assume active (Paystack handles lifecycle)
    if (currentPeriodEnd && currentPeriodEnd < now) return false;
    return true;
  }

  if (status === "TRIAL") {
    if (trialEndsAt && trialEndsAt < now) return false;
    return true;
  }

  return false;
}

export function planDisplayName(plan: SubscriptionPlan): string {
  return plan === "STARTER" ? "Starter" : plan === "GROWTH" ? "Growth" : "Business Pro";
}
