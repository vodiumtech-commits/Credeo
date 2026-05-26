import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

// Maximum unique students a vendor can have credits with per plan tier.
// null = unlimited
export const PLAN_STUDENT_LIMITS: Record<SubscriptionPlan, number | null> = {
  STARTER:    50,
  GROWTH:     200,
  CAMPUS_PRO: null,
};

export function getStudentLimit(plan: SubscriptionPlan): number | null {
  return PLAN_STUDENT_LIMITS[plan];
}

// Returns true if the vendor is allowed to add more students.
export function isPlanActive(status: SubscriptionStatus): boolean {
  return status === "TRIAL" || status === "ACTIVE";
}

export function planDisplayName(plan: SubscriptionPlan): string {
  return plan === "STARTER" ? "Starter" : plan === "GROWTH" ? "Growth" : "Campus Pro";
}
