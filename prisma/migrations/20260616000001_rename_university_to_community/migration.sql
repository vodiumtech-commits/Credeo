-- Move the data model from campus-only language to vendor communities.
-- This keeps existing data and makes databases created from the old migrations
-- match the current Prisma schema.

DO $$
BEGIN
  IF to_regclass('"Community"') IS NULL AND to_regclass('"University"') IS NOT NULL THEN
    ALTER TABLE "University" RENAME TO "Community";
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UniversityStatus')
     AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CommunityStatus') THEN
    ALTER TYPE "UniversityStatus" RENAME TO "CommunityStatus";
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Vendor' AND column_name = 'universityId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Vendor' AND column_name = 'communityId'
  ) THEN
    ALTER TABLE "Vendor" RENAME COLUMN "universityId" TO "communityId";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Vendor' AND column_name = 'campusLocation'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Vendor' AND column_name = 'location'
  ) THEN
    ALTER TABLE "Vendor" RENAME COLUMN "campusLocation" TO "location";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Student' AND column_name = 'universityId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Student' AND column_name = 'communityId'
  ) THEN
    ALTER TABLE "Student" RENAME COLUMN "universityId" TO "communityId";
  END IF;
END$$;

ALTER INDEX IF EXISTS "University_pkey" RENAME TO "Community_pkey";
ALTER INDEX IF EXISTS "University_name_key" RENAME TO "Community_name_key";
ALTER INDEX IF EXISTS "Vendor_universityId_idx" RENAME TO "Vendor_communityId_idx";
ALTER INDEX IF EXISTS "Student_universityId_idx" RENAME TO "Student_communityId_idx";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Vendor' AND constraint_name = 'Vendor_universityId_fkey'
  ) THEN
    ALTER TABLE "Vendor" RENAME CONSTRAINT "Vendor_universityId_fkey" TO "Vendor_communityId_fkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'Student' AND constraint_name = 'Student_universityId_fkey'
  ) THEN
    ALTER TABLE "Student" RENAME CONSTRAINT "Student_universityId_fkey" TO "Student_communityId_fkey";
  END IF;
END$$;
