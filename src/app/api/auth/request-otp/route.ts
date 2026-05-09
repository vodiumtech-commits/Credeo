import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";
import { normalisePhoneNG } from "@/lib/utils";

const schema = z.object({ phone: z.string().min(7) });

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
  }

  const phone = normalisePhoneNG(parsed.data.phone);
  if (!phone) {
    return NextResponse.json({ error: "Could not parse phone number" }, { status: 400 });
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verifications.create({ to: phone, channel: "sms" });

  return NextResponse.json({ ok: true });
}
