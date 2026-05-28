/**
 * Vodium Ledger — Next.js Edge Middleware
 *
 * SECURITY
 * ────────
 * • Vendor sessions: verifies HMAC-SHA256 signature of vodium_sid cookie
 * • Admin sessions:  verifies HMAC-SHA256 signature + 8-hour TTL of vodium_asid cookie
 * • All responses:   injects hardened security headers
 *
 * This runs in the Edge runtime — uses Web Crypto (crypto.subtle), not Node crypto.
 */

import { NextRequest, NextResponse } from "next/server";
import { VENDOR_COOKIE, ADMIN_COOKIE, ADMIN_COOKIE_AGE } from "@/lib/session-cookies";

// ── Web-Crypto HMAC verification (Edge-compatible) ───────────────────────────

async function computeHmac(secret: string, input: string): Promise<string> {
  const enc  = new TextEncoder();
  const key  = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const raw  = await crypto.subtle.sign("HMAC", key, enc.encode(input));
  // Convert to base64url (same as Node's digest("base64url"))
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Constant-time string compare (Edge-compatible). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function isValidVendorCookie(token: string, secret: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload  = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = await computeHmac(secret, `v1:vendor:${payload}`);
    return timingSafeEqual(incoming, expected);
  } catch {
    return false;
  }
}

async function isValidAdminCookie(token: string, secret: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const iat36    = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = await computeHmac(secret, `v1:admin:${iat36}`);
    if (!timingSafeEqual(incoming, expected)) return false;
    // Check TTL
    const iat = parseInt(iat36, 36);
    if (isNaN(iat)) return false;
    return Date.now() - iat < ADMIN_COOKIE_AGE * 1000;
  } catch {
    return false;
  }
}

// ── Security headers ──────────────────────────────────────────────────────────

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options",  "nosniff");
  res.headers.set("X-Frame-Options",         "DENY");
  res.headers.set("X-XSS-Protection",        "1; mode=block");
  res.headers.set("Referrer-Policy",         "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy",      "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.paystack.co https://app.posthog.com https://eu.posthog.com https://*.ingest.de.sentry.io https://*.ingest.sentry.io https://innocent-teal-82236.upstash.io",
      "frame-src https://js.paystack.co https://checkout.paystack.com",
    ].join("; ")
  );
  return res;
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const secret =
    process.env.SESSION_SECRET ?? "dev-only-secret-change-me-before-production";

  // ── Dashboard routes — require vendor session ────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(VENDOR_COOKIE)?.value;

    if (!token || !(await isValidVendorCookie(token, secret))) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      const res = NextResponse.redirect(url);
      // Clear any stale/forged cookie
      if (token) {
        res.cookies.set(VENDOR_COOKIE, "", { maxAge: 0, path: "/" });
      }
      return addSecurityHeaders(res);
    }
  }

  // ── Admin routes — require admin session (strict HMAC + TTL) ────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;

    if (!token || !(await isValidAdminCookie(token, secret))) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      const res = NextResponse.redirect(url);
      if (token) {
        res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
      }
      return addSecurityHeaders(res);
    }
  }

  // ── API route hardening ──────────────────────────────────────────────────
  // Block direct access to admin API routes without a verified admin session
  if (pathname.startsWith("/api/admin/")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token || !(await isValidAdminCookie(token, secret))) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Forbidden" }, { status: 403 })
      );
    }
  }

  const res = NextResponse.next();
  return addSecurityHeaders(res);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    // Exclude static assets and _next internals from middleware
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
