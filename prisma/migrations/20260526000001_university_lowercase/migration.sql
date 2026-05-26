-- Migration: normalise University.name to lowercase
--
-- Applied to an existing database that was set up with the correct schema
-- (Vendor has email + passwordHash, Credit has reminderSentAt) but whose
-- University.name values may contain mixed or upper-case text.
--
-- After this migration every University row has name = LOWER(TRIM(name)).
-- New registrations from the app already normalise before writing, so this
-- is a one-time backfill.  No structural changes — only data updates.
--
-- Safe to run multiple times (LOWER of an already-lowercase string is a no-op).

-- ── Step 1: detect any columns the original init migration left out ───────────
-- These are guarded with IF NOT EXISTS so they are no-ops on a DB that already
-- has them (e.g. a DB rebuilt from the new init migration above).

ALTER TABLE "Vendor"
  ADD COLUMN IF NOT EXISTS "email"        TEXT,
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

-- Make email NOT NULL once all rows have a value (safe on empty / new DBs).
-- On an existing DB that ran the manual reset these are already NOT NULL.
DO $$
BEGIN
  -- email: set a placeholder for any NULL rows created by the original init
  UPDATE "Vendor" SET "email" = CONCAT(id, '@placeholder.vodium.app') WHERE "email" IS NULL;
  ALTER TABLE "Vendor" ALTER COLUMN "email" SET NOT NULL;
EXCEPTION WHEN others THEN NULL; -- already NOT NULL, skip
END$$;

DO $$
BEGIN
  UPDATE "Vendor" SET "passwordHash" = '$2a$12$placeholder000000000000000000000000000000000000000000' WHERE "passwordHash" IS NULL;
  ALTER TABLE "Vendor" ALTER COLUMN "passwordHash" SET NOT NULL;
EXCEPTION WHEN others THEN NULL; -- already NOT NULL, skip
END$$;

-- email unique index (guard so it's idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_email_key" ON "Vendor"("email");
CREATE INDEX        IF NOT EXISTS "Vendor_email_idx" ON "Vendor"("email");

-- reminderSentAt on Credit
ALTER TABLE "Credit"
  ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);

-- ── Step 2: lowercase all existing University names ───────────────────────────
UPDATE "University"
SET    "name" = LOWER(TRIM("name"));

-- ── Step 3: resolve duplicates created by lowercasing ────────────────────────
-- E.g. if "UNILAG" and "unilag" both existed, keep the oldest, re-point FKs.

-- 3a. Re-point Vendor.universityId
UPDATE "Vendor" v
SET    "universityId" = survivor.id
FROM (
  SELECT DISTINCT ON ("name") id, "name"
  FROM   "University"
  ORDER  BY "name", "createdAt" ASC
) survivor
JOIN "University" dup
  ON  dup."name" = survivor."name"
  AND dup.id    <> survivor.id
WHERE v."universityId" = dup.id;

-- 3b. Re-point Student.universityId
UPDATE "Student" s
SET    "universityId" = survivor.id
FROM (
  SELECT DISTINCT ON ("name") id, "name"
  FROM   "University"
  ORDER  BY "name", "createdAt" ASC
) survivor
JOIN "University" dup
  ON  dup."name" = survivor."name"
  AND dup.id    <> survivor.id
WHERE s."universityId" = dup.id;

-- 3c. Delete duplicate rows
DELETE FROM "University"
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY "name"
             ORDER BY     "createdAt" ASC
           ) AS rn
    FROM "University"
  ) ranked
  WHERE rn > 1
);
