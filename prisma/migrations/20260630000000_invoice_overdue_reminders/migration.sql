-- Track when an overdue-invoice reminder was last sent (throttles reminders).

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "overdueReminderSentAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Invoice_overdueReminderSentAt_idx" ON "Invoice"("overdueReminderSentAt");
