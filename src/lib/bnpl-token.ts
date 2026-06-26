/**
 * Vodium Ledger — signed public tokens for BNPL order links.
 *
 * Lets a customer open their order's consent / receipt page without a login,
 * using an unguessable HMAC-signed token instead of a raw order id. No DB
 * column is needed — the token is `base64url(orderId).HMAC(secret, ...)`.
 */

import crypto from "crypto";

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[bnpl-token] SESSION_SECRET is required in production");
    }
    return "dev-only-secret-change-me-before-production";
  }
  return s;
}

function hmac(input: string): string {
  return crypto.createHmac("sha256", getSecret()).update(input, "utf8").digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function signOrderToken(orderId: string): string {
  const payload = Buffer.from(orderId, "utf8").toString("base64url");
  return `${payload}.${hmac(`v1:bnpl:${payload}`)}`;
}

export function verifyOrderToken(token: string): string | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    if (!safeEqual(incoming, hmac(`v1:bnpl:${payload}`))) return null;
    const orderId = Buffer.from(payload, "base64url").toString("utf8");
    return orderId.length >= 10 ? orderId : null;
  } catch {
    return null;
  }
}
