import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import path from "path";

// Re-apply .env.local on every module evaluation so the correct DATABASE_URL
// is always in process.env, even after a hot-reload without a full restart.
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
config({ path: path.resolve(process.cwd(), ".env") });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDbUrl: string | undefined;
};

// Invalidate the singleton if DATABASE_URL changed (e.g., env file was updated).
const currentUrl = process.env.DATABASE_URL;
if (globalForPrisma.prismaDbUrl && globalForPrisma.prismaDbUrl !== currentUrl) {
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma    = prisma;
  globalForPrisma.prismaDbUrl = currentUrl;
}
