import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_AGE, ADMIN_ROUTE_ROLES, VENDOR_COOKIE, VENDOR_COOKIE_AGE } from "@/lib/session-cookies";

type AdminTokenPayload = {
  id: string;
  role: string;
  iat: number;
};

const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/vendor/register",
  "/api/paystack/webhook",
  "/api/newsletter",
  "/api/cron",
  "/api/admin/login",
  "/api/admin/invite",
  "/api/staff/accept",
  "/api/public",
  "/api/storefront",
];

const VENDOR_API_PREFIXES = [
  "/api/credits",
  "/api/customers",
  "/api/repayments",
  "/api/vendor/me",
  "/api/vendor/remind-overdue",
  "/api/notifications",
  "/api/paystack/subscribe",
  "/api/paystack/verify",
  "/api/bnpl",
  "/api/coupons",
  "/api/payment-mandates",
  "/api/ledger",
  "/api/whatsapp/channels",
  "/api/tenant/domains",
  "/api/tenant/branches",
  "/api/tenant/members",
  "/api/tenant/organization",
  "/api/tenant/reminders",
  "/api/products",
  "/api/invoices",
  "/api/upload",
  "/api/user",
];

const PUBLIC_PAGE_PREFIXES = [
  "/login",
  "/register",
  "/admin/login",
  "/admin/invite",
];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
        isPublicApi(pathname)) {
      return withSecurityHeaders(NextResponse.next());
    }

    if (isApi(pathname) && isCrossSiteMutation(req)) return jsonError("Cross-site request blocked", 403);

    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    const admin = token ? await verifyAdminToken(token) : null;
    if (!admin) return unauthorized(req, "/admin/login");

    const rule = ADMIN_ROUTE_ROLES.find((entry) => pathname.startsWith(entry.prefix));
    if (rule && !rule.roles.includes(admin.role)) {
      return isApi(pathname)
        ? jsonError("Forbidden", 403)
        : NextResponse.redirect(new URL("/admin", req.url));
    }

    return noStore(withSecurityHeaders(NextResponse.next()));
  }

  if (pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(VENDOR_COOKIE)?.value;
    if (!token || !(await verifyVendorToken(token))) {
      return unauthorized(req, "/login");
    }
    return noStore(withSecurityHeaders(NextResponse.next()));
  }

  if (VENDOR_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (isCrossSiteMutation(req)) return jsonError("Cross-site request blocked", 403);
    const token = req.cookies.get(VENDOR_COOKIE)?.value;
    if (!token || !(await verifyVendorToken(token))) {
      return jsonError("Unauthorized", 401);
    }
    return withSecurityHeaders(NextResponse.next());
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};

function unauthorized(req: NextRequest, loginPath: string) {
  if (isApi(req.nextUrl.pathname)) return jsonError("Unauthorized", 401);
  const url = new URL(loginPath, req.url);
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function isApi(pathname: string) {
  return pathname.startsWith("/api/");
}

// Lightweight CSRF defense: block cookie-authenticated mutations whose Origin
// header doesn't match the request host. (Webhooks/public APIs are handled
// earlier and use signatures, not cookies.)
function isCrossSiteMutation(req: NextRequest): boolean {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return false;
  const origin = req.headers.get("origin");
  if (!origin) return false; // no Origin header — rely on SameSite cookies
  try {
    return new URL(origin).host !== req.headers.get("host");
  } catch {
    return true;
  }
}

function isPublicApi(pathname: string) {
  return pathname === "/api/whatsapp" || PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function jsonError(error: string, status: number) {
  return withSecurityHeaders(NextResponse.json({ error }, { status }));
}

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

// Prevent authenticated pages from being restored by the browser's back/forward
// cache after sign-out (clicking "back" should re-hit middleware and redirect).
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

async function verifyVendorToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = await hmac(`v2:vendor:${payload}`);
    if (incoming !== expected) return false;
    const data = JSON.parse(atobUrl(payload)) as { phone?: string; iat?: number };
    if (!data.phone || !data.iat) return false;
    if (Date.now() - data.iat > VENDOR_COOKIE_AGE * 1000) return false; // expired
    return /^\+\d{7,15}$/.test(data.phone);
  } catch {
    return false;
  }
}

async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const incoming = token.slice(dot + 1);
    const expected = await hmac(`v2:admin:${payload}`);
    if (incoming !== expected) return null;

    const data = JSON.parse(atobUrl(payload)) as AdminTokenPayload;
    if (!data.id || !data.role || !data.iat) return null;
    if (Date.now() - data.iat > ADMIN_COOKIE_AGE * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

async function hmac(input: string): Promise<string> {
  const secret = process.env.SESSION_SECRET || "dev-only-secret-change-me-before-production";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return base64Url(new Uint8Array(sig));
}

function atobUrl(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return atob(base64);
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
