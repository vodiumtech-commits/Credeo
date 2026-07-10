import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { normalisePhoneNG } from "@/lib/utils";
import { rateLimit, getRedis } from "@/lib/redis";

const schema = z.object({ phone: z.string().min(7) });

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
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const phone = normalisePhoneNG(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Could not parse phone number" }, { status: 400 });
  }

  // 3 OTP requests per phone per 10 minutes
  const { ok } = await rateLimit(`otp:req:${phone}`, 3, 600, true);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 10 minutes before trying again." },
      { status: 429 }
    );
  }

  const hasTwilio =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_VERIFY_SERVICE_SID;

  // ── No Twilio configured: print to terminal (dev fallback only) ───────────
  if (!hasTwilio) {
    const otp = String(crypto.randomInt(100000, 999999));
    const redis = getRedis();
    if (redis) await redis.set(`otp:code:${phone}`, otp, { ex: 600 });
    console.log(`\n[DEV OTP]  ${phone}  →  ${otp}\n`);
    return NextResponse.json({ ok: true });
  }

  // ── Twilio Verify (works in both dev and production) ──────────────────────

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuth(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Channel: "sms" }).toString(),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("[request-otp] Twilio error:", res.status, body);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
