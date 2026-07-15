-- Per-credit reminder opt-out: the vendor chooses, while adding a credit,
-- whether the customer receives reminder messages for it.
ALTER TABLE "Credit" ADD COLUMN IF NOT EXISTS "remindersEnabled" BOOLEAN NOT NULL DEFAULT true;

-- New WhatsApp conversation state for the "should I remind them?" question.
ALTER TYPE "WhatsAppState" ADD VALUE IF NOT EXISTS 'ADDING_CREDIT_REMINDER';
