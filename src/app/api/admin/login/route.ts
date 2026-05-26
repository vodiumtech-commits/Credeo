import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/redis";
import { setAdminSession } from "@/lib/session";

const schema = z.object({ password: z.string().min(1).max(256) });

export async function POST(req: NextRequest) {
  // Rate-limit: 5 attempts per IP per 15 minutes
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = await rateLimit(`admin:login:${ip}`, 5, 900);
  if (!ok) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    // No admin secret configured — deny all admin logins
    console.error("[admin/login] ADMIN_SECRET env var not set — admin login disabled");
    return NextResponse.json({ error: "Admin login not configured" }, { status: 503 });
  }

  // Constant-time compare to prevent timing-oracle on the secret
  const incoming = Buffer.from(parsed.data.password, "utf8");
  const expected = Buffer.from(secret, "utf8");
  const maxLen   = Math.max(incoming.length, expected.length);
  const a = Buffer.alloc(maxLen, 0); incoming.copy(a);
  const b = Buffer.alloc(maxLen, 0); expected.copy(b);

  const match = require("crypto").timingSafeEqual(a, b) && incoming.length === expected.length;
  if (!match) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Issue a signed, time-scoped admin session token — NOT the raw secret
  setAdminSession();
  return NextResponse.json({ ok: true });
}
