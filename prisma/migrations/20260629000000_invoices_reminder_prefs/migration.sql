-- Merchant reminder preferences + digital invoices.

-- 1) Reminder opt-in/out per organization
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "preDueRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "overdueRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;

-- 2) Invoice status enum
DO $$
BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) Invoice
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId"       TEXT,
  "vendorId"       TEXT NOT NULL,
  "studentId"      TEXT NOT NULL,
  "invoiceNumber"  TEXT NOT NULL,
  "status"         "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "subtotal"       DECIMAL(12,2) NOT NULL,
  "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total"          DECIMAL(12,2) NOT NULL,
  "amountPaid"     DECIMAL(12,2) NOT NULL DEFAULT 0,
  "currency"       TEXT NOT NULL DEFAULT 'NGN',
  "dueDate"        TIMESTAMP(3) NOT NULL,
  "notes"          TEXT,
  "sentAt"         TIMESTAMP(3),
  "paidAt"         TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_organizationId_invoiceNumber_key" ON "Invoice"("organizationId", "invoiceNumber");
CREATE INDEX IF NOT EXISTS "Invoice_organizationId_idx" ON "Invoice"("organizationId");
CREATE INDEX IF NOT EXISTS "Invoice_vendorId_idx" ON "Invoice"("vendorId");
CREATE INDEX IF NOT EXISTS "Invoice_studentId_idx" ON "Invoice"("studentId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- 4) InvoiceItem
CREATE TABLE IF NOT EXISTS "InvoiceItem" (
  "id"         TEXT NOT NULL,
  "invoiceId"  TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "quantity"   INTEGER NOT NULL DEFAULT 1,
  "unitPrice"  DECIMAL(12,2) NOT NULL,
  "totalPrice" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- 5) Foreign keys
DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
