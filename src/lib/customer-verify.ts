/**
 * Vodium Ledger — customer identity verification + cross-vendor score preview.
 *
 * A customer is identified by their unique WhatsApp number and shared across
 * every vendor. When a NEW shop tries to log credit against a number that
 * already belongs to a customer, we send a code to that customer's own
 * WhatsApp and only attach the credit once the vendor enters it — this proves
 * the number's owner is present and consents, without leaking who they are.
 *
 * Codes are never stored raw: we keep only an HMAC of (phone, code, expiry),
 * exactly like the storefront OTP cookie, so the bot can hold the challenge in
 * its session context and the web can hold it in a signed cookie.
 */

import { prisma } from "@/lib/prisma";
import { normalisePhone } from "@/lib/utils";
import { computeScore } from "@/lib/credit-score/score";
import { sendOtpCode } from "@/lib/otp-delivery";
import {
  generateVerificationCode,
  signVerification,
  VERIFICATION_TTL_MS,
} from "@/lib/customer-verify-token";

// Re-export the pure helpers so existing callers can import them from here.
export {
  generateVerificationCode,
  signVerification,
  verifyVerification,
  maskPhone,
} from "@/lib/customer-verify-token";

/** True when this vendor has already logged at least one credit for this customer. */
export async function vendorKnowsCustomer(vendorId: string, studentId: string): Promise<boolean> {
  const prior = await prisma.credit.findFirst({
    where: { vendorId, studentId },
    select: { id: true },
  });
  return Boolean(prior);
}

/**
 * Send a verification code to the customer's own WhatsApp number.
 * Returns the signed challenge to persist (never the raw code, except in debug).
 */
export async function sendCustomerVerification(input: {
  phone: string;
  storeName: string;
}): Promise<{ hmac: string; expiresAt: number; channel: string; debugCode?: string }> {
  const code = generateVerificationCode();
  const expiresAt = Date.now() + VERIFICATION_TTL_MS;
  const hmac = signVerification(input.phone, code, expiresAt);

  const { channel } = await sendOtpCode({ phone: input.phone, code, storeName: input.storeName });

  const debugCode = process.env.OTP_DEBUG_RETURN === "true" ? code : undefined;
  return { hmac, expiresAt, channel, debugCode };
}

// ─── Cross-vendor score preview ────────────────────────────────────────────────

export type ScoreTone = "good" | "building" | "bad" | "new";

export interface ScorePreview {
  found: boolean;
  studentId?: string;
  fullName?: string;
  score: number;
  band: string;
  tone: ScoreTone;
  vendorCount: number;   // how many distinct shops have extended this customer credit
  creditCount: number;
  summary: string;
  /** One-line, emoji-led warning/reassurance suitable for the bot and web banners. */
  warning: string;
}

function bandFor(score: number): { band: string; tone: ScoreTone } {
  if (score >= 750) return { band: "Excellent", tone: "good" };
  if (score >= 650) return { band: "Good", tone: "good" };
  if (score >= 500) return { band: "Building", tone: "building" };
  if (score >= 350) return { band: "Risky", tone: "bad" };
  return { band: "High risk", tone: "bad" };
}

/**
 * Look up a customer's GENERAL (cross-vendor) reliability by phone, or by name
 * as a fallback. Returns null only when neither identifier is usable.
 */
export async function getCustomerScorePreview(input: {
  phone?: string | null;
  name?: string | null;
}): Promise<ScorePreview | null> {
  const phone = input.phone ? normalisePhone(input.phone) : null;
  const name = input.name?.trim();

  let student = null as Awaited<ReturnType<typeof findByPhone>> | null;
  if (phone) student = await findByPhone(phone);
  if (!student && name && name.length >= 2) student = await findByName(name);

  if (!student) {
    if (!phone && !name) return null;
    // Identifier given but no record yet — brand-new customer.
    return {
      found: false,
      score: 500,
      band: "New",
      tone: "new",
      vendorCount: 0,
      creditCount: 0,
      summary: "No credit history yet across Vodium.",
      warning: "🆕 New to Vodium — no credit history yet, so there's no score signal.",
    };
  }

  const { score, summary } = computeScore(student.scoreEvents);
  const { band, tone } = student.scoreEvents.length ? bandFor(score) : { band: "New", tone: "new" as ScoreTone };
  const vendorCount = new Set(student.scoreEvents.map((e) => e.vendorId)).size;
  const creditCount = student.scoreEvents.filter((e) => e.eventType === "CREDIT_EXTENDED").length;

  const acrossShops = vendorCount > 1 ? ` across ${vendorCount} shops` : "";
  const warning =
    tone === "new"
      ? "🆕 New to Vodium — no credit history yet, so there's no score signal."
      : tone === "good"
        ? `✅ Trusted customer — Vodium score ${score}/1000 (${band})${acrossShops}. ${summary}`
        : tone === "building"
          ? `🟡 Building history — Vodium score ${score}/1000${acrossShops}. ${summary}`
          : `⚠️ Be careful — Vodium score ${score}/1000 (${band})${acrossShops}. ${summary} Consider a smaller amount or part-payment upfront.`;

  return {
    found: true,
    studentId: student.id,
    fullName: student.fullName,
    score,
    band,
    tone,
    vendorCount,
    creditCount,
    summary,
    warning,
  };
}

function findByPhone(phone: string) {
  return prisma.student.findUnique({
    where: { phone },
    include: { scoreEvents: { orderBy: { occurredAt: "asc" } } },
  });
}

function findByName(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return prisma.student.findFirst({
    where: {
      OR: words.map((w) => ({ fullName: { contains: w, mode: "insensitive" as const } })),
      NOT: { phone: { startsWith: "pending:" } },
    },
    include: { scoreEvents: { orderBy: { occurredAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}
