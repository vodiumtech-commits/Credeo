/**
 * Vodium Ledger — SMS via Termii (Nigerian provider). Used as a reliable OTP
 * fallback when WhatsApp delivery isn't possible. Falls back to console in dev.
 *
 * Env: TERMII_API_KEY, TERMII_SENDER_ID (an approved sender id / alphanumeric).
 */

export async function sendSms(to: string, message: string): Promise<void> {
  const apiKey = process.env.TERMII_API_KEY;
  const sender = process.env.TERMII_SENDER_ID ?? "Vodium";

  if (!apiKey) {
    console.log(`\n[SMS → ${to}] ${message}\n`);
    return;
  }

  const recipient = to.replace(/^\+/, "");
  const res = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: recipient,
      from: sender,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: apiKey,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[termii] SMS error ${res.status}: ${err.slice(0, 200)}`);
    throw new Error(`SMS send failed: ${res.status}`);
  }
}
