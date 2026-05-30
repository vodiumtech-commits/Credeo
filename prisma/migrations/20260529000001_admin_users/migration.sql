-- Migration: add AdminUser table for multi-role admin team

CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'CFO', 'CUSTOMER_CARE', 'ANALYTICS');

CREATE TABLE "AdminUser" (
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

CREATE UNIQUE INDEX "AdminUser_email_key"       ON "AdminUser"("email");
CREATE UNIQUE INDEX "AdminUser_inviteToken_key" ON "AdminUser"("inviteToken");
CREATE INDEX        "AdminUser_email_idx"       ON "AdminUser"("email");
CREATE INDEX        "AdminUser_inviteToken_idx" ON "AdminUser"("inviteToken");
