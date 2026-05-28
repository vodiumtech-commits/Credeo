import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// In dev: re-apply .env.local so hot-reloads pick up the correct DATABASE_URL
// without a full process restart. In production (Vercel) these files don't exist
// so dotenv silently no-ops and Vercel's own env vars are used.
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
config({ path: path.resolve(process.cwd(), ".env") });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDbUrl: string | undefined;
};

// Invalidate the cached client if DATABASE_URL changed (dev hot-reload after .env edit).
const currentUrl = process.env.DATABASE_URL;
if (globalForPrisma.prismaDbUrl && globalForPrisma.prismaDbUrl !== currentUrl) {
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

// Cache in ALL environments — Vercel warm instances reuse the same process,
// so the singleton prevents exhausting the connection pool between requests.
globalForPrisma.prisma    = prisma;
globalForPrisma.prismaDbUrl = currentUrl;
