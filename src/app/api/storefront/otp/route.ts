import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { resolveTenantByHost } from "@/lib/tenant-domain";
import { normalisePhone } from "@/lib/utils";
import { rateLimit } from "@/lib/redis";
import { setOtpCookie } from "@/lib/otp-cookie";
import { sendOtpCode } from "@/lib/otp-delivery";

const schema = z.object({ phone: z.string().min(7).max(20) });

// Public: send a WhatsApp OTP so a storefront customer can confirm their number.
export async function POST(req: NextRequest) {
  const org = await resolveTenantByHost(req.headers.get("host"));
  if (!org || org.type === "SOLO_VENDOR") {
    return NextResponse.json({ error: "Store not found." }, { status: 404 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });

  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });

  const rl = await rateLimit(`rl:store-otp:${phone}`, 4, 600, true);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });

  const otp = String(crypto.randomInt(100000, 999999));
  setOtpCookie("storefront", phone, otp);

  // Sent from the Vodium Ledger bot number — the store needs no Meta setup for OTP.
  const { channel } = await sendOtpCode({ phone, code: otp, storeName: org.name });

  // Only log the code when explicitly in debug mode — never in normal production.
  if (process.env.OTP_DEBUG_RETURN === "true") {
    console.log(`[storefront/otp] ${org.name} → ${phone} code=${otp} delivery=${channel}`);
  } else {
    console.log(`[storefront/otp] ${org.name} → ${phone.slice(0, 6)}… delivery=${channel}`);
  }

  // Testing aid: when OTP_DEBUG_RETURN=true, return the code so it auto-fills in
  // checkout. Otherwise the code is still readable from the server logs above.
  const debugCode = process.env.OTP_DEBUG_RETURN === "true" ? otp : undefined;

  // Always let the customer proceed to the code-entry step — the code is set in
  // the cookie and logged, so it can be verified even while WhatsApp delivery is
  // still being configured.
  return NextResponse.json({ ok: true, channel, ...(debugCode ? { debugCode } : {}) });
}
