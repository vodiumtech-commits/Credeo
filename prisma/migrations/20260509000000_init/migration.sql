-- Vodium Ledger — initial schema
-- This is the canonical baseline migration that matches the running database.
-- Vendor has email (NOT NULL, UNIQUE) + passwordHash.
-- Credit has reminderSentAt.

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE "UniversityStatus" AS ENUM ('PILOT', 'ACTIVE', 'PAUSED');

CREATE TYPE "VendorType" AS ENUM (
  'PROVISION_SHOP', 'FOOD_CANTEEN', 'LAUNDRY', 'PRINTING',
  'BARBING_SALON',  'HAIR_SALON',   'PHARMACY', 'MINI_MART', 'OTHER'
);

CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TYPE "CreditStatus" AS ENUM (
  'OUTSTANDING', 'DUE_SOON', 'OVERDUE',
  'PARTIALLY_PAID', 'PAID', 'WRITTEN_OFF'
);

CREATE TYPE "RepaymentMethod" AS ENUM (
  'CASH', 'BANK_TRANSFER', 'POS', 'USSD', 'MOBILE_MONEY', 'OTHER'
);

CREATE TYPE "ScoreEventType" AS ENUM (
  'CREDIT_EXTENDED', 'PAID_ON_TIME', 'PAID_LATE',
  'PAID_PARTIAL', 'DEFAULTED', 'WRITTEN_OFF'
);

CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'GROWTH', 'CAMPUS_PRO');

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'
);

CREATE TYPE "WhatsAppState" AS ENUM (
  'IDLE', 'ONBOARDING_NAME', 'ONBOARDING_BUSINESS', 'ONBOARDING_UNIVERSITY',
  'ADDING_CREDIT_STUDENT', 'ADDING_CREDIT_AMOUNT', 'ADDING_CREDIT_DUE',
  'MARKING_PAID', 'LOOKING_UP_SCORE'
);

-- ── University ────────────────────────────────────────────────────────────────
-- name is always stored lowercase — it is the unique dedup key.

CREATE TABLE "University" (
    "id"        TEXT              NOT NULL,
    "name"      TEXT              NOT NULL,   -- lowercase, e.g. "dominion university"
    "shortName" TEXT,
    "city"      TEXT              NOT NULL,
    "state"     TEXT              NOT NULL,
    "status"    "UniversityStatus" NOT NULL DEFAULT 'PILOT',
    "createdAt" TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "University_name_key" ON "University"("name");

-- ── Vendor ────────────────────────────────────────────────────────────────────

CREATE TABLE "Vendor" (
    "id"             TEXT           NOT NULL,
    "businessName"   TEXT           NOT NULL,
    "ownerName"      TEXT           NOT NULL,
    "phone"          TEXT           NOT NULL,
    "email"          TEXT           NOT NULL,
    "passwordHash"   TEXT           NOT NULL,
    "vendorType"     "VendorType"   NOT NULL,
    "universityId"   TEXT           NOT NULL,
    "campusLocation" TEXT,
    "status"         "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)   NOT NULL,
    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Vendor_phone_key"     ON "Vendor"("phone");
CREATE UNIQUE INDEX "Vendor_email_key"     ON "Vendor"("email");
CREATE INDEX        "Vendor_universityId_idx" ON "Vendor"("universityId");
CREATE INDEX        "Vendor_phone_idx"     ON "Vendor"("phone");
CREATE INDEX        "Vendor_email_idx"     ON "Vendor"("email");

-- ── Student ───────────────────────────────────────────────────────────────────

CREATE TABLE "Student" (
    "id"             TEXT         NOT NULL,
    "fullName"       TEXT         NOT NULL,
    "matricNumber"   TEXT,
    "phone"          TEXT         NOT NULL,
    "universityId"   TEXT,
    "vodiumScore"    INTEGER      NOT NULL DEFAULT 500,
    "scoreUpdatedAt" TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Student_phone_key"        ON "Student"("phone");
CREATE INDEX        "Student_universityId_idx" ON "Student"("universityId");
CREATE INDEX        "Student_phone_idx"        ON "Student"("phone");
CREATE INDEX        "Student_matricNumber_idx" ON "Student"("matricNumber");

-- ── Credit ────────────────────────────────────────────────────────────────────

CREATE TABLE "Credit" (
    "id"             TEXT           NOT NULL,
    "vendorId"       TEXT           NOT NULL,
    "studentId"      TEXT           NOT NULL,
    "amount"         DECIMAL(12,2)  NOT NULL,
    "currency"       TEXT           NOT NULL DEFAULT 'NGN',
    "description"    TEXT,
    "dateExtended"   TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate"        TIMESTAMP(3)   NOT NULL,
    "status"         "CreditStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "amountRepaid"   DECIMAL(12,2)  NOT NULL DEFAULT 0,
    "closedAt"       TIMESTAMP(3),
    "notes"          TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "createdAt"      TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3)   NOT NULL,
    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Credit_vendorId_idx"  ON "Credit"("vendorId");
CREATE INDEX "Credit_studentId_idx" ON "Credit"("studentId");
CREATE INDEX "Credit_status_idx"    ON "Credit"("status");
CREATE INDEX "Credit_dueDate_idx"   ON "Credit"("dueDate");

-- ── Repayment ─────────────────────────────────────────────────────────────────

CREATE TABLE "Repayment" (
    "id"         TEXT               NOT NULL,
    "creditId"   TEXT               NOT NULL,
    "amount"     DECIMAL(12,2)      NOT NULL,
    "method"     "RepaymentMethod"  NOT NULL,
    "receivedAt" TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes"      TEXT,
    "recordedBy" TEXT,
    "createdAt"  TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Repayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Repayment_creditId_idx" ON "Repayment"("creditId");

-- ── CreditScoreEvent ──────────────────────────────────────────────────────────

CREATE TABLE "CreditScoreEvent" (
    "id"         TEXT             NOT NULL,
    "studentId"  TEXT             NOT NULL,
    "vendorId"   TEXT             NOT NULL,
    "creditId"   TEXT,
    "eventType"  "ScoreEventType" NOT NULL,
    "amount"     DECIMAL(12,2),
    "scoreDelta" INTEGER          NOT NULL,
    "occurredAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditScoreEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CreditScoreEvent_studentId_idx" ON "CreditScoreEvent"("studentId");
CREATE INDEX "CreditScoreEvent_vendorId_idx"  ON "CreditScoreEvent"("vendorId");
CREATE INDEX "CreditScoreEvent_eventType_idx" ON "CreditScoreEvent"("eventType");

-- ── VendorSubscription ────────────────────────────────────────────────────────

CREATE TABLE "VendorSubscription" (
    "id"                       TEXT                 NOT NULL,
    "vendorId"                 TEXT                 NOT NULL,
    "plan"                     "SubscriptionPlan"   NOT NULL,
    "status"                   "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt"              TIMESTAMP(3),
    "currentPeriodStart"       TIMESTAMP(3),
    "currentPeriodEnd"         TIMESTAMP(3),
    "paystackCustomerId"       TEXT,
    "paystackSubscriptionCode" TEXT,
    "monthlyAmount"            DECIMAL(12,2)        NOT NULL,
    "createdAt"                TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                TIMESTAMP(3)         NOT NULL,
    CONSTRAINT "VendorSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "VendorSubscription_vendorId_key" ON "VendorSubscription"("vendorId");

-- ── WhatsAppSession ───────────────────────────────────────────────────────────

CREATE TABLE "WhatsAppSession" (
    "id"                TEXT            NOT NULL,
    "phone"             TEXT            NOT NULL,
    "vendorId"          TEXT,
    "state"             "WhatsAppState" NOT NULL DEFAULT 'IDLE',
    "context"           JSONB,
    "lastInteractionAt" TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)    NOT NULL,
    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WhatsAppSession_phone_key" ON "WhatsAppSession"("phone");
CREATE INDEX        "WhatsAppSession_phone_idx" ON "WhatsAppSession"("phone");

-- ── AuditLog ──────────────────────────────────────────────────────────────────

CREATE TABLE "AuditLog" (
    "id"         TEXT         NOT NULL,
    "actorType"  TEXT         NOT NULL,
    "actorId"    TEXT,
    "action"     TEXT         NOT NULL,
    "entityType" TEXT,
    "entityId"   TEXT,
    "metadata"   JSONB,
    "ipAddress"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_actorId_idx"             ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx"           ON "AuditLog"("createdAt");

-- ── Foreign keys ──────────────────────────────────────────────────────────────

ALTER TABLE "Vendor"
  ADD CONSTRAINT "Vendor_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "University"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_universityId_fkey"
  FOREIGN KEY ("universityId") REFERENCES "University"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Credit"
  ADD CONSTRAINT "Credit_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Credit"
  ADD CONSTRAINT "Credit_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Repayment"
  ADD CONSTRAINT "Repayment_creditId_fkey"
  FOREIGN KEY ("creditId") REFERENCES "Credit"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditScoreEvent"
  ADD CONSTRAINT "CreditScoreEvent_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "Student"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditScoreEvent"
  ADD CONSTRAINT "CreditScoreEvent_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditScoreEvent"
  ADD CONSTRAINT "CreditScoreEvent_creditId_fkey"
  FOREIGN KEY ("creditId") REFERENCES "Credit"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VendorSubscription"
  ADD CONSTRAINT "VendorSubscription_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
