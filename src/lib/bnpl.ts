import { prisma } from "@/lib/prisma";
import { normalisePhone } from "@/lib/utils";
import { nextVendorCustomerId } from "@/lib/customer-id";
import type { CouponCampaign } from "@prisma/client";

type OrderItemInput = {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
};

export function nextOrderNumber(prefix = "BNPL") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

/** Round to 2 decimal places (kobo) to avoid floating-point drift on money. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateItemsTotal(items: OrderItemInput[]) {
  return roundMoney(items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
}

export function calculateCouponDiscount(coupon: CouponCampaign, subtotal: number) {
  if (coupon.minimumSpend && subtotal < Number(coupon.minimumSpend)) return 0;
  if (coupon.type === "FIXED") return Math.min(subtotal, Number(coupon.value));
  return Math.min(subtotal, Math.round((subtotal * Number(coupon.value)) / 100));
}

export async function getOrCreateCustomerForVendor(input: {
  vendorId: string;
  vendorBusinessName: string;
  communityId: string | null;
  organizationId: string | null;
  fullName: string;
  phone: string;
  /** The acting vendor's own phone — used only to block self-credit. */
  actingVendorPhone?: string | null;
}) {
  const phone = normalisePhone(input.phone);
  if (!phone) throw new Error("Enter a valid customer phone number.");

  // A vendor can be a debtor at another shop — the customer graph is shared by
  // phone. The one thing we forbid is a vendor logging a credit against their
  // OWN number: you don't extend credit to yourself, and allowing it would let
  // a vendor inflate their own Vodium score.
  const ownPhone = input.actingVendorPhone ? normalisePhone(input.actingVendorPhone) : null;
  if (ownPhone && ownPhone === phone) {
    throw new Error("You can't log a credit against your own number.");
  }

  const existing = await prisma.student.findUnique({ where: { phone } });
  const generatedId = await nextVendorCustomerId(input.vendorId, input.vendorBusinessName);

  if (existing) {
    if (existing.fullName.trim().toLowerCase() !== input.fullName.trim().toLowerCase()) {
      throw new Error(`This phone number is already saved for ${existing.fullName}. Use that customer name or another phone number.`);
    }
    if (!existing.matricNumber || !existing.organizationId) {
      return prisma.student.update({
        where: { id: existing.id },
        data: {
          matricNumber: existing.matricNumber ?? generatedId,
          organizationId: existing.organizationId ?? input.organizationId,
        },
      });
    }
    return existing;
  }

  return prisma.student.create({
    data: {
      fullName: input.fullName,
      phone,
      matricNumber: generatedId,
      communityId: input.communityId,
      organizationId: input.organizationId,
    },
  });
}
