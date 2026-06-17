-- Ensure vendor contact identifiers are unique in databases that predate
-- the current Prisma schema or were manually repaired.
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_phone_key" ON "Vendor"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_email_key" ON "Vendor"("email");
