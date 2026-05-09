-- CreateEnum
CREATE TYPE "UniversityStatus" AS ENUM ('PILOT', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('PROVISION_SHOP', 'FOOD_CANTEEN', 'LAUNDRY', 'PRINTING', 'BARBING_SALON', 'HAIR_SALON', 'PHARMACY', 'MINI_MART', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('OUTSTANDING', 'DUE_SOON', 'OVERDUE', 'PARTIALLY_PAID', 'PAID', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "RepaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'POS', 'USSD', 'MOBILE_MONEY', 'OTHER');

-- CreateEnum
CREATE TYPE "ScoreEventType" AS ENUM ('CREDIT_EXTENDED', 'PAID_ON_TIME', 'PAID_LATE', 'PAID_PARTIAL', 'DEFAULTED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'GROWTH', 'CAMPUS_PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WhatsAppState" AS ENUM ('IDLE', 'ONBOARDING_NAME', 'ONBOARDING_BUSINESS', 'ONBOARDING_UNIVERSITY', 'ADDING_CREDIT_STUDENT', 'ADDING_CREDIT_AMOUNT', 'ADDING_CREDIT_DUE', 'MARKING_PAID', 'LOOKING_UP_SCORE');

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" "UniversityStatus" NOT NULL DEFAULT 'PILOT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "vendorType" "VendorType" NOT NULL,
    "universityId" TEXT NOT NULL,
    "campusLocation" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "matricNumber" TEXT,
    "phone" TEXT NOT NULL,
    "universityId" TEXT,
    "vodiumScore" INTEGER NOT NULL DEFAULT 500,
    "scoreUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "description" TEXT,
    "dateExtended" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "CreditStatus" NOT NULL DEFAULT 'OUTSTANDING',
    "amountRepaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repayment" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "RepaymentMethod" NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Repayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditScoreEvent" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "creditId" TEXT,
    "eventType" "ScoreEventType" NOT NULL,
    "amount" DECIMAL(12,2),
    "scoreDelta" INTEGER NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSubscription" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "paystackCustomerId" TEXT,
    "paystackSubscriptionCode" TEXT,
    "monthlyAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vendorId" TEXT,
    "state" "WhatsAppState" NOT NULL DEFAULT 'IDLE',
    "context" JSONB,
    "lastInteractionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "University_name_key" ON "University"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_phone_key" ON "Vendor"("phone");

-- CreateIndex
CREATE INDEX "Vendor_universityId_idx" ON "Vendor"("universityId");

-- CreateIndex
CREATE INDEX "Vendor_phone_idx" ON "Vendor"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Student_phone_key" ON "Student"("phone");

-- CreateIndex
CREATE INDEX "Student_universityId_idx" ON "Student"("universityId");

-- CreateIndex
CREATE INDEX "Student_phone_idx" ON "Student"("phone");

-- CreateIndex
CREATE INDEX "Student_matricNumber_idx" ON "Student"("matricNumber");

-- CreateIndex
CREATE INDEX "Credit_vendorId_idx" ON "Credit"("vendorId");

-- CreateIndex
CREATE INDEX "Credit_studentId_idx" ON "Credit"("studentId");

-- CreateIndex
CREATE INDEX "Credit_status_idx" ON "Credit"("status");

-- CreateIndex
CREATE INDEX "Credit_dueDate_idx" ON "Credit"("dueDate");

-- CreateIndex
CREATE INDEX "Repayment_creditId_idx" ON "Repayment"("creditId");

-- CreateIndex
CREATE INDEX "CreditScoreEvent_studentId_idx" ON "CreditScoreEvent"("studentId");

-- CreateIndex
CREATE INDEX "CreditScoreEvent_vendorId_idx" ON "CreditScoreEvent"("vendorId");

-- CreateIndex
CREATE INDEX "CreditScoreEvent_eventType_idx" ON "CreditScoreEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSubscription_vendorId_key" ON "VendorSubscription"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_phone_key" ON "WhatsAppSession"("phone");

-- CreateIndex
CREATE INDEX "WhatsAppSession_phone_idx" ON "WhatsAppSession"("phone");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repayment" ADD CONSTRAINT "Repayment_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScoreEvent" ADD CONSTRAINT "CreditScoreEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScoreEvent" ADD CONSTRAINT "CreditScoreEvent_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditScoreEvent" ADD CONSTRAINT "CreditScoreEvent_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSubscription" ADD CONSTRAINT "VendorSubscription_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

