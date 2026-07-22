-- Remember customers whose WhatsApp is permanently undeliverable (blocked the
-- bot / not a WhatsApp user) so reminders stop retrying them forever.
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "whatsappBlockedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Student_whatsappBlockedAt_idx" ON "Student"("whatsappBlockedAt");
