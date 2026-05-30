/**
 * Vodium Ledger — Next.js Edge Middleware
 *
 * SECURITY
 * ────────
 * • Vendor sessions: HMAC-SHA256 signed vodium_sid cookie
 * • Admin sessions:  HMAC-SHA256 signed vodium_asid cookie carrying {id, role, iat}
 * • Role-based routing: each /admin/* route checks the role in the token
 * • All responses: hardened security headers
 *
 * Edge runtime — uses Web Crypto (crypto.subtle), NOT Node crypto.
 */

import { NextRequest, NextResponse } from "next/server";
import { VENDOR_COOKIE, ADMIN_COOKIE, ADMIN_COOKIE_AGE, ADMIN_ROUTE_ROLES } from "@/lib/session-cookies";

// ── Web-Crypto helpers ────────────────────────────────────────────────────────

async function computeHmac(secret: string, input: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const raw = await crypto.subtle.sign("HMAC", key, enc.encode(input));
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Verify vendor cookie (v1 format)
async function isValidVendorCookie(token: string, secret: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload  = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = await computeHmac(secret, `v1:vendor:${payload}`);
    return timingSafeEqual(incoming, expected);
  } catch { return false; }
}

interface AdminPayload { id: string; role: string; iat: number; }

// Verify admin cookie (v2 format) and return payload, or null if invalid/expired
async function getAdminPayload(token: string, secret: string): Promise<AdminPayload | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload  = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = await computeHmac(secret, `v2:admin:${payload}`);
    if (!timingSafeEqual(incoming, expected)) return null;
    const data = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as AdminPayload;
    if (!data.id || !data.role || !data.iat) return null;
    if (Date.now() - data.iat > ADMIN_COOKIE_AGE * 1000) return null;
    return data;
  } catch { return null; }
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
  const secret = process.env.SESSION_SECRET ?? "dev-only-secret-change-me-before-production";

  // ── Vendor dashboard ────────────────────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(VENDOR_COOKIE)?.value;
    if (!token || !(await isValidVendorCookie(token, secret))) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      const res = NextResponse.redirect(url);
      if (token) res.cookies.set(VENDOR_COOKIE, "", { maxAge: 0, path: "/" });
      return addSecurityHeaders(res);
    }
  }

  // ── Admin pages + API — skip login and invite pages ────────────────────────
  const isAdminPath    = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isPublicAdmin  = pathname === "/admin/login" || pathname.startsWith("/admin/invite/");

  if (isAdminPath && !isPublicAdmin) {
    const token   = req.cookies.get(ADMIN_COOKIE)?.value;
    const payload = token ? await getAdminPayload(token, secret) : null;

    // Not authenticated → redirect to login
    if (!payload) {
      if (pathname.startsWith("/api/")) {
        return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
      }
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      const res = NextResponse.redirect(url);
      if (token) res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
      return addSecurityHeaders(res);
    }

    // Authenticated — check role for the specific route
    const rule = ADMIN_ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));
    if (rule && !rule.roles.includes(payload.role)) {
      // Wrong role — redirect to their home or 403
      if (pathname.startsWith("/api/")) {
        return addSecurityHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
      }
      // Redirect to the first allowed route for their role
      const roleHome: Record<string, string> = {
        CFO:           "/admin/finance",
        CUSTOMER_CARE: "/admin/support",
        ANALYTICS:     "/admin/analytics",
        SUPER_ADMIN:   "/admin",
      };
      const url = req.nextUrl.clone();
      url.pathname = roleHome[payload.role] ?? "/admin";
      return addSecurityHeaders(NextResponse.redirect(url));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
