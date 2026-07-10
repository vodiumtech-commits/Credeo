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
    // 1) Approved OTP template (reliable for first-time numbers). Try the
    // configured language first, then common fallbacks, since a mismatched
    // language code is a frequent cause of "template does not exist" errors.
    const template = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    if (template) {
      const langs = [process.env.WHATSAPP_OTP_TEMPLATE_LANG, "en_US", "en"]
        .filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);
      const otpButton = process.env.WHATSAPP_OTP_TEMPLATE_BUTTON !== "false";
      for (const languageCode of langs) {
        try {
          await sendWhatsAppTemplate(phone, template, [code], { languageCode, otpButton });
          return { channel: "whatsapp" };
        } catch (err) {
          console.warn(`[otp] template '${template}' (${languageCode}) failed:`, err instanceof Error ? err.message : err);
        }
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

  // 3) Fallback: only print the code outside production (or when debug is on).
  if (process.env.NODE_ENV !== "production" || process.env.OTP_DEBUG_RETURN === "true") {
    console.log(`\n[OTP → ${phone}] ${code} (${storeName})\n`);
  } else {
    console.warn(`[otp] No WhatsApp delivery configured for ${storeName}; code not sent.`);
  }
  return { channel: "console" };
}
