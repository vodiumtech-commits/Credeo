/**
 * Vodium Ledger — SendPulse WhatsApp outbound messaging.
 *
 * SendPulse uses OAuth 2.0 (client_credentials). The access token is cached
 * in module scope so one cold-start = one token fetch per Vercel instance.
 */

// ─── token cache ──────────────────────────────────────────────────────────────

let _token: string | null = null;
let _tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiresAt) return _token;

  const res = await fetch("https://api.sendpulse.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type:    "client_credentials",
      client_id:     process.env.SENDPULSE_API_USER_ID,
      client_secret: process.env.SENDPULSE_API_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`SendPulse token error: ${res.status}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  _token          = data.access_token;
  _tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // expire 1 min early
  return _token;
}

// ─── public helper ────────────────────────────────────────────────────────────

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const userId = process.env.SENDPULSE_API_USER_ID;
  const secret = process.env.SENDPULSE_API_SECRET;
  const botId  = process.env.SENDPULSE_WHATSAPP_BOT_ID;

  if (!userId || !secret || !botId) {
    // Dev fallback — log to terminal instead of crashing.
    console.log(`\n[WhatsApp → ${to}]\n${body}\n`);
    return;
  }

  const token = await getAccessToken();

  const res = await fetch("https://api.sendpulse.com/whatsapp/contacts/sendByPhone", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      phone:   to,
      bot_id:  botId,
      message: { type: "text", text: body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WhatsApp outbound] SendPulse error ${res.status}: ${err}`);
  }
}
