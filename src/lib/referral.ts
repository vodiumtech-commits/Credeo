/**
 * Campus-ambassador referral attribution (pure — no DB, so the state machine
 * and unit tests can use it freely).
 *
 * A vendor who arrives via /r/<code> carries this cookie until they register;
 * registration stamps the vendor with the ambassador, permanently. Attribution
 * is deliberately best-effort: a missing or stale code must never block a
 * vendor from signing up.
 */

export const REFERRAL_COOKIE = "vodium_ref";
export const REFERRAL_COOKIE_AGE = 60 * 60 * 24 * 30; // 30 days

/** Ambassador codes are short, uppercase and URL-safe: /r/TUNDE */
export const AMBASSADOR_CODE_RE = /^[A-Z0-9][A-Z0-9-]{2,15}$/;

/** Returns the canonical code, or null when it could never be a valid one. */
export function normaliseAmbassadorCode(input: string | undefined | null): string | null {
  if (!input) return null;
  const code = input.trim().toUpperCase();
  return AMBASSADOR_CODE_RE.test(code) ? code : null;
}
