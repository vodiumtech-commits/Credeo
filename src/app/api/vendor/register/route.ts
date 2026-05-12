import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getRedis, rateLimit } from "@/lib/redis";
import { normalisePhoneNG } from "@/lib/utils";
import { sendOtpEmail } from "@/lib/email/otp";
import type { VendorType } from "@prisma/client";

// ─── shared form schema ───────────────────────────────────────────────────────

const formSchema = z.object({
  businessName:   z.string().min(2).max(100),
  vendorType:     z.string(),
  campusLocation: z.string().min(3).max(200),
  university:     z.string().min(2),
  ownerName:      z.string().min(2).max(100),
  phone:          z.string().min(7),
  email:          z.string().email(),
  password:       z.string().min(8, "Password must be at least 8 characters"),
});

const verifySchema = formSchema.extend({
  otp: z.string().length(6).regex(/^\d{6}$/),
});

// ─── university lookup ────────────────────────────────────────────────────────

const UNI_META: Record<string, { city: string; state: string }> = {
  UNILAG:   { city: "Lagos",        state: "Lagos" },
  OAU:      { city: "Ile-Ife",      state: "Osun" },
  UI:       { city: "Ibadan",       state: "Oyo" },
  COVENANT: { city: "Ota",          state: "Ogun" },
  FUTA:     { city: "Akure",        state: "Ondo" },
  LASU:     { city: "Lagos",        state: "Lagos" },
  UNIBEN:   { city: "Benin City",   state: "Edo" },
  ABU:      { city: "Zaria",        state: "Kaduna" },
  UNN:      { city: "Nsukka",       state: "Enugu" },
  UNILORIN: { city: "Ilorin",       state: "Kwara" },
  BABCOCK:  { city: "Ilishan-Remo", state: "Ogun" },
  PAU:      { city: "Lagos",        state: "Lagos" },
};

function parseUniversity(raw: string) {
  const match     = raw.match(/\(([^)]+)\)$/);
  const shortName = match
    ? match[1]
    : raw.split(" ").map((w) => w[0]).join("").toUpperCase();
  const name = raw.replace(/\s*\([^)]*\)$/, "").trim() || raw;
  const meta = UNI_META[shortName] ?? { city: "Nigeria", state: "Nigeria" };
  return { name, shortName, ...meta };
}

// ─── route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    if ("otp" in json) {
      return handleVerify(json);
    }
    return handleRequest(json);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return NextResponse.json(
        { error: "An account with this email or phone already exists. Please log in." },
        { status: 409 }
      );
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// ─── step 1: validate form + send OTP ────────────────────────────────────────

async function handleRequest(json: unknown) {
  const parsed = formSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { phone, email, password } = parsed.data;

  const normalisedPhone = normalisePhoneNG(phone);
  if (!normalisedPhone) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Validate password strength early.
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Check for existing account before generating OTP.
  const existing = await prisma.vendor.findFirst({
    where: { OR: [{ email }, { phone: normalisedPhone }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email or phone already exists. Please log in." },
      { status: 409 }
    );
  }

  // Rate-limit: max 3 OTP sends per email per 10 min.
  const rl = await rateLimit(`rl:register-otp:${email}`, 3, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many verification emails sent. Wait 10 minutes and try again." },
      { status: 429 }
    );
  }

  // Generate OTP and store it.
  const otp   = String(crypto.randomInt(100000, 999999));
  const redis = getRedis();
  if (redis) {
    await redis.set(`otp:register:${email}`, otp, { ex: 600 });
  }

  await sendOtpEmail(email, otp, "register");

  return NextResponse.json({ ok: true, step: "otp" });
}

// ─── step 2: verify OTP + create account ─────────────────────────────────────

async function handleVerify(json: unknown) {
  const parsed = verifySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const {
    businessName, vendorType, campusLocation, university,
    ownerName, phone, email, password, otp,
  } = parsed.data;

  // Verify OTP.
  const redis  = getRedis();
  const stored = redis ? await redis.get<string>(`otp:register:${email}`) : null;

  if (!stored || stored !== otp) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
  }

  // OTP is single-use.
  await redis?.del(`otp:register:${email}`);

  const normalisedPhone = normalisePhoneNG(phone);
  if (!normalisedPhone) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Final duplicate check (race condition safety).
  const existing = await prisma.vendor.findFirst({
    where: { OR: [{ email }, { phone: normalisedPhone }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email or phone already exists. Please log in." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const uniMeta      = parseUniversity(university);

  const uni = await prisma.university.upsert({
    where:  { name: uniMeta.name },
    update: {},
    create: {
      name:      uniMeta.name,
      shortName: uniMeta.shortName,
      city:      uniMeta.city,
      state:     uniMeta.state,
      status:    "PILOT",
    },
  });

  const trialEndsAt = new Date(Date.now() + 60 * 86_400_000);

  const vendor = await prisma.vendor.create({
    data: {
      businessName,
      ownerName,
      phone:         normalisedPhone,
      email,
      passwordHash,
      vendorType:    (vendorType as VendorType) ?? "OTHER",
      universityId:  uni.id,
      campusLocation,
      status:        "ACTIVE",
      subscription: {
        create: {
          plan:          "STARTER",
          status:        "TRIAL",
          trialEndsAt,
          monthlyAmount: 2000,
        },
      },
    },
  });

  cookies().set("vodium_phone", normalisedPhone, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });

  return NextResponse.json({ ok: true, vendorId: vendor.id });
}
