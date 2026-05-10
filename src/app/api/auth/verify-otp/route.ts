import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { normalisePhoneNG } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, getRedis } from "@/lib/redis";

const schema = z.object({
  phone: z.string().min(7),
  otp: z.string().length(6),
});

function twilioAuth() {
  return (
    "Basic " +
    Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64")
  );
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const phone = normalisePhoneNG(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Could not parse phone number" }, { status: 400 });
  }

  // 5 verify attempts per phone per 10 minutes
  const { ok } = await rateLimit(`otp:verify:${phone}`, 5, 600);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429 }
    );
  }

  const hasTwilio =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_VERIFY_SERVICE_SID;

  if (hasTwilio) {
    // ── Twilio Verify Check (dev + production) ────────────────────────────
    const res = await fetch(
      `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          Authorization: twilioAuth(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, Code: parsed.data.otp }).toString(),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("[verify-otp] Twilio error:", res.status, body);
      return NextResponse.json({ error: "Wrong code. Please try again." }, { status: 401 });
    }

    const data = (await res.json()) as { status: string };
    if (data.status !== "approved") {
      return NextResponse.json({ error: "Wrong code. Please try again." }, { status: 401 });
    }
  } else {
    // ── No Twilio: check against Redis (dev fallback) ─────────────────────
    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: "Verification service unavailable." }, { status: 503 });
    }
    const stored = await redis.get(`otp:code:${phone}`);
    if (stored === null || stored === undefined) {
      return NextResponse.json(
        { error: "No OTP session found. Please request a new code." },
        { status: 400 }
      );
    }
    if (String(stored) !== parsed.data.otp) {
      return NextResponse.json({ error: "Wrong code. Please try again." }, { status: 401 });
    }
    await redis.del(`otp:code:${phone}`);
  }

  // Set session cookie (30 days, httpOnly)
  cookies().set("vodium_phone", phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  // Set admin cookie if phone is in the admin list
  const adminPhones = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (adminPhones.includes(phone) && process.env.ADMIN_SECRET) {
    cookies().set("vodium_admin", process.env.ADMIN_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  return NextResponse.json({ ok: true, isNewVendor: !vendor });
}
