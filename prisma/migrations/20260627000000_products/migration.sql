-- Storefront product catalog.

CREATE TABLE IF NOT EXISTS "Product" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId"       TEXT,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "sku"            TEXT,
  "price"          DECIMAL(12,2) NOT NULL,
  "imageUrl"       TEXT,
  "active"         BOOLEAN NOT NULL DEFAULT true,
  "bnplEligible"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX IF NOT EXISTS "Product_branchId_idx" ON "Product"("branchId");
CREATE INDEX IF NOT EXISTS "Product_active_idx" ON "Product"("active");

DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
