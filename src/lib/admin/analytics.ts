/**
 * Platform analytics — credit-logging and repayment *behaviour*, not just totals.
 *
 * Every query is read-only and scoped to a rolling window so the dashboard stays
 * cheap as the ledger grows. Repayment timing is measured against each credit's
 * own due date, so an hour-long credit and a term-long credit are judged fairly.
 */

import { prisma } from "@/lib/prisma";

export interface MonthPoint { month: string; extended: number; recovered: number }
export interface OnTimePoint { month: string; onTimeRate: number; settled: number }
export interface TimingBucket { bucket: string; count: number }
export interface HourCell { day: string; hour: number; count: number }
export interface VendorRow { name: string; community: string; credits: number; recovered: number; recoveryRate: number }
export interface SizeBucket { bucket: string; count: number }

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getAnalytics() {
  const [
    creditTotals, repaidTotals, activeSubs,
    totalCredits, paidCredits, writtenOff, partial, overdue, outstanding,
    totalVendors, totalCustomers,
    monthly, onTime, timing, logHours, topVendors, sizeBuckets,
    scoreDist, repeatCustomers, vendorActivity,
  ] = await Promise.all([
    prisma.credit.aggregate({ _sum: { amount: true }, _avg: { amount: true } }),
    prisma.repayment.aggregate({ _sum: { amount: true } }),
    prisma.vendorSubscription.findMany({ where: { status: "ACTIVE" }, select: { monthlyAmount: true } }),

    prisma.credit.count(),
    prisma.credit.count({ where: { status: "PAID" } }),
    prisma.credit.count({ where: { status: "WRITTEN_OFF" } }),
    prisma.credit.count({ where: { status: "PARTIALLY_PAID" } }),
    prisma.credit.count({ where: { status: "OVERDUE" } }),
    prisma.credit.count({ where: { status: { in: ["OUTSTANDING", "DUE_SOON"] } } }),

    prisma.vendor.count(),
    prisma.student.count(),

    // ── Volume: money extended vs money actually recovered, by month ──────────
    prisma.$queryRaw<Array<{ month: string; extended: number; recovered: number; credits: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', c."createdAt"), 'Mon') AS month,
        COALESCE(SUM(c.amount), 0)::float                  AS extended,
        COALESCE(SUM(c."amountRepaid"), 0)::float          AS recovered,
        COUNT(*)::int                                      AS credits
      FROM "Credit" c
      WHERE c."createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', c."createdAt")
      ORDER BY DATE_TRUNC('month', c."createdAt") ASC
    `,

    // ── Repayment discipline: share of settled credits closed by the due date ─
    prisma.$queryRaw<Array<{ month: string; on_time: number; settled: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', c."closedAt"), 'Mon')                        AS month,
        COUNT(*) FILTER (WHERE c."closedAt" <= c."dueDate")::int                 AS on_time,
        COUNT(*)::int                                                            AS settled
      FROM "Credit" c
      WHERE c."closedAt" IS NOT NULL
        AND c."closedAt" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', c."closedAt")
      ORDER BY DATE_TRUNC('month', c."closedAt") ASC
    `,

    // ── How late, when they do pay (against each credit's own due date) ───────
    prisma.$queryRaw<Array<{ bucket: string; count: bigint }>>`
      SELECT bucket, COUNT(*) AS count FROM (
        SELECT CASE
          WHEN c."closedAt" <= c."dueDate"                                    THEN 'On time or early'
          WHEN c."closedAt" <= c."dueDate" + INTERVAL '3 days'                THEN '1–3 days late'
          WHEN c."closedAt" <= c."dueDate" + INTERVAL '7 days'                THEN '4–7 days late'
          WHEN c."closedAt" <= c."dueDate" + INTERVAL '30 days'               THEN '8–30 days late'
          ELSE 'Over 30 days late'
        END AS bucket
        FROM "Credit" c
        WHERE c."closedAt" IS NOT NULL AND c.status = 'PAID'
      ) t
      GROUP BY bucket
    `,

    // ── When vendors actually log credit (day of week × hour, last 90 days) ───
    prisma.$queryRaw<Array<{ dow: number; hour: number; count: bigint }>>`
      SELECT
        EXTRACT(DOW  FROM c."createdAt")::int AS dow,
        EXTRACT(HOUR FROM c."createdAt")::int AS hour,
        COUNT(*)                              AS count
      FROM "Credit" c
      WHERE c."createdAt" >= NOW() - INTERVAL '90 days'
      GROUP BY 1, 2
    `,

    // ── Vendor leaderboard, ranked by recovery not just volume ───────────────
    prisma.$queryRaw<Array<{ name: string; community: string; credits: bigint; extended: number; recovered: number }>>`
      SELECT
        v."businessName"                              AS name,
        COALESCE(cm."shortName", cm.name, '—')        AS community,
        COUNT(c.id)                                   AS credits,
        COALESCE(SUM(c.amount), 0)::float             AS extended,
        COALESCE(SUM(c."amountRepaid"), 0)::float     AS recovered
      FROM "Vendor" v
      JOIN "Credit" c    ON c."vendorId" = v.id
      LEFT JOIN "Community" cm ON cm.id = v."communityId"
      GROUP BY v.id, v."businessName", cm."shortName", cm.name
      ORDER BY COUNT(c.id) DESC
      LIMIT 6
    `,

    // ── Typical credit size — where the book's risk actually sits ────────────
    prisma.$queryRaw<Array<{ bucket: string; count: bigint }>>`
      SELECT bucket, COUNT(*) AS count FROM (
        SELECT CASE
          WHEN amount <   1000 THEN 'Under ₦1k'
          WHEN amount <   5000 THEN '₦1k–5k'
          WHEN amount <  20000 THEN '₦5k–20k'
          WHEN amount < 100000 THEN '₦20k–100k'
          ELSE '₦100k+'
        END AS bucket
        FROM "Credit"
      ) t
      GROUP BY bucket
    `,

    prisma.$queryRaw<Array<{ tier: string; count: bigint }>>`
      SELECT CASE
        WHEN "vodiumScore" >= 750 THEN 'excellent'
        WHEN "vodiumScore" >= 650 THEN 'good'
        WHEN "vodiumScore" >= 450 THEN 'fair'
        ELSE 'poor'
      END AS tier, COUNT(*) AS count
      FROM "Student" GROUP BY 1
    `,

    // ── Do customers come back? Repeat borrowing is the retention signal ──────
    prisma.$queryRaw<Array<{ bucket: string; count: bigint }>>`
      SELECT bucket, COUNT(*) AS count FROM (
        SELECT CASE
          WHEN COUNT(c.id) = 1 THEN '1 credit'
          WHEN COUNT(c.id) <= 3 THEN '2–3 credits'
          WHEN COUNT(c.id) <= 9 THEN '4–9 credits'
          ELSE '10+ credits'
        END AS bucket
        FROM "Student" s JOIN "Credit" c ON c."studentId" = s.id
        GROUP BY s.id
      ) t GROUP BY bucket
    `,

    // ── Vendor engagement: the churn predictor (credits logged this week) ─────
    prisma.$queryRaw<Array<{ active_7d: bigint; active_30d: bigint; ever: bigint }>>`
      SELECT
        COUNT(DISTINCT c."vendorId") FILTER (WHERE c."createdAt" >= NOW() - INTERVAL '7 days')  AS active_7d,
        COUNT(DISTINCT c."vendorId") FILTER (WHERE c."createdAt" >= NOW() - INTERVAL '30 days') AS active_30d,
        COUNT(DISTINCT c."vendorId")                                                            AS ever
      FROM "Credit" c
    `,
  ]);

  const num = (v: bigint | number | null | undefined) => Number(v ?? 0);

  const mrr = activeSubs.reduce((s, x) => s + Number(x.monthlyAmount), 0);
  const totalTracked = Number(creditTotals._sum.amount ?? 0);
  const totalRecovered = Number(repaidTotals._sum.amount ?? 0);
  const avgCredit = Number(creditTotals._avg.amount ?? 0);

  // Repayment timing, kept in narrative order (best → worst).
  const TIMING_ORDER = ["On time or early", "1–3 days late", "4–7 days late", "8–30 days late", "Over 30 days late"];
  const timingBuckets: TimingBucket[] = TIMING_ORDER.map((bucket) => ({
    bucket,
    count: num(timing.find((t) => t.bucket === bucket)?.count),
  }));
  const settledTotal = timingBuckets.reduce((s, b) => s + b.count, 0);
  const onTimeShare = settledTotal ? Math.round((timingBuckets[0].count / settledTotal) * 100) : 0;

  const hourCells: Record<string, number> = {};
  for (const r of logHours) hourCells[`${DAY_LABELS[r.dow]}-${r.hour}`] = num(r.count);

  const activity = vendorActivity[0] ?? { active_7d: 0n, active_30d: 0n, ever: 0n };

  return {
    headline: {
      mrr, arr: mrr * 12, totalTracked, totalRecovered, avgCredit,
      totalCredits, totalVendors, totalCustomers,
      outstandingValue: Math.max(totalTracked - totalRecovered, 0),
      recoveryRate: totalTracked > 0 ? Math.round((totalRecovered / totalTracked) * 100) : 0,
      repaymentRate: totalCredits > 0 ? Math.round((paidCredits / totalCredits) * 100) : 0,
      defaultRate: totalCredits > 0 ? Math.round((writtenOff / totalCredits) * 100) : 0,
      onTimeShare,
      activeVendors7d: num(activity.active_7d),
      activeVendors30d: num(activity.active_30d),
      vendorsEverLogged: num(activity.ever),
    },
    health: { paidCredits, partial, overdue, writtenOff, outstanding, totalCredits },
    monthly: monthly.map((m) => ({ month: m.month, extended: m.extended, recovered: m.recovered, credits: m.credits })),
    onTime: onTime.map((r) => ({
      month: r.month,
      settled: r.settled,
      onTimeRate: r.settled > 0 ? Math.round((r.on_time / r.settled) * 100) : 0,
    })) as OnTimePoint[],
    timingBuckets,
    settledTotal,
    hourCells,
    days: DAY_LABELS,
    topVendors: topVendors.map((v) => ({
      name: v.name,
      community: v.community,
      credits: num(v.credits),
      recovered: v.recovered,
      recoveryRate: v.extended > 0 ? Math.round((v.recovered / v.extended) * 100) : 0,
    })) as VendorRow[],
    sizeBuckets: ["Under ₦1k", "₦1k–5k", "₦5k–20k", "₦20k–100k", "₦100k+"].map((bucket) => ({
      bucket,
      count: num(sizeBuckets.find((b) => b.bucket === bucket)?.count),
    })) as SizeBucket[],
    scoreDist: (["excellent", "good", "fair", "poor"] as const).map((tier) => ({
      tier,
      count: num(scoreDist.find((r) => r.tier === tier)?.count),
    })),
    repeatCustomers: ["1 credit", "2–3 credits", "4–9 credits", "10+ credits"].map((bucket) => ({
      bucket,
      count: num(repeatCustomers.find((r) => r.bucket === bucket)?.count),
    })),
  };
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>;
