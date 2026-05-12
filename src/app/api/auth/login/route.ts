import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRedis, rateLimit } from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email/otp";

// ── Step 1: verify password, send OTP ────────────────────────────────────────

const requestSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ── Step 2: verify OTP, set session ──────────────────────────────────────────

const verifySchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(req: NextRequest) {
  const json = await req.json();

  // ── Determine which step we're on ────────────────────────────────────────
  if ("otp" in json) {
    return handleVerify(json);
  }
  return handleRequest(json);
}

// ─── step 1 ───────────────────────────────────────────────────────────────────

async function handleRequest(json: unknown) {
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Rate-limit: max 5 login attempts per 15 min per email.
  const rl = await rateLimit(`rl:login:${email}`, 5, 900);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 15 minutes and try again." },
      { status: 429 }
    );
  }

  const vendor = await prisma.vendor.findUnique({ where: { email } });

  // Constant-time compare to prevent user enumeration.
  const dummyHash = "$2a$12$invalidhashpadding00000000000000000000000000000000000";
  const match     = await bcrypt.compare(password, vendor?.passwordHash ?? dummyHash);

  if (!vendor || !match) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  // Generate and store OTP (10-min TTL).
  const otp   = String(crypto.randomInt(100000, 999999));
  const redis = getRedis();
  if (redis) {
    await redis.set(`otp:login:${email}`, otp, { ex: 600 });
  }

  await sendOtpEmail(email, otp, "login");

  return NextResponse.json({ ok: true, step: "otp" });
}

// ─── step 2 ───────────────────────────────────────────────────────────────────

async function handleVerify(json: unknown) {
  const parsed = verifySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const { email, otp } = parsed.data;

  // Rate-limit: max 5 wrong OTP attempts per 10 min.
  const rl = await rateLimit(`rl:otp-verify:${email}`, 5, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Request a new code." },
      { status: 429 }
    );
  }

  const redis   = getRedis();
  const stored  = redis ? await redis.get<string>(`otp:login:${email}`) : null;

  if (!stored || stored !== otp) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  // OTP is single-use — delete it immediately.
  await redis?.del(`otp:login:${email}`);

  const vendor = await prisma.vendor.findUnique({ where: { email } });
  if (!vendor) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Set session cookie.
  cookies().set("vodium_phone", vendor.phone, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });

  // Grant admin cookie if phone is in ADMIN_PHONES.
  const adminPhones = (process.env.ADMIN_PHONES ?? "")
    .split(",").map((p) => p.trim()).filter(Boolean);
  if (adminPhones.includes(vendor.phone) && process.env.ADMIN_SECRET) {
    cookies().set("vodium_admin", process.env.ADMIN_SECRET, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 30,
      path:     "/",
    });
  }

  return NextResponse.json({ ok: true });
}
