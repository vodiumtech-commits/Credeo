import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";
import { csvResponse, exportFilename, toCsv } from "@/lib/csv";

// GET /api/bnpl/orders/export — CSV of the tenant's BNPL orders, scoped to the
// caller's branch visibility.
export async function GET() {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId || !ctx.organization) {
    return NextResponse.json({ error: "Organization is not ready for reports." }, { status: 400 });
  }

  const where = ctx.canSeeAllBranches
    ? { organizationId: ctx.organizationId }
    : { organizationId: ctx.organizationId, branchId: ctx.branchId };

  const orders = await prisma.bnplOrder.findMany({
    where,
    include: { branch: true, student: true, credit: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Date",
    "Order Number",
    "Customer",
    "Customer Phone",
    "Branch",
    "Status",
    "Subtotal (NGN)",
    "Discount (NGN)",
    "Total (NGN)",
    "Down Payment (NGN)",
    "Outstanding (NGN)",
    "Coupon",
    "Due Date",
  ];

  const rows = orders.map((order) => {
    const outstanding = order.credit
      ? Math.max(0, Number(order.credit.amount) - Number(order.credit.amountRepaid))
      : 0;
    return [
      new Date(order.createdAt).toISOString(),
      order.orderNumber,
      order.student.fullName,
      order.student.phone,
      order.branch?.name ?? "Unassigned",
      order.status,
      Number(order.subtotal).toFixed(2),
      Number(order.discountAmount).toFixed(2),
      Number(order.totalAmount).toFixed(2),
      Number(order.downPayment).toFixed(2),
      outstanding.toFixed(2),
      order.couponCode ?? "",
      new Date(order.dueDate).toISOString(),
    ];
  });

  const csv = toCsv(header, rows);
  return csvResponse(csv, exportFilename(ctx.organization.name, "bnpl-orders"));
}
