/**
 * Vodium Ledger — reliable customer OTP delivery.
 *
 * DESIGN: OTP is delivered through the PLATFORM's own channels, never the store's.
 * This removes all Meta setup from vendors — they don't need their own WhatsApp
 * number, token, or template for storefront OTP to work.
 *
 * Delivery order:
 *   1. WhatsApp OTP *template* from Vodium's number (if WHATSAPP_OTP_TEMPLATE_NAME set).
 *   2. SMS via Termii (if TERMII_API_KEY set).
 *   3. Dev fallback: log to server console.
 *
 * A store's own connected number is still used for branded conversations and
 * reminders — just not for OTP, which must be maximally reliable.
 */

import { sendWhatsAppTemplate } from "@/lib/whatsapp/outbound";
import { sendSms } from "@/lib/sms/termii";

export type OtpChannel = "whatsapp" | "sms" | "console";

export async function sendOtpCode(input: {
  phone: string;
  code: string;
  storeName: string;
}): Promise<{ channel: OtpChannel }> {
  const { phone, code, storeName } = input;

  // 1) WhatsApp OTP template via the platform number.
  const template = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  if (template && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      await sendWhatsAppTemplate(phone, template, [code], {
        languageCode: process.env.WHATSAPP_OTP_TEMPLATE_LANG ?? "en_US",
        otpButton: process.env.WHATSAPP_OTP_TEMPLATE_BUTTON !== "false",
      });
      return { channel: "whatsapp" };
    } catch (err) {
      console.warn("[otp] WhatsApp template failed, falling back to SMS:", err);
    }
  }

  // 2) SMS fallback.
  if (process.env.TERMII_API_KEY) {
    try {
      await sendSms(phone, `${code} is your ${storeName} verification code. Do not share it.`);
      return { channel: "sms" };
    } catch (err) {
      console.warn("[otp] SMS failed:", err);
    }
  }

  // 3) Dev fallback.
  console.log(`\n[OTP → ${phone}] ${code} (${storeName})\n`);
  return { channel: "console" };
}
