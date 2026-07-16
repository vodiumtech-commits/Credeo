-- Campus ambassadors: referral links, click tracking, and vendor attribution.

-- 1) Marketing admin role. (Safe in-transaction: the value is not USED below.)
ALTER TYPE "AdminRole" ADD VALUE IF NOT EXISTS 'MARKETING';

-- 2) Ambassador status
DO $$
BEGIN
  CREATE TYPE "AmbassadorStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) Ambassador
CREATE TABLE IF NOT EXISTS "Ambassador" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "code"      TEXT NOT NULL,
  "phone"     TEXT,
  "email"     TEXT,
  "campus"    TEXT,
  "stipend"   DECIMAL(12,2),
  "status"    "AmbassadorStatus" NOT NULL DEFAULT 'ACTIVE',
  "clicks"    INTEGER NOT NULL DEFAULT 0,
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ambassador_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Ambassador_code_key"    ON "Ambassador"("code");
CREATE INDEX        IF NOT EXISTS "Ambassador_status_idx"  ON "Ambassador"("status");
CREATE INDEX        IF NOT EXISTS "Ambassador_code_idx"    ON "Ambassador"("code");

-- 4) Vendor attribution
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "referredByAmbassadorId" TEXT;
CREATE INDEX IF NOT EXISTS "Vendor_referredByAmbassadorId_idx" ON "Vendor"("referredByAmbassadorId");

DO $$
BEGIN
  ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_referredByAmbassadorId_fkey"
    FOREIGN KEY ("referredByAmbassadorId") REFERENCES "Ambassador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
