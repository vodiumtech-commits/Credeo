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

/**
 * Coerce a loosely-written name into Meta's format: lowercase, spaces and
 * hyphens to underscores, anything else dropped.
 *
 * This exists because the configured value was "Vodium Ledger". If the account's
 * template is actually called `vodium_ledger`, that is one normalisation away
 * from working — so it is worth one attempt before giving up. Returns null when
 * nothing usable survives.
 */
export function normaliseTemplateName(name: string): string | null {
  const coerced = name
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return isValidTemplateName(coerced) ? coerced : null;
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

    // A name that isn't in Meta's format can still be salvageable: "Vodium
    // Ledger" becomes "vodium_ledger", which may well be the real template.
    // Try that rather than refusing outright — but say loudly what happened,
    // because the env var is still wrong and should be corrected at source.
    let templateName = template;
    if (template && !isValidTemplateName(template)) {
      const coerced = normaliseTemplateName(template);
      if (coerced) {
        console.warn(
          `[otp] WHATSAPP_OTP_TEMPLATE_NAME is "${template}", which is not a valid Meta template ` +
          `name — trying "${coerced}" instead. Set the env var to the template's exact name ` +
          `(WhatsApp Manager → Message Templates → Name column) to remove this guess.`,
        );
        templateName = coerced;
      } else {
        console.error(
          `[otp] WHATSAPP_OTP_TEMPLATE_NAME is "${template}", which cannot be a Meta template name ` +
          `(expected lowercase letters, digits and underscores, e.g. "otp_code"). ` +
          `Skipping the template path — first-time numbers will NOT receive codes until this is fixed.`,
        );
        templateName = undefined;
      }
    }

    if (templateName) {
      const langs = [process.env.WHATSAPP_OTP_TEMPLATE_LANG, "en_US", "en"]
        .filter((v, i, a): v is string => Boolean(v) && a.indexOf(v) === i);
      const otpButton = process.env.WHATSAPP_OTP_TEMPLATE_BUTTON !== "false";
      for (const languageCode of langs) {
        try {
          await sendWhatsAppTemplate(phone, templateName, [code], { languageCode, otpButton });
          return { channel: "whatsapp" };
        } catch (err) {
          console.warn(`[otp] template '${templateName}' (${languageCode}) failed:`, err instanceof Error ? err.message : err);
          // 132001 means the template NAME is unknown to Meta. Trying another
          // language cannot help, so stop rather than repeating the round-trip.
          if (err instanceof WhatsAppSendError && err.code === 132001) {
            console.error(
              `[otp] template "${templateName}" does not exist in this WhatsApp account. ` +
              `List the real names with: GET /v19.0/<WABA_ID>/message_templates — ` +
              `then set WHATSAPP_OTP_TEMPLATE_NAME to one of them, or unset it.`,
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
