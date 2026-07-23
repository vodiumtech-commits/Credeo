-- Vendor payout details, shown to customers on reminders so they can pay
-- immediately instead of asking the vendor for an account number.
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "bankName"          TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT;
ALTER TABLE "Vendor" ADD COLUMN IF NOT EXISTS "bankAccountName"   TEXT;
