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

import { sendWhatsAppMessage, sendWhatsAppTemplate, WhatsAppSendError } from "@/lib/whatsapp/outbound";

/**
 * Meta template names are lowercase identifiers: letters, digits, underscores.
 * A display name like "Vodium Ledger" can never be one, and attempting it costs
 * a failed API round-trip per configured language on every single OTP.
 */
export function isValidTemplateName(name: string): boolean {
  return /^[a-z0-9_]{1,512}$/.test(name);
}

export type OtpChannel = "whatsapp" | "console";

export async function sendOtpCode(input: {
  phone: string;
  code: string;
  storeName: string;
}): Promise<{ channel: OtpChannel }> {
  const { phone, code, storeName } = input;
  const hasVodiumWa = process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (hasVodiumWa) {
    // 1) Approved OTP template (the only path that reaches a number with no
    // open 24-hour session — i.e. any first-time customer).
    const template = process.env.WHATSAPP_OTP_TEMPLATE_NAME;

    if (template && !isValidTemplateName(template)) {
      // Misconfiguration, not a transient failure: Meta template names are
      // lowercase/underscore identifiers, never a display name like "Vodium
      // Ledger". Attempting it would burn a round-trip per language and always
      // 404, so say so plainly and skip straight to the free-text attempt.
      console.error(
        `[otp] WHATSAPP_OTP_TEMPLATE_NAME is "${template}", which cannot be a Meta template name ` +
        `(expected lowercase letters, digits and underscores, e.g. "otp_code"). ` +
        `Skipping the template path — first-time numbers will NOT receive codes until this is fixed.`,
      );
    } else if (template) {
      const langs = [process.env.WHATSAPP_OTP_TEMPLATE_LANG, "en_US", "en"]
        .filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);
      const otpButton = process.env.WHATSAPP_OTP_TEMPLATE_BUTTON !== "false";
      for (const languageCode of langs) {
        try {
          await sendWhatsAppTemplate(phone, template, [code], { languageCode, otpButton });
          return { channel: "whatsapp" };
        } catch (err) {
          console.warn(`[otp] template '${template}' (${languageCode}) failed:`, err instanceof Error ? err.message : err);
          // 132001 means the template NAME is unknown to Meta. Trying another
          // language cannot help, so stop rather than repeating the round-trip.
          if (err instanceof WhatsAppSendError && err.code === 132001) {
            console.error(
              `[otp] template "${template}" does not exist in this WhatsApp account — ` +
              `create it in WhatsApp Manager or unset WHATSAPP_OTP_TEMPLATE_NAME.`,
            );
            break;
          }
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
