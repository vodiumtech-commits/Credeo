-- Add enterprise tenant foundations while keeping existing vendor accounts working.

DO $$
BEGIN
  CREATE TYPE "OrganizationType" AS ENUM ('SOLO_VENDOR', 'SUPERMARKET', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OrganizationStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OrganizationPlan" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PRO', 'ENTERPRISE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'HQ_ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF', 'FINANCE', 'AUDITOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "WhatsAppChannelStatus" AS ENUM ('TEST', 'ACTIVE', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "OrganizationType" NOT NULL DEFAULT 'SOLO_VENDOR',
  "status" "OrganizationStatus" NOT NULL DEFAULT 'TRIAL',
  "trialEndsAt" TIMESTAMP(3),
  "plan" "OrganizationPlan" NOT NULL DEFAULT 'FREE',
  "logoUrl" TEXT,
  "brandColor" TEXT,
  "communityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Branch" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OrganizationMembership" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "branchId" TEXT,
  "role" "OrganizationRole" NOT NULL DEFAULT 'BRANCH_STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TenantDomain" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "host" TEXT NOT NULL,
  "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantDomain_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WhatsAppChannel" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "phoneNumberId" TEXT,
  "businessAccountId" TEXT,
  "accessTokenRef" TEXT,
  "status" "WhatsAppChannelStatus" NOT NULL DEFAULT 'TEST',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsAppChannel_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Credit" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Credit" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "WhatsAppSession" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "WhatsAppSession" ADD COLUMN IF NOT EXISTS "channelId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX IF NOT EXISTS "Organization_type_idx" ON "Organization"("type");
CREATE INDEX IF NOT EXISTS "Organization_status_idx" ON "Organization"("status");
CREATE INDEX IF NOT EXISTS "Organization_communityId_idx" ON "Organization"("communityId");

CREATE UNIQUE INDEX IF NOT EXISTS "Branch_organizationId_code_key" ON "Branch"("organizationId", "code");
CREATE INDEX IF NOT EXISTS "Branch_organizationId_idx" ON "Branch"("organizationId");
CREATE INDEX IF NOT EXISTS "Branch_status_idx" ON "Branch"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMembership_organizationId_vendorId_key"
  ON "OrganizationMembership"("organizationId", "vendorId");
CREATE INDEX IF NOT EXISTS "OrganizationMembership_organizationId_idx" ON "OrganizationMembership"("organizationId");
CREATE INDEX IF NOT EXISTS "OrganizationMembership_vendorId_idx" ON "OrganizationMembership"("vendorId");
CREATE INDEX IF NOT EXISTS "OrganizationMembership_branchId_idx" ON "OrganizationMembership"("branchId");
CREATE INDEX IF NOT EXISTS "OrganizationMembership_role_idx" ON "OrganizationMembership"("role");

CREATE UNIQUE INDEX IF NOT EXISTS "TenantDomain_host_key" ON "TenantDomain"("host");
CREATE INDEX IF NOT EXISTS "TenantDomain_organizationId_idx" ON "TenantDomain"("organizationId");
CREATE INDEX IF NOT EXISTS "TenantDomain_status_idx" ON "TenantDomain"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppChannel_phoneNumberId_key" ON "WhatsAppChannel"("phoneNumberId");
CREATE INDEX IF NOT EXISTS "WhatsAppChannel_organizationId_idx" ON "WhatsAppChannel"("organizationId");
CREATE INDEX IF NOT EXISTS "WhatsAppChannel_status_idx" ON "WhatsAppChannel"("status");

CREATE INDEX IF NOT EXISTS "Vendor_organizationId_idx" ON "Vendor"("organizationId");
CREATE INDEX IF NOT EXISTS "Vendor_branchId_idx" ON "Vendor"("branchId");
CREATE INDEX IF NOT EXISTS "Student_organizationId_idx" ON "Student"("organizationId");
CREATE INDEX IF NOT EXISTS "Credit_organizationId_idx" ON "Credit"("organizationId");
CREATE INDEX IF NOT EXISTS "Credit_branchId_idx" ON "Credit"("branchId");
CREATE INDEX IF NOT EXISTS "WhatsAppSession_organizationId_idx" ON "WhatsAppSession"("organizationId");
CREATE INDEX IF NOT EXISTS "WhatsAppSession_channelId_idx" ON "WhatsAppSession"("channelId");

DO $$
BEGIN
  ALTER TABLE "Organization"
    ADD CONSTRAINT "Organization_communityId_fkey"
    FOREIGN KEY ("communityId") REFERENCES "Community"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Branch"
    ADD CONSTRAINT "Branch_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Vendor"
    ADD CONSTRAINT "Vendor_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Vendor"
    ADD CONSTRAINT "Vendor_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Student"
    ADD CONSTRAINT "Student_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Credit"
    ADD CONSTRAINT "Credit_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Credit"
    ADD CONSTRAINT "Credit_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrganizationMembership"
    ADD CONSTRAINT "OrganizationMembership_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrganizationMembership"
    ADD CONSTRAINT "OrganizationMembership_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "OrganizationMembership"
    ADD CONSTRAINT "OrganizationMembership_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "TenantDomain"
    ADD CONSTRAINT "TenantDomain_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WhatsAppChannel"
    ADD CONSTRAINT "WhatsAppChannel_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WhatsAppSession"
    ADD CONSTRAINT "WhatsAppSession_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WhatsAppSession"
    ADD CONSTRAINT "WhatsAppSession_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "WhatsAppChannel"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "Organization" ("id", "name", "slug", "type", "status", "trialEndsAt", "plan", "communityId", "createdAt", "updatedAt")
SELECT
  'org_' || v."id",
  v."businessName",
  'solo-' || v."id",
  'SOLO_VENDOR',
  CASE
    WHEN vs."status" = 'ACTIVE' THEN 'ACTIVE'::"OrganizationStatus"
    WHEN vs."status" = 'PAST_DUE' THEN 'PAST_DUE'::"OrganizationStatus"
    WHEN vs."status" = 'CANCELLED' THEN 'CANCELLED'::"OrganizationStatus"
    WHEN vs."status" = 'EXPIRED' THEN 'PAST_DUE'::"OrganizationStatus"
    ELSE 'TRIAL'::"OrganizationStatus"
  END,
  vs."trialEndsAt",
  COALESCE(vs."plan"::text, 'STARTER')::"OrganizationPlan",
  v."communityId",
  v."createdAt",
  NOW()
FROM "Vendor" v
LEFT JOIN "VendorSubscription" vs ON vs."vendorId" = v."id"
WHERE NOT EXISTS (
  SELECT 1 FROM "Organization" o WHERE o."id" = 'org_' || v."id"
);

INSERT INTO "Branch" ("id", "organizationId", "name", "code", "phone", "address", "status", "createdAt", "updatedAt")
SELECT
  'branch_' || v."id",
  'org_' || v."id",
  COALESCE(v."location", 'Main Branch'),
  'MAIN',
  v."phone",
  v."location",
  'ACTIVE',
  v."createdAt",
  NOW()
FROM "Vendor" v
WHERE NOT EXISTS (
  SELECT 1 FROM "Branch" b WHERE b."id" = 'branch_' || v."id"
);

UPDATE "Vendor" v
SET
  "organizationId" = COALESCE(v."organizationId", 'org_' || v."id"),
  "branchId" = COALESCE(v."branchId", 'branch_' || v."id")
WHERE v."organizationId" IS NULL OR v."branchId" IS NULL;

INSERT INTO "OrganizationMembership" ("id", "organizationId", "vendorId", "branchId", "role", "createdAt", "updatedAt")
SELECT
  'member_' || v."id",
  v."organizationId",
  v."id",
  v."branchId",
  'OWNER',
  v."createdAt",
  NOW()
FROM "Vendor" v
WHERE v."organizationId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "OrganizationMembership" m
    WHERE m."organizationId" = v."organizationId" AND m."vendorId" = v."id"
  );

UPDATE "Credit" c
SET
  "organizationId" = COALESCE(c."organizationId", v."organizationId"),
  "branchId" = COALESCE(c."branchId", v."branchId")
FROM "Vendor" v
WHERE c."vendorId" = v."id"
  AND (c."organizationId" IS NULL OR c."branchId" IS NULL);

UPDATE "Student" s
SET "organizationId" = owner."organizationId"
FROM (
  SELECT DISTINCT ON (c."studentId") c."studentId", c."organizationId"
  FROM "Credit" c
  WHERE c."organizationId" IS NOT NULL
  ORDER BY c."studentId", c."createdAt" ASC
) owner
WHERE s."id" = owner."studentId"
  AND s."organizationId" IS NULL;
