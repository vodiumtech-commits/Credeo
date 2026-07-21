/**
 * Finance analytics — subscription revenue, conversion and risk.
 *
 * HONESTY NOTE on MRR history: a subscription row stores only its CURRENT
 * status, so a true historical MRR series (which would need to know who was
 * active in March) is not reconstructable from this schema. What IS derivable
 * is new MRR by the month each still-active vendor started, plus its running
 * total. Both are labelled as such rather than dressed up as "MRR over time".
 * A real series needs a subscription-events table — see the note in the UI.
 */

import { prisma } from "@/lib/prisma";

export const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter ₦2k",
  GROWTH:  "Growth ₦5k",
  PRO:     "Business Pro ₦10k",
};

export interface MrrPoint { month: string; newMrr: number; cumulative: number; started: number }
export interface CohortRow { month: string; joined: number; converted: number; stillTrial: number; lost: number; rate: number }

export async function getFinance() {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [subs, newMrrByMonth, cohorts, churnedThisMonth, newTrialsThisMonth, expiringTrials, renewals] =
    await Promise.all([
      prisma.vendorSubscription.findMany({
        include: { vendor: { select: { businessName: true, ownerName: true, phone: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
      }),

      // New recurring revenue by the month each STILL-ACTIVE vendor started.
      prisma.$queryRaw<Array<{ month: string; mrr: number; started: number }>>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', vs."createdAt"), 'Mon')  AS month,
          COALESCE(SUM(vs."monthlyAmount"), 0)::float          AS mrr,
          COUNT(*)::int                                        AS started
        FROM "VendorSubscription" vs
        WHERE vs.status = 'ACTIVE'
          AND vs."createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', vs."createdAt")
        ORDER BY DATE_TRUNC('month', vs."createdAt") ASC
      `,

      // Trial → paid conversion, by signup month. The number that decides
      // whether the free trial is doing its job.
      prisma.$queryRaw<Array<{ month: string; joined: number; converted: number; still_trial: number; lost: number }>>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', vs."createdAt"), 'Mon')                              AS month,
          COUNT(*)::int                                                                    AS joined,
          COUNT(*) FILTER (WHERE vs.status = 'ACTIVE')::int                                AS converted,
          COUNT(*) FILTER (WHERE vs.status = 'TRIAL')::int                                 AS still_trial,
          COUNT(*) FILTER (WHERE vs.status IN ('CANCELLED','EXPIRED','PAST_DUE'))::int     AS lost
        FROM "VendorSubscription" vs
        WHERE vs."createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', vs."createdAt")
        ORDER BY DATE_TRUNC('month', vs."createdAt") ASC
      `,

      prisma.vendorSubscription.count({
        where: { status: { in: ["CANCELLED", "EXPIRED"] }, updatedAt: { gte: monthAgo } },
      }),
      prisma.vendorSubscription.count({ where: { status: "TRIAL", createdAt: { gte: monthAgo } } }),

      // Actionable: trials about to lapse — each one is revenue to save this week.
      prisma.vendorSubscription.findMany({
        where: { status: "TRIAL", trialEndsAt: { gte: now, lte: in7Days } },
        include: { vendor: { select: { businessName: true, ownerName: true, phone: true } } },
        orderBy: { trialEndsAt: "asc" },
        take: 20,
      }),

      // Paying vendors whose period ends within 7 days.
      prisma.vendorSubscription.count({
        where: { status: "ACTIVE", currentPeriodEnd: { gte: now, lte: in7Days } },
      }),
    ]);

  const activeSubs  = subs.filter((s) => s.status === "ACTIVE");
  const trialSubs   = subs.filter((s) => s.status === "TRIAL");
  const pastDueSubs = subs.filter((s) => s.status === "PAST_DUE");
  const cancelled   = subs.filter((s) => s.status === "CANCELLED").length;
  const expired     = subs.filter((s) => s.status === "EXPIRED").length;

  const mrr = activeSubs.reduce((s, x) => s + Number(x.monthlyAmount), 0);
  const revenueAtRisk = pastDueSubs.reduce((s, x) => s + Number(x.monthlyAmount), 0);
  const trialMrrPotential = trialSubs.reduce((s, x) => s + Number(x.monthlyAmount), 0);

  // Running total of new MRR — the honest "how it accumulated" line.
  let running = 0;
  const mrrSeries: MrrPoint[] = newMrrByMonth.map((m) => {
    running += m.mrr;
    return { month: m.month, newMrr: m.mrr, cumulative: running, started: m.started };
  });

  const cohortRows: CohortRow[] = cohorts.map((c) => ({
    month: c.month,
    joined: c.joined,
    converted: c.converted,
    stillTrial: c.still_trial,
    lost: c.lost,
    rate: c.joined > 0 ? Math.round((c.converted / c.joined) * 100) : 0,
  }));

  const decided = cohortRows.reduce((s, c) => s + c.converted + c.lost, 0);
  const convertedAll = cohortRows.reduce((s, c) => s + c.converted, 0);

  const planMix = (["STARTER", "GROWTH", "PRO"] as const).map((plan) => {
    const rows = subs.filter((s) => s.plan === plan);
    const active = rows.filter((s) => s.status === "ACTIVE");
    return {
      plan,
      label: PLAN_LABELS[plan],
      active: active.length,
      trial: rows.filter((s) => s.status === "TRIAL").length,
      total: rows.length,
      contribution: active.reduce((s, x) => s + Number(x.monthlyAmount), 0),
    };
  });

  return {
    kpi: {
      mrr,
      arr: mrr * 12,
      arpu: activeSubs.length ? Math.round(mrr / activeSubs.length) : 0,
      activeCount: activeSubs.length,
      trialCount: trialSubs.length,
      pastDueCount: pastDueSubs.length,
      revenueAtRisk,
      trialMrrPotential,
      churnedThisMonth,
      newTrialsThisMonth,
      renewalsDue7d: renewals,
      cancelled,
      expired,
      totalSubs: subs.length,
      // Conversion across every cohort whose outcome is already DECIDED. The
      // denominator ships alongside it: "100%" off a single decided vendor is
      // noise, and a rate without its sample size invites a bad call.
      conversionRate: decided > 0 ? Math.round((convertedAll / decided) * 100) : 0,
      conversionDecided: decided,
      conversionConverted: convertedAll,
      churnRate: activeSubs.length + churnedThisMonth > 0
        ? Math.round((churnedThisMonth / (activeSubs.length + churnedThisMonth)) * 100)
        : 0,
    },
    mrrSeries,
    cohortRows,
    planMix,
    statusMix: [
      { label: "Active (paying)", count: activeSubs.length },
      { label: "On trial",        count: trialSubs.length },
      { label: "Past due",        count: pastDueSubs.length },
      { label: "Cancelled",       count: cancelled },
      { label: "Expired",         count: expired },
    ],
    expiringTrials: expiringTrials.map((t) => ({
      id: t.id,
      businessName: t.vendor.businessName,
      ownerName: t.vendor.ownerName,
      phone: t.vendor.phone,
      plan: PLAN_LABELS[t.plan] ?? t.plan,
      monthlyAmount: Number(t.monthlyAmount),
      trialEndsAt: t.trialEndsAt ? t.trialEndsAt.toISOString() : null,
      daysLeft: t.trialEndsAt
        ? Math.max(0, Math.ceil((t.trialEndsAt.getTime() - now.getTime()) / 86_400_000))
        : null,
    })),
    subscriptions: subs.map((s) => ({
      id: s.id,
      businessName: s.vendor.businessName,
      ownerName: s.vendor.ownerName,
      plan: PLAN_LABELS[s.plan] ?? s.plan,
      status: s.status,
      monthlyAmount: Number(s.monthlyAmount),
      createdAt: s.createdAt.toISOString(),
    })),
  };
}

export type FinanceData = Awaited<ReturnType<typeof getFinance>>;
