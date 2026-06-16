-- Align existing databases with the current SubscriptionPlan enum in Prisma.
-- Existing rows using CAMPUS_PRO are preserved by renaming the enum value.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'CAMPUS_PRO'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionPlan' AND e.enumlabel = 'PRO'
  ) THEN
    ALTER TYPE "SubscriptionPlan" RENAME VALUE 'CAMPUS_PRO' TO 'PRO';
  END IF;
END$$;
