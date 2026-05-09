/**
 * Vodium Credit Score — v1 (rule-based).
 *
 * Score range: 0–1000. Baseline new student: 500.
 *
 * Inputs: a student's CreditScoreEvent history.
 * Output: integer score + a short human-readable summary.
 *
 * Migrate to ML once we have ≥5,000 students with ≥3 credits each.
 */

import type { CreditScoreEvent, ScoreEventType } from "@prisma/client";

const BASELINE = 500;

const WEIGHTS: Record<ScoreEventType, number> = {
  CREDIT_EXTENDED: 0,        // neutral — being trusted is not a signal alone
  PAID_ON_TIME: +25,
  PAID_PARTIAL: +5,
  PAID_LATE: -15,
  DEFAULTED: -80,
  WRITTEN_OFF: -120,
};

export interface ScoreResult {
  score: number;       // 0–1000
  totalEvents: number;
  paidOnTime: number;
  late: number;
  defaulted: number;
  summary: string;
}

export function computeScore(events: CreditScoreEvent[]): ScoreResult {
  let score = BASELINE;
  let paidOnTime = 0;
  let late = 0;
  let defaulted = 0;

  // Recent events weigh more — apply a soft decay.
  events.forEach((ev, idx) => {
    const recencyMultiplier = Math.min(1, 0.5 + idx / events.length);
    score += WEIGHTS[ev.eventType] * recencyMultiplier;
    if (ev.eventType === "PAID_ON_TIME") paidOnTime++;
    if (ev.eventType === "PAID_LATE") late++;
    if (ev.eventType === "DEFAULTED" || ev.eventType === "WRITTEN_OFF") defaulted++;
  });

  // Volume bonus: vendors trusting them repeatedly is a positive signal.
  const totalCredits = events.filter((e) => e.eventType === "CREDIT_EXTENDED").length;
  if (totalCredits >= 10) score += 30;
  else if (totalCredits >= 5) score += 15;

  // Clamp.
  score = Math.max(0, Math.min(1000, Math.round(score)));

  return {
    score,
    totalEvents: events.length,
    paidOnTime,
    late,
    defaulted,
    summary: buildSummary({ score, paidOnTime, late, defaulted, totalCredits }),
  };
}

function buildSummary({
  score,
  paidOnTime,
  late,
  defaulted,
  totalCredits,
}: {
  score: number;
  paidOnTime: number;
  late: number;
  defaulted: number;
  totalCredits: number;
}): string {
  if (totalCredits === 0) {
    return "New student, no credit history yet.";
  }
  const tier =
    score >= 750 ? "Excellent"
    : score >= 650 ? "Good"
    : score >= 500 ? "Building"
    : score >= 350 ? "Risky"
    : "High risk";

  return (
    `${tier}. ${paidOnTime} paid on time, ${late} late` +
    (defaulted ? `, ${defaulted} default${defaulted === 1 ? "" : "s"}` : "") +
    ` across ${totalCredits} credit${totalCredits === 1 ? "" : "s"}.`
  );
}
