/**
 * Vodium Ledger — WhatsApp Business *profile* management.
 *
 * Sets what customers see when they open the bot's chat: the profile photo
 * (your logo), the "About" line, business description, email, website, address
 * and category. This is the Cloud API `whatsapp_business_profile` node plus the
 * resumable-upload handshake needed to attach a photo.
 *
 * The photo path needs the Meta *App ID* (WHATSAPP_APP_ID) in addition to the
 * usual access token, because the upload session is created under the app. If
 * that's absent we still set every text field and simply skip the photo, with a
 * clear note — so a partial config never fails the whole call.
 *
 * All calls no-op with a console log in dev (no token), so this is safe to run
 * locally.
 */

const META_API_VERSION = "v19.0";
const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

/** Meta's fixed business-category codes. Vodium is a financial service. */
export type BusinessVertical =
  | "OTHER" | "FINANCE" | "PROF_SERVICES" | "RETAIL" | "EDU" | "GROCERY" | "NOT_A_BIZ";

export interface BusinessProfileInput {
  about?: string;          // the short line under the name (max 139 chars)
  description?: string;    // longer blurb (max 512)
  email?: string;
  address?: string;
  websites?: string[];     // up to 2
  vertical?: BusinessVertical;
  /** A logo image URL (PNG or JPEG, square, ≥192×192). SVG is not accepted by Meta. */
  logoUrl?: string;
}

export interface ProfileSyncResult {
  ok: boolean;
  photoSet: boolean;
  fieldsSet: boolean;
  skipped: string[];       // human-readable notes about anything not done
  detail?: string;
}

function creds() {
  return {
    token:   process.env.WHATSAPP_ACCESS_TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    appId:   process.env.WHATSAPP_APP_ID, // only needed for the photo upload
  };
}

/**
 * Upload an image and return the resumable-upload *handle* Meta wants for a
 * profile photo. Three steps: open an upload session under the app, stream the
 * bytes, receive the handle.
 */
async function uploadPhotoHandle(logoUrl: string, token: string, appId: string): Promise<string> {
  const img = await fetch(logoUrl);
  if (!img.ok) throw new Error(`Could not fetch logo (${img.status}) from ${logoUrl}`);
  const mime = img.headers.get("content-type") ?? "image/png";
  if (!/image\/(png|jpe?g)/.test(mime)) {
    throw new Error(`Logo must be PNG or JPEG (got ${mime}). WhatsApp does not accept SVG.`);
  }
  const bytes = Buffer.from(await img.arrayBuffer());

  // 1) open an upload session
  const openRes = await fetch(
    `${GRAPH}/${appId}/uploads?file_length=${bytes.length}&file_type=${encodeURIComponent(mime)}&access_token=${token}`,
    { method: "POST" }
  );
  const openJson = (await openRes.json()) as { id?: string; error?: unknown };
  if (!openRes.ok || !openJson.id) throw new Error(`Upload session failed: ${JSON.stringify(openJson.error ?? openJson)}`);

  // 2) stream the bytes; Meta returns the handle as `h`
  const putRes = await fetch(`${GRAPH}/${openJson.id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${token}`, file_offset: "0" },
    body: bytes,
  });
  const putJson = (await putRes.json()) as { h?: string; error?: unknown };
  if (!putRes.ok || !putJson.h) throw new Error(`Photo upload failed: ${JSON.stringify(putJson.error ?? putJson)}`);
  return putJson.h;
}

/**
 * Set the WhatsApp business profile — logo and all text fields — in one go.
 * Returns a structured result so an admin UI can show exactly what happened.
 */
export async function syncWhatsAppProfile(input: BusinessProfileInput): Promise<ProfileSyncResult> {
  const { token, phoneId, appId } = creds();
  const skipped: string[] = [];

  if (!token || !phoneId) {
    console.log("[wa-profile] No WhatsApp creds — dev dry run:", JSON.stringify(input));
    return { ok: true, photoSet: false, fieldsSet: false, skipped: ["No WhatsApp credentials configured (dev)"] };
  }

  // Photo first, so its handle can go in the same profile POST.
  let photoHandle: string | undefined;
  if (input.logoUrl) {
    if (!appId) {
      skipped.push("Logo skipped: set WHATSAPP_APP_ID to enable photo upload, or set the photo in WhatsApp Manager.");
    } else {
      try {
        photoHandle = await uploadPhotoHandle(input.logoUrl, token, appId);
      } catch (err) {
        skipped.push(`Logo upload failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Build the profile body from whatever was provided (Meta ignores absent keys).
  const body: Record<string, unknown> = { messaging_product: "whatsapp" };
  if (photoHandle)                       body.profile_picture_handle = photoHandle;
  if (input.about)       body.about       = input.about.slice(0, 139);
  if (input.description) body.description = input.description.slice(0, 512);
  if (input.email)       body.email       = input.email;
  if (input.address)     body.address     = input.address;
  if (input.vertical)    body.vertical    = input.vertical;
  if (input.websites?.length) body.websites = input.websites.slice(0, 2);

  const res = await fetch(`${GRAPH}/${phoneId}/whatsapp_business_profile`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
  if (!res.ok) {
    return { ok: false, photoSet: false, fieldsSet: false, skipped, detail: json.error?.message ?? `HTTP ${res.status}` };
  }

  return {
    ok: true,
    photoSet: Boolean(photoHandle),
    fieldsSet: true,
    skipped,
  };
}

/** Read the profile currently live on the number — for showing "current" state. */
export async function getWhatsAppProfile() {
  const { token, phoneId } = creds();
  if (!token || !phoneId) return null;
  const fields = "about,address,description,email,profile_picture_url,websites,vertical";
  const res = await fetch(`${GRAPH}/${phoneId}/whatsapp_business_profile?fields=${fields}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
  return json.data?.[0] ?? null;
}

/** Vodium's default profile — the branded copy used when the admin doesn't override. */
export const VODIUM_PROFILE: BusinessProfileInput = {
  about: "Track credit. Recover money. All on WhatsApp.",
  description:
    "Vodium Ledger helps vendors record credit in seconds and recover it with polite automatic reminders — no app to download.",
  email: "support@vodiumledger.com",
  websites: ["https://vodiumledger.com"],
  vertical: "FINANCE",
};
