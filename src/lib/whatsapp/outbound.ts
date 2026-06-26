/**
 * Vodium Ledger — Meta Cloud API outbound messaging.
 *
 * Sends WhatsApp messages via Meta's Graph API (free tier: 1,000 conversations/month).
 * Falls back to console.log in dev when WHATSAPP_ACCESS_TOKEN is not set.
 *
 * Required env vars:
 *   WHATSAPP_ACCESS_TOKEN    — permanent token from Meta Business Suite
 *   WHATSAPP_PHONE_NUMBER_ID — phone number ID shown in the Meta WhatsApp dashboard
 */

const META_API_VERSION = "v19.0";

export async function sendWhatsAppMessage(
  to: string,
  body: string,
  creds?: { token: string; phoneId: string }
): Promise<void> {
  const token   = creds?.token  ?? process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = creds?.phoneId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    // Dev fallback — print to terminal instead of crashing.
    console.log(`\n[WhatsApp → ${to}]\n${body}\n`);
    return;
  }

  // Normalise: Meta expects E.164 without the leading "+"
  const recipient = to.replace(/^\+/, "").replace(/^whatsapp:/, "");

  const res = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${phoneId}/messages`,
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   recipient,
        type: "text",
        text: { body, preview_url: false },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WhatsApp outbound] Meta API error ${res.status}: ${err}`);
    throw new Error(`WhatsApp send failed: ${res.status}`);
  }
}
