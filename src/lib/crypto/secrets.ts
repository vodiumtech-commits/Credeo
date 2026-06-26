/**
 * Vodium Ledger — application-level secret encryption (AES-256-GCM).
 *
 * Used to store sensitive third-party secrets (e.g. per-tenant WhatsApp access
 * tokens) encrypted at rest, rather than as plaintext in the database.
 *
 * Key: `SECRET_ENCRYPTION_KEY` — 32 bytes, provided as base64 or hex.
 *   Generate one with:  openssl rand -base64 32
 *
 * If the key is not set, encryption is DISABLED and callers should fall back to
 * the environment-variable token strategy. This keeps local/dev working without
 * a key while letting production opt in.
 *
 * Ciphertext format (string):  v1.<iv>.<authTag>.<ciphertext>   (each base64)
 */

import crypto from "crypto";

const PREFIX = "v1";

function loadKey(): Buffer | null {
  const raw = process.env.SECRET_ENCRYPTION_KEY;
  if (!raw) return null;
  let key: Buffer;
  try {
    key = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : Buffer.from(raw, "base64");
  } catch {
    return null;
  }
  if (key.length !== 32) {
    console.error("[secrets] SECRET_ENCRYPTION_KEY must decode to 32 bytes; encryption disabled");
    return null;
  }
  return key;
}

export function isSecretEncryptionEnabled(): boolean {
  return loadKey() !== null;
}

/** Encrypt a plaintext secret. Returns null if no key is configured. */
export function encryptSecret(plaintext: string): string | null {
  const key = loadKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}.${iv.toString("base64")}.${tag.toString("base64")}.${ct.toString("base64")}`;
}

/** Decrypt a value produced by encryptSecret. Returns null on any failure. */
export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const key = loadKey();
  if (!key) return null;
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) return null;
  try {
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const ct = Buffer.from(parts[3], "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
