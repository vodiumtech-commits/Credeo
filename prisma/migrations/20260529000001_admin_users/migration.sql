-- Migration: add AdminUser table for multi-role admin team

DO $$
BEGIN
    CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'CFO', 'CUSTOMER_CARE', 'ANALYTICS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id"             TEXT          NOT NULL,
    "name"           TEXT          NOT NULL,
    "email"          TEXT          NOT NULL,
    "role"           "AdminRole"   NOT NULL,
    "passwordHash"   TEXT,
    "inviteToken"    TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "activatedAt"    TIMESTAMP(3),
    "lastLoginAt"    TIMESTAMP(3),
    "invitedById"    TEXT,
    "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key"       ON "AdminUser"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_inviteToken_key" ON "AdminUser"("inviteToken");
CREATE INDEX        IF NOT EXISTS "AdminUser_email_idx"       ON "AdminUser"("email");
CREATE INDEX        IF NOT EXISTS "AdminUser_inviteToken_idx" ON "AdminUser"("inviteToken");
