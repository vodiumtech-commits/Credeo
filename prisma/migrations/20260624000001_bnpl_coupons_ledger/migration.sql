-- Enterprise BNPL, coupons, payment mandates, and internal ledger.

DO $$
BEGIN
  CREATE TYPE "BnplOrderStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'WRITTEN_OFF');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "RepaymentScheduleStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "PaymentMandateStatus" AS ENUM ('PENDING', 'ACTIVE', 'FAILED', 'REVOKED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CouponDiscountType" AS ENUM ('FIXED', 'PERCENTAGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LedgerEntryType" AS ENUM ('BNPL_ISSUED', 'PAYMENT_RECEIVED', 'COUPON_DISCOUNT', 'REFUND', 'ADJUSTMENT', 'SETTLEMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BnplOrder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT,
  "vendorId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "creditId" TEXT,
  "orderNumber" TEXT NOT NULL,
  "status" "BnplOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal" DECIMAL(12,2) NOT NULL,
  "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "downPayment" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "dueDate" TIMESTAMP(3) NOT NULL,
  "termsAcceptedAt" TIMESTAMP(3),
  "couponCode" TEXT,
  "paymentReference" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BnplOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BnplOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "totalPrice" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BnplOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RepaymentSchedule" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "status" "RepaymentScheduleStatus" NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP(3),
  "providerReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RepaymentSchedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentMandate" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "status" "PaymentMandateStatus" NOT NULL DEFAULT 'PENDING',
  "customerReference" TEXT,
  "authorizationReference" TEXT,
  "mandateReference" TEXT,
  "reusable" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentMandate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponCampaign" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "type" "CouponDiscountType" NOT NULL,
  "value" DECIMAL(12,2) NOT NULL,
  "minimumSpend" DECIMAL(12,2),
  "maxRedemptions" INTEGER,
  "perCustomerLimit" INTEGER,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endsAt" TIMESTAMP(3),
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CouponRedemption" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "orderId" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WalletLedgerEntry" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT,
  "vendorId" TEXT,
  "entryType" "LedgerEntryType" NOT NULL,
  "direction" "LedgerDirection" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "description" TEXT,
  "balanceAfter" DECIMAL(12,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BnplOrder_organizationId_orderNumber_key" ON "BnplOrder"("organizationId", "orderNumber");
CREATE INDEX IF NOT EXISTS "BnplOrder_organizationId_idx" ON "BnplOrder"("organizationId");
CREATE INDEX IF NOT EXISTS "BnplOrder_branchId_idx" ON "BnplOrder"("branchId");
CREATE INDEX IF NOT EXISTS "BnplOrder_vendorId_idx" ON "BnplOrder"("vendorId");
CREATE INDEX IF NOT EXISTS "BnplOrder_studentId_idx" ON "BnplOrder"("studentId");
CREATE INDEX IF NOT EXISTS "BnplOrder_creditId_idx" ON "BnplOrder"("creditId");
CREATE INDEX IF NOT EXISTS "BnplOrder_status_idx" ON "BnplOrder"("status");
CREATE INDEX IF NOT EXISTS "BnplOrder_dueDate_idx" ON "BnplOrder"("dueDate");

CREATE INDEX IF NOT EXISTS "BnplOrderItem_orderId_idx" ON "BnplOrderItem"("orderId");

CREATE INDEX IF NOT EXISTS "RepaymentSchedule_orderId_idx" ON "RepaymentSchedule"("orderId");
CREATE INDEX IF NOT EXISTS "RepaymentSchedule_status_idx" ON "RepaymentSchedule"("status");
CREATE INDEX IF NOT EXISTS "RepaymentSchedule_dueAt_idx" ON "RepaymentSchedule"("dueAt");

CREATE INDEX IF NOT EXISTS "PaymentMandate_organizationId_idx" ON "PaymentMandate"("organizationId");
CREATE INDEX IF NOT EXISTS "PaymentMandate_studentId_idx" ON "PaymentMandate"("studentId");
CREATE INDEX IF NOT EXISTS "PaymentMandate_provider_idx" ON "PaymentMandate"("provider");
CREATE INDEX IF NOT EXISTS "PaymentMandate_status_idx" ON "PaymentMandate"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "CouponCampaign_organizationId_code_key" ON "CouponCampaign"("organizationId", "code");
CREATE INDEX IF NOT EXISTS "CouponCampaign_organizationId_idx" ON "CouponCampaign"("organizationId");
CREATE INDEX IF NOT EXISTS "CouponCampaign_branchId_idx" ON "CouponCampaign"("branchId");
CREATE INDEX IF NOT EXISTS "CouponCampaign_active_idx" ON "CouponCampaign"("active");
CREATE INDEX IF NOT EXISTS "CouponCampaign_endsAt_idx" ON "CouponCampaign"("endsAt");

CREATE INDEX IF NOT EXISTS "CouponRedemption_organizationId_idx" ON "CouponRedemption"("organizationId");
CREATE INDEX IF NOT EXISTS "CouponRedemption_campaignId_idx" ON "CouponRedemption"("campaignId");
CREATE INDEX IF NOT EXISTS "CouponRedemption_studentId_idx" ON "CouponRedemption"("studentId");
CREATE INDEX IF NOT EXISTS "CouponRedemption_orderId_idx" ON "CouponRedemption"("orderId");

CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_organizationId_idx" ON "WalletLedgerEntry"("organizationId");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_branchId_idx" ON "WalletLedgerEntry"("branchId");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_vendorId_idx" ON "WalletLedgerEntry"("vendorId");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_entryType_idx" ON "WalletLedgerEntry"("entryType");
CREATE INDEX IF NOT EXISTS "WalletLedgerEntry_createdAt_idx" ON "WalletLedgerEntry"("createdAt");

DO $$
BEGIN
  ALTER TABLE "BnplOrder" ADD CONSTRAINT "BnplOrder_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "BnplOrder" ADD CONSTRAINT "BnplOrder_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "BnplOrder" ADD CONSTRAINT "BnplOrder_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "BnplOrder" ADD CONSTRAINT "BnplOrder_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "BnplOrder" ADD CONSTRAINT "BnplOrder_creditId_fkey"
    FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "BnplOrderItem" ADD CONSTRAINT "BnplOrderItem_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "BnplOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "RepaymentSchedule" ADD CONSTRAINT "RepaymentSchedule_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "BnplOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "PaymentMandate" ADD CONSTRAINT "PaymentMandate_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "PaymentMandate" ADD CONSTRAINT "PaymentMandate_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponCampaign" ADD CONSTRAINT "CouponCampaign_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponCampaign" ADD CONSTRAINT "CouponCampaign_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "CouponCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "BnplOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
