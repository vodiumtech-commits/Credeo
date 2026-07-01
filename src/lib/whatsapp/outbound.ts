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

/**
 * Send an approved WhatsApp *template* message. Required for business-initiated
 * messages to numbers outside a 24-hour session (e.g. OTP codes to new customers).
 * The template must be pre-approved in Meta. Falls back to console.log in dev.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParams: string[],
  opts?: { creds?: { token: string; phoneId: string }; languageCode?: string; otpButton?: boolean }
): Promise<void> {
  const token   = opts?.creds?.token  ?? process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = opts?.creds?.phoneId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`\n[WhatsApp template → ${to}] ${templateName}(${bodyParams.join(", ")})\n`);
    return;
  }

  const recipient = to.replace(/^\+/, "").replace(/^whatsapp:/, "");
  const components: unknown[] = [
    { type: "body", parameters: bodyParams.map((t) => ({ type: "text", text: t })) },
  ];
  // Authentication templates carry a copy-code / one-tap button that repeats the code.
  if (opts?.otpButton) {
    components.push({ type: "button", sub_type: "url", index: 0, parameters: [{ type: "text", text: bodyParams[0] }] });
  }

  const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "template",
      template: { name: templateName, language: { code: opts?.languageCode ?? "en_US" }, components },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WhatsApp template] Meta API error ${res.status}: ${err}`);
    throw new Error(`WhatsApp template send failed: ${res.status}`);
  }
}
