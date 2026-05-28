/**
 * Vodium Ledger — Session management with HMAC-signed tokens.
 *
 * SECURITY MODEL
 * ──────────────
 * Vendor session:  cookie "vodium_sid"  = base64url(phone) + "." + HMAC-SHA256(secret, "v1:vendor:" + payload)
 * Admin session:   cookie "vodium_asid" = base36(issuedAt)  + "." + HMAC-SHA256(secret, "v1:admin:"  + iat36)
 *
 * An attacker who knows any phone number cannot forge a valid token without SESSION_SECRET.
 * All comparisons are constant-time to prevent timing-oracle attacks.
 */

import { cookies } from "next/headers";
import { prisma } from "./prisma";
import crypto from "crypto";
import type { Vendor, VendorSubscription } from "@prisma/client";
export { VENDOR_COOKIE, ADMIN_COOKIE, VENDOR_COOKIE_AGE, ADMIN_COOKIE_AGE } from "./session-cookies";
import { VENDOR_COOKIE, ADMIN_COOKIE, VENDOR_COOKIE_AGE, ADMIN_COOKIE_AGE } from "./session-cookies";

export type VendorWithSub = Vendor & { subscription: VendorSubscription | null };

// ── Secret ───────────────────────────────────────────────────────────────────

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[session] SESSION_SECRET env var is required in production");
    }
    // Dev fallback — warn loudly
    console.warn("[session] ⚠ SESSION_SECRET not set — using insecure dev default");
    return "dev-only-secret-change-me-before-production";
  }
  return s;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function hmac(secret: string, input: string): string {
  return crypto.createHmac("sha256", secret).update(input, "utf8").digest("base64url");
}

/** Constant-time string comparison to prevent timing-oracle attacks. */
function safeEqual(a: string, b: string): boolean {
  // Pad shorter string to prevent length-leak
  const maxLen = Math.max(a.length, b.length);
  const aBuf = Buffer.alloc(maxLen, 0);
  const bBuf = Buffer.alloc(maxLen, 0);
  aBuf.write(a, "utf8");
  bBuf.write(b, "utf8");
  // timingSafeEqual requires equal-length buffers
  return crypto.timingSafeEqual(aBuf, bBuf) && a.length === b.length;
}

// ══ VENDOR SESSION ═══════════════════════════════════════════════════════════

/**
 * Build a tamper-proof vendor session token.
 * Format: base64url(phone) + "." + HMAC-SHA256(secret, "v1:vendor:" + base64url(phone))
 */
export function buildSessionToken(phone: string): string {
  const payload = Buffer.from(phone, "utf8").toString("base64url");
  const sig = hmac(getSecret(), `v1:vendor:${payload}`);
  return `${payload}.${sig}`;
}

/**
 * Verify a vendor session token.
 * Returns the E.164 phone on success, or null if the token is invalid or tampered.
 */
export function verifySessionToken(token: string): string | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload  = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = hmac(getSecret(), `v1:vendor:${payload}`);
    if (!safeEqual(incoming, expected)) return null;
    const phone = Buffer.from(payload, "base64url").toString("utf8");
    // Basic sanity check — must look like an E.164 phone
    if (!/^\+\d{7,15}$/.test(phone)) return null;
    return phone;
  } catch {
    return null;
  }
}

/** Set the vendor session cookie after successful authentication. */
export function setVendorSession(phone: string): void {
  cookies().set(VENDOR_COOKIE, buildSessionToken(phone), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   VENDOR_COOKIE_AGE,
    path:     "/",
  });
}

/** Expire the vendor session cookie. */
export function clearVendorSession(): void {
  cookies().set(VENDOR_COOKIE, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   0,
    path:     "/",
  });
}

/** Returns the verified E.164 phone from the session cookie, or null. */
export function getSessionPhone(): string | null {
  const raw = cookies().get(VENDOR_COOKIE)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

/** Returns full Vendor + subscription from session, or null if unauthenticated. */
export async function getVendorSession(): Promise<VendorWithSub | null> {
  const phone = getSessionPhone();
  if (!phone) return null;
  return prisma.vendor.findUnique({
    where:   { phone },
    include: { subscription: true },
  });
}

// ══ ADMIN SESSION ═════════════════════════════════════════════════════════════

/**
 * Build a time-scoped admin session token (valid 8 hours).
 * Format: base36(Date.now()) + "." + HMAC-SHA256(secret, "v1:admin:" + iat36)
 */
export function buildAdminToken(): string {
  const iat36 = Date.now().toString(36);
  const sig   = hmac(getSecret(), `v1:admin:${iat36}`);
  return `${iat36}.${sig}`;
}

/**
 * Verify an admin session token.
 * Returns true if the signature is valid and the token was issued within the last 8 hours.
 */
export function verifyAdminToken(token: string): boolean {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const iat36    = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = hmac(getSecret(), `v1:admin:${iat36}`);
    if (!safeEqual(incoming, expected)) return false;
    const iat = parseInt(iat36, 36);
    if (isNaN(iat)) return false;
    // Reject tokens older than 8 hours
    return Date.now() - iat < ADMIN_COOKIE_AGE * 1000;
  } catch {
    return false;
  }
}

/** Set the admin session cookie after a successful admin login. */
export function setAdminSession(): void {
  cookies().set(ADMIN_COOKIE, buildAdminToken(), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",  // stricter for admin
    maxAge:   ADMIN_COOKIE_AGE,
    path:     "/",
  });
}

/** Expire the admin session cookie. */
export function clearAdminSession(): void {
  cookies().set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   0,
    path:     "/",
  });
}

/** Validate the admin session. Use in Server Components and Route Handlers. */
export function isAdminSession(): boolean {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}
