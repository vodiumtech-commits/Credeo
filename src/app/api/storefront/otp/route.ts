import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { resolveTenantByHost } from "@/lib/tenant-domain";
import { normalisePhone } from "@/lib/utils";
import { rateLimit } from "@/lib/redis";
import { setOtpCookie } from "@/lib/otp-cookie";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import { getOrgChannelCredentials } from "@/lib/whatsapp/channel-token";

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

  const rl = await rateLimit(`rl:store-otp:${phone}`, 4, 600);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });

  const otp = String(crypto.randomInt(100000, 999999));
  setOtpCookie("storefront", phone, otp);

  const creds = await getOrgChannelCredentials(org.id);
  try {
    await sendWhatsAppMessage(
      phone,
      `Your ${org.name} order code is ${otp}. It expires in 10 minutes.`,
      creds ?? undefined
    );
  } catch (err) {
    console.error("[storefront/otp] WhatsApp send failed:", err);
    // The code is still set in the cookie; in dev it is also logged to the server.
  }

  return NextResponse.json({ ok: true });
}
