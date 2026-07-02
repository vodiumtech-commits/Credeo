/**
 * Vodium Ledger — customer OTP delivery via the Vodium Ledger WhatsApp bot.
 *
 * DESIGN: OTP is always sent from the PLATFORM's own WhatsApp number, never the
 * store's. Vendors need zero Meta setup for storefront OTP to work.
 *
 * Delivery order:
 *   1. WhatsApp OTP *template* from Vodium's number — the reliable path for
 *      first-time customers (Meta requires a template for business-initiated
 *      messages). Configure WHATSAPP_OTP_TEMPLATE_NAME once.
 *   2. Free-text WhatsApp from Vodium's number (works within an open 24h session).
 *   3. Dev fallback: log to server console.
 */

import { sendWhatsAppMessage, sendWhatsAppTemplate } from "@/lib/whatsapp/outbound";

export type OtpChannel = "whatsapp" | "console";

export async function sendOtpCode(input: {
  phone: string;
  code: string;
  storeName: string;
}): Promise<{ channel: OtpChannel }> {
  const { phone, code, storeName } = input;
  const hasVodiumWa = process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (hasVodiumWa) {
    // 1) Approved OTP template (reliable for first-time numbers).
    const template = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    if (template) {
      try {
        await sendWhatsAppTemplate(phone, template, [code], {
          languageCode: process.env.WHATSAPP_OTP_TEMPLATE_LANG ?? "en_US",
          otpButton: process.env.WHATSAPP_OTP_TEMPLATE_BUTTON !== "false",
        });
        return { channel: "whatsapp" };
      } catch (err) {
        console.warn("[otp] WhatsApp template failed, trying free-text:", err);
      }
    }

    // 2) Free-text from the Vodium bot number (delivers within an open session).
    try {
      await sendWhatsAppMessage(
        phone,
        `${code} is your verification code for your ${storeName} order on Vodium Ledger. It expires in 10 minutes. Do not share it.`
      );
      return { channel: "whatsapp" };
    } catch (err) {
      console.warn("[otp] WhatsApp free-text failed:", err);
    }
  }

  // 3) Dev fallback.
  console.log(`\n[OTP → ${phone}] ${code} (${storeName})\n`);
  return { channel: "console" };
}
