-- Encrypted WhatsApp access token storage (AES-256-GCM ciphertext, never plaintext).

ALTER TABLE "WhatsAppChannel" ADD COLUMN IF NOT EXISTS "accessTokenEnc" TEXT;
