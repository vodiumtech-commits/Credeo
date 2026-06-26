-- Staff invitation: invite token columns on Vendor.

ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "inviteToken" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "inviteTokenExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_inviteToken_key" ON "Vendor"("inviteToken");
