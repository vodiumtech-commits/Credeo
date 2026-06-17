import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { VendorStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

// PATCH /api/admin/vendors/[id] — suspend / reactivate
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    const updated = await prisma.vendor.update({
      where: { id: params.id },
      data:  { status: parsed.data.status as VendorStatus },
      select: { id: true, status: true, businessName: true },
    });

    return NextResponse.json({ ok: true, vendor: updated });
  } catch (err) {
    console.error("[admin/vendors/patch]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/admin/vendors/[id] — hard delete with cascade
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      select: { id: true, businessName: true, _count: { select: { credits: true } } },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

    // Hard delete in FK-safe order inside a transaction
    await prisma.$transaction([
      // 1. Score events that reference this vendor's credits
      prisma.creditScoreEvent.deleteMany({ where: { vendorId: params.id } }),
      // 2. Notifications owned by this vendor
      prisma.notification.deleteMany({ where: { vendorId: params.id } }),
      // 3. Repayments for this vendor's credits
      prisma.repayment.deleteMany({
        where: { credit: { vendorId: params.id } },
      }),
      // 4. Credits
      prisma.credit.deleteMany({ where: { vendorId: params.id } }),
      // 5. Subscription
      prisma.vendorSubscription.deleteMany({ where: { vendorId: params.id } }),
      // 6. WhatsApp session (vendorId not FK but clean up anyway)
      prisma.whatsAppSession.deleteMany({ where: { vendorId: params.id } }),
      // 7. Vendor
      prisma.vendor.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ ok: true, deleted: vendor.businessName });
  } catch (err) {
    console.error("[admin/vendors/delete]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
