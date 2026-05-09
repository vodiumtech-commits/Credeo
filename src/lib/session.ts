import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { Vendor, VendorSubscription } from "@prisma/client";

export type VendorWithSub = Vendor & { subscription: VendorSubscription | null };

/** Use only in Server Components and Route Handlers. */
export async function getVendorSession(): Promise<VendorWithSub | null> {
  const phone = cookies().get("vodium_phone")?.value;
  if (!phone) return null;
  return prisma.vendor.findUnique({
    where: { phone },
    include: { subscription: true },
  });
}

/** Returns the E.164 phone from the session cookie, or null. */
export function getSessionPhone(): string | null {
  return cookies().get("vodium_phone")?.value ?? null;
}

/** Admin check — validates the vodium_admin cookie against ADMIN_SECRET env var. */
export function isAdminSession(): boolean {
  const val = cookies().get("vodium_admin")?.value;
  return !!val && !!process.env.ADMIN_SECRET && val === process.env.ADMIN_SECRET;
}
