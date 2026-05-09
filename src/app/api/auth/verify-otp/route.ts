import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";
import { cookies } from "next/headers";
import { normalisePhoneNG } from "@/lib/utils";

const schema = z.object({
  phone: z.string().min(7),
  otp: z.string().length(6),
});

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

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: phone, code: parsed.data.otp });

  if (check.status !== "approved") {
    return NextResponse.json({ error: "Wrong code" }, { status: 401 });
  }

  // Minimal session cookie. Replace with proper signed JWT or Supabase Auth in v2.
  cookies().set("vodium_phone", phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
