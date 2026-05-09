import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";
import { normalisePhoneNG } from "@/lib/utils";
import { rateLimit } from "@/lib/redis";

const schema = z.object({ phone: z.string().min(7) });

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
  const { ok } = await rateLimit(`otp:req:${phone}`, 3, 600);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 10 minutes before trying again." },
      { status: 429 }
    );
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: phone, channel: "sms" });

  return NextResponse.json({ ok: true });
}
