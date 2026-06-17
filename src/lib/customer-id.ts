import { prisma } from "@/lib/prisma";

export function vendorCustomerPrefix(businessName: string): string {
  const letters = businessName.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return (letters.slice(0, 3) || "CUS").padEnd(3, "X");
}

export async function nextVendorCustomerId(vendorId: string, businessName: string): Promise<string> {
  const prefix = vendorCustomerPrefix(businessName);
  const existingCount = await prisma.student.count({
    where: { credits: { some: { vendorId } } },
  });

  return `${prefix}${String(existingCount + 1).padStart(3, "0")}`;
}
