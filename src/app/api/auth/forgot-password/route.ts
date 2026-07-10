import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email/otp";
import { setVendorSession } from "@/lib/session";
import { setOtpCookie, verifyOtpCookie, clearOtpCookie } from "@/lib/otp-cookie";

const requestSchema = z.object({ email: z.string().trim().email().toLowerCase() });
const verifySchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  otp: z.string().length(6).regex(/^\d{6}$/),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    if ("otp" in json) return handleVerify(json);
    return handleRequest(json);
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// ─── step 1: email a reset code (no account enumeration) ──────────────────────
async function handleRequest(json: unknown) {
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const { email } = parsed.data;

  const rl = await rateLimit(`rl:forgot:${email}`, 3, 900, true);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please wait 15 minutes." }, { status: 429 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { email }, select: { id: true } });
  // Only send when the account exists, but always return the same response.
  if (vendor) {
    const otp = String(crypto.randomInt(100000, 999999));
    setOtpCookie("reset", email, otp);
    await sendOtpEmail(email, otp, "reset");
  }

  return NextResponse.json({ ok: true, step: "otp" });
}

// ─── step 2: verify code, set new password, sign in ───────────────────────────
async function handleVerify(json: unknown) {
  const parsed = verifySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { email, otp, password } = parsed.data;

  const rl = await rateLimit(`rl:forgot-verify:${email}`, 5, 600, true);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  }

  if (!verifyOtpCookie("reset", email, otp)) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }
  clearOtpCookie("reset");

  const vendor = await prisma.vendor.findUnique({ where: { email } });
  if (!vendor) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: { passwordHash, status: vendor.status === "INACTIVE" ? "ACTIVE" : vendor.status },
  });

  setVendorSession(vendor.phone);
  return NextResponse.json({ ok: true });
}
