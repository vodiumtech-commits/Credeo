/**
 * Pure (no-DB) helpers for customer verification codes.
 *
 * Kept separate from customer-verify.ts so that pure contexts — the WhatsApp
 * state machine and unit tests — can sign/verify codes without importing the
 * Prisma client. Codes are never stored raw; only an HMAC of
 * (phone, code, expiry) is persisted, exactly like the storefront OTP cookie.
 */

import crypto from "crypto";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const VERIFICATION_TTL_MS = CODE_TTL_MS;

function secret(): string {
  return process.env.SESSION_SECRET ?? "dev-only-secret-change-me";
}

export function generateVerificationCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

/** HMAC of the challenge — safe to persist; the raw code never is. */
export function signVerification(phone: string, code: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`custverify:${phone}:${code}:${expiresAt}`)
    .digest("base64url");
}

export function verifyVerification(
  phone: string,
  code: string,
  expiresAt: number,
  hmac: string
): boolean {
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expected = signVerification(phone, code, expiresAt);
  const a = Buffer.from(hmac, "utf8");
  const b = Buffer.from(expected, "utf8");
  const maxLen = Math.max(a.length, b.length);
  const aBuf = Buffer.alloc(maxLen); a.copy(aBuf);
  const bBuf = Buffer.alloc(maxLen); b.copy(bBuf);
  return crypto.timingSafeEqual(aBuf, bBuf) && a.length === b.length;
}

/** Mask a phone for display: +2348031234567 → ••• ••• 4567 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `••• ••• ${last4}`;
}
