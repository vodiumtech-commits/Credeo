/**
 * Cookie-based OTP storage — zero external dependencies.
 *
 * The cookie stores only the HMAC of (purpose + email + otp + expiresAt).
 * The raw OTP value is never written to the cookie, so even if the cookie
 * is somehow read, the code cannot be extracted without SESSION_SECRET.
 *
 * Format: "<expiresAtMs>.<hmac_base64url>"
 */

import crypto from "crypto";
import { cookies } from "next/headers";

const PREFIX      = "vodium_otp_";
const TTL_SECONDS = 600; // 10 minutes

function secret(): string {
  return process.env.SESSION_SECRET ?? "dev-only-secret-change-me";
}

function computeHmac(purpose: string, email: string, otp: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`otp:${purpose}:${email}:${otp}:${expiresAt}`)
    .digest("base64url");
}

/** Call in the OTP-send step. Sets a signed httpOnly cookie. */
export function setOtpCookie(purpose: string, email: string, otp: string): void {
  const expiresAt = Date.now() + TTL_SECONDS * 1000;
  const hmac      = computeHmac(purpose, email, otp, expiresAt);

  cookies().set(`${PREFIX}${purpose}`, `${expiresAt}.${hmac}`, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   TTL_SECONDS,
    path:     "/",
  });
}

/**
 * Call in the OTP-verify step.
 * Returns true if the submitted OTP matches the signed cookie and is not expired.
 * Does NOT delete the cookie — call clearOtpCookie() after a successful verify.
 */
export function verifyOtpCookie(purpose: string, email: string, otp: string): boolean {
  const raw = cookies().get(`${PREFIX}${purpose}`)?.value;
  if (!raw) return false;

  try {
    const dot = raw.lastIndexOf(".");
    if (dot === -1) return false;

    const expiresAt = parseInt(raw.slice(0, dot), 10);
    const stored    = raw.slice(dot + 1);

    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const expected = computeHmac(purpose, email, otp, expiresAt);

    // Constant-time compare to prevent timing oracle
    const a = Buffer.from(stored,   "utf8");
    const b = Buffer.from(expected, "utf8");
    const maxLen = Math.max(a.length, b.length);
    const aBuf = Buffer.alloc(maxLen); a.copy(aBuf);
    const bBuf = Buffer.alloc(maxLen); b.copy(bBuf);

    return crypto.timingSafeEqual(aBuf, bBuf) && a.length === b.length;
  } catch {
    return false;
  }
}

/** Delete the OTP cookie after successful verification. */
export function clearOtpCookie(purpose: string): void {
  cookies().set(`${PREFIX}${purpose}`, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });
}
