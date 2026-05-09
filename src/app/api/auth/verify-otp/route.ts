import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { z } from "zod";
import { cookies } from "next/headers";
import { normalisePhoneNG } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";

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

  // 5 verify attempts per phone per 10 minutes
  const { ok } = await rateLimit(`otp:verify:${phone}`, 5, 600);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429 }
    );
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
    .verificationChecks.create({ to: phone, code: parsed.data.otp });

  if (check.status !== "approved") {
    return NextResponse.json({ error: "Wrong code. Please try again." }, { status: 401 });
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
  const adminPhones = (process.env.ADMIN_PHONES ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  if (adminPhones.includes(phone) && process.env.ADMIN_SECRET) {
    cookies().set("vodium_admin", process.env.ADMIN_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  // Tell the client whether this phone already has a vendor account
  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  return NextResponse.json({ ok: true, isNewVendor: !vendor });
}
