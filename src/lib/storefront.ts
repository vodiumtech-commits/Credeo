import { prisma } from "@/lib/prisma";
import { normalisePhone } from "@/lib/utils";

/** The vendor to attribute storefront-originated orders/credits to (org owner). */
export async function getOrgOwnerVendorId(organizationId: string): Promise<string | null> {
  const owner = await prisma.organizationMembership.findFirst({
    where: { organizationId, role: "OWNER" },
    select: { vendorId: true },
  });
  if (owner) return owner.vendorId;
  const any = await prisma.organizationMembership.findFirst({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: { vendorId: true },
  });
  return any?.vendorId ?? null;
}

/** Find or create the customer (Student) for a storefront order, scoped to the org. */
export async function getOrCreateStorefrontCustomer(input: {
  organizationId: string;
  communityId: string | null;
  fullName: string;
  phone: string;
}) {
  const phone = normalisePhone(input.phone);
  if (!phone) throw new Error("Enter a valid phone number.");

  // A phone that belongs to a vendor account can't be a customer.
  const vendorOwner = await prisma.vendor.findUnique({ where: { phone }, select: { id: true } });
  if (vendorOwner) throw new Error("This phone number belongs to a staff account.");

  const existing = await prisma.student.findUnique({ where: { phone } });
  if (existing) {
    if (!existing.organizationId) {
      return prisma.student.update({
        where: { id: existing.id },
        data: { organizationId: input.organizationId },
      });
    }
    return existing;
  }

  return prisma.student.create({
    data: {
      fullName: input.fullName.trim(),
      phone,
      communityId: input.communityId,
      organizationId: input.organizationId,
    },
  });
}
