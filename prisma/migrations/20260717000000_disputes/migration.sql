-- Customer disputes: recourse when a credit is logged against the wrong person.

-- 1) Status enum
DO $$
BEGIN
  CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'UPHELD', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Dispute
CREATE TABLE IF NOT EXISTS "Dispute" (
  "id"             TEXT NOT NULL,
  "creditId"       TEXT NOT NULL,
  "studentId"      TEXT NOT NULL,
  "vendorId"       TEXT NOT NULL,
  "organizationId" TEXT,
  "reason"         TEXT,
  "status"         "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolution"     TEXT,
  "handledById"    TEXT,
  "handledAt"      TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Dispute_status_idx"    ON "Dispute"("status");
CREATE INDEX IF NOT EXISTS "Dispute_vendorId_idx"  ON "Dispute"("vendorId");
CREATE INDEX IF NOT EXISTS "Dispute_studentId_idx" ON "Dispute"("studentId");
CREATE INDEX IF NOT EXISTS "Dispute_creditId_idx"  ON "Dispute"("creditId");
CREATE INDEX IF NOT EXISTS "Dispute_createdAt_idx" ON "Dispute"("createdAt");

DO $$
BEGIN
  ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_creditId_fkey"
    FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
