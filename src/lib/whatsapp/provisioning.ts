/**
 * Vodium Ledger — WhatsApp number provisioning helpers (Meta Graph API).
 *
 * Removes the hardest manual steps when a store connects their own number:
 * subscribing the Vodium app to their WhatsApp Business Account so inbound
 * messages reach our webhook automatically — no manual webhook config.
 */

const META_API_VERSION = "v19.0";

/** Subscribe the app to a WABA so its messages are delivered to our webhook. */
export async function subscribeAppToWaba(wabaId: string, token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://graph.facebook.com/${META_API_VERSION}/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "request failed" };
  }
}
