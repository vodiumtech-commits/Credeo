-- Track overdue reminder cadence separately from pre-due reminders.
ALTER TABLE "Credit"
  ADD COLUMN IF NOT EXISTS "overdueReminderSentAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Credit_overdueReminderSentAt_idx"
  ON "Credit"("overdueReminderSentAt");
