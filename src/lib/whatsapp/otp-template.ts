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

/** The WABA that owns the phone number — resolved once via the phone-number node. */
async function getWabaId(token: string, phoneId: string): Promise<string | null> {
  const preset = creds().wabaId;
  if (preset) return preset;
  const res = await fetch(
    `${GRAPH}/${phoneId}?fields=whatsapp_business_account`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { whatsapp_business_account?: { id?: string } };
  return json.whatsapp_business_account?.id ?? null;
}

/** All message templates on the account (name, status, language, category). */
export async function listOtpTemplates(): Promise<OtpTemplateStatus> {
  const { token, phoneId } = creds();
  const resolvedName = resolveConfiguredTemplateName();

  if (!token || !phoneId) {
    return { configured: false, resolvedName, templates: [], detail: "No WhatsApp credentials configured (dev)." };
  }

  const wabaId = await getWabaId(token, phoneId);
  if (!wabaId) {
    return {
      configured: true, resolvedName, templates: [],
      detail: "Could not resolve the WhatsApp Business Account from this phone number — the access token may lack the whatsapp_business_management permission.",
    };
  }

  const res = await fetch(
    `${GRAPH}/${wabaId}/message_templates?fields=name,status,language,category&limit=100`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const json = (await res.json()) as {
    data?: Array<{ name: string; status: string; language: string; category: string }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    return { configured: true, resolvedName, templates: [], detail: json.error?.message ?? `HTTP ${res.status}` };
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
  const wabaId = await getWabaId(token!, phoneId!);
  if (!wabaId) return { ...current, created: false, detail: "Could not resolve the WhatsApp Business Account." };

  const res = await fetch(`${GRAPH}/${wabaId}/message_templates`, {
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
  const json = (await res.json()) as { id?: string; status?: string; error?: { message?: string; error_user_msg?: string } };
  if (!res.ok) {
    return { ...current, created: false, detail: json.error?.error_user_msg ?? json.error?.message ?? `HTTP ${res.status}` };
  }

  const refreshed = await listOtpTemplates();
  return { ...refreshed, created: true };
}
