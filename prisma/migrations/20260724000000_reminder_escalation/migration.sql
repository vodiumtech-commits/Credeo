-- Track whether a customer responded to a reminder, and whether we've already
-- sent the firmer follow-up, so escalation fires at most once per credit.
ALTER TABLE "Credit" ADD COLUMN IF NOT EXISTS "reminderRespondedAt" TIMESTAMP(3);
ALTER TABLE "Credit" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
-- The escalation sweep filters on these; keep it cheap as the ledger grows.
CREATE INDEX IF NOT EXISTS "Credit_escalatedAt_idx" ON "Credit"("escalatedAt");
