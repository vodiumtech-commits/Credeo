/**
 * Vodium Ledger — Twilio outbound WhatsApp messaging.
 *
 * Use this (not TwiML) for proactive messages: reminders, alerts, etc.
 * TwiML is only for synchronous webhook replies.
 */

import twilio from "twilio";

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    // Dev fallback — log instead of crash
    console.log(`[WhatsApp outbound → ${to}]\n${body}\n`);
    return;
  }

  const toFormatted   = to.startsWith("whatsapp:")   ? to   : `whatsapp:${to}`;
  const fromFormatted = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const client = twilio(accountSid, authToken);
  await client.messages.create({ from: fromFormatted, to: toFormatted, body });
}
