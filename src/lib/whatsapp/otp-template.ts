/**
 * Vodium Ledger — WhatsApp OTP *template* management.
 *
 * Meta only delivers business-initiated messages (like an OTP to a customer
 * who has never chatted with the bot) through a pre-approved template. This
 * module creates and inspects that template via the Graph API using the same
 * credentials the bot already runs on — so the whole setup is one button in
 * the admin console instead of a trip through WhatsApp Manager.
 *
 * The template is an AUTHENTICATION template: Meta fixes its wording, we only
 * choose the name, language and the copy-code button. That's also why creation
 * is safe — there is no copy to get rejected.
 *
 * All calls no-op with a console log in dev (no token), like profile.ts.
 */

const META_API_VERSION = "v19.0";
const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

import { resolveConfiguredTemplateName } from "@/lib/otp-delivery";

export interface OtpTemplateInfo {
  name: string;
  status: string;    // APPROVED | PENDING | REJECTED | ...
  language: string;
  category: string;
}

export interface OtpTemplateStatus {
  configured: boolean;        // WhatsApp creds present at all
  resolvedName: string;       // the name OTP sends will actually use
  templates: OtpTemplateInfo[];
  /** The template OTP sending will use, if it exists on the account. */
  active?: OtpTemplateInfo;
  detail?: string;
}

function creds() {
  return {
    token: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    // Optional: skips one Graph round-trip when set.
    wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  };
}

/**
 * Turn Meta's error responses into instructions a non-Meta-expert can act on.
 * The raw error is always logged server-side for the full picture.
 */
function explainMetaError(status: number, error?: { code?: number; message?: string }): string {
  const code = error?.code;
  if (code === 190) {
    return "The WhatsApp access token is invalid or expired. Generate a new system-user token in Meta Business Settings and update WHATSAPP_ACCESS_TOKEN in Vercel, then redeploy.";
  }
  if (code === 200 || code === 10 || code === 3) {
    return "The access token lacks permission. Regenerate it with BOTH whatsapp_business_messaging and whatsapp_business_management ticked — and make sure the system user has the WhatsApp account added under its Assets (Business Settings → System users → Add assets).";
  }
  if (code === 100) {
    return `Meta rejected the request (#100 ${error?.message ?? "Invalid parameter"}). If the token is new, confirm the system user has the WhatsApp account asset assigned.`;
  }
  return error?.message ?? `Meta returned HTTP ${status}.`;
}

/** The WABA that owns the phone number — resolved once via the phone-number node. */
async function getWabaId(token: string, phoneId: string): Promise<{ id: string } | { error: string }> {
  const preset = creds().wabaId;
  if (preset) return { id: preset };
  const res = await fetch(
    `${GRAPH}/${phoneId}?fields=whatsapp_business_account`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json().catch(() => ({}))) as {
    whatsapp_business_account?: { id?: string };
    error?: { code?: number; message?: string };
  };
  if (!res.ok || !json.whatsapp_business_account?.id) {
    console.error("[otp-template] WABA lookup failed:", res.status, JSON.stringify(json.error ?? json));
    return { error: explainMetaError(res.status, json.error) };
  }
  return { id: json.whatsapp_business_account.id };
}

/** All message templates on the account (name, status, language, category). */
export async function listOtpTemplates(): Promise<OtpTemplateStatus> {
  const { token, phoneId } = creds();
  const resolvedName = resolveConfiguredTemplateName();

  if (!token || !phoneId) {
    return { configured: false, resolvedName, templates: [], detail: "No WhatsApp credentials configured (dev)." };
  }

  const waba = await getWabaId(token, phoneId);
  if ("error" in waba) {
    return { configured: true, resolvedName, templates: [], detail: waba.error };
  }

  const res = await fetch(
    `${GRAPH}/${waba.id}/message_templates?fields=name,status,language,category&limit=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json().catch(() => ({}))) as {
    data?: Array<{ name: string; status: string; language: string; category: string }>;
    error?: { code?: number; message?: string };
  };
  if (!res.ok) {
    console.error("[otp-template] template list failed:", res.status, JSON.stringify(json.error ?? json));
    return { configured: true, resolvedName, templates: [], detail: explainMetaError(res.status, json.error) };
  }

  const templates = (json.data ?? []).map((t) => ({
    name: t.name, status: t.status, language: t.language, category: t.category,
  }));
  const active = templates.find((t) => t.name === resolvedName);
  return { configured: true, resolvedName, templates, active };
}

/**
 * Create the OTP template if it doesn't exist yet. Idempotent: an existing
 * template (any status) is reported, never recreated — so this can never break
 * a working setup. Authentication templates are usually approved in minutes.
 */
export async function ensureOtpTemplate(): Promise<OtpTemplateStatus & { created: boolean }> {
  const current = await listOtpTemplates();
  if (!current.configured || current.detail) return { ...current, created: false };
  if (current.active) return { ...current, created: false };

  const { token, phoneId } = creds();
  const waba = await getWabaId(token!, phoneId!);
  if ("error" in waba) return { ...current, created: false, detail: waba.error };

  const res = await fetch(`${GRAPH}/${waba.id}/message_templates`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: current.resolvedName,
      language: "en_US",
      category: "AUTHENTICATION",
      components: [
        // Meta writes the copy for AUTHENTICATION templates; we just opt into
        // the safety line and a 10-minute expiry that matches our OTP TTL.
        { type: "BODY", add_security_recommendation: true },
        { type: "FOOTER", code_expiration_minutes: 10 },
        { type: "BUTTONS", buttons: [{ type: "OTP", otp_type: "COPY_CODE" }] },
      ],
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string; status?: string;
    error?: { code?: number; message?: string; error_user_msg?: string };
  };
  if (!res.ok) {
    console.error("[otp-template] template create failed:", res.status, JSON.stringify(json.error ?? json));
    return {
      ...current, created: false,
      detail: json.error?.error_user_msg ?? explainMetaError(res.status, json.error),
    };
  }

  const refreshed = await listOtpTemplates();
  return { ...refreshed, created: true };
}
