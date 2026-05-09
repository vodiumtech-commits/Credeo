import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";
import type { RepaymentMethod } from "@prisma/client";

const schema = z.object({
  creditId: z.string().cuid(),
  amount:   z.number().positive(),
  method:   z.string().optional(),
  notes:    z.string().max(300).optional(),
});

// POST /api/repayments — shortcut to PATCH /api/credits/[id] for simple payment recording
export async function POST(req: NextRequest) {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { creditId, amount, method, notes } = parsed.data;

  const credit = await prisma.credit.findFirst({
    where: { id: creditId, vendorId: vendor.id },
  });
  if (!credit) return NextResponse.json({ error: "Credit not found" }, { status: 404 });

  const repayment = await prisma.repayment.create({
    data: {
      creditId,
      amount,
      method: (method as RepaymentMethod) ?? "CASH",
      notes: notes ?? null,
    },
  });

  const totalRepaid = Number(credit.amountRepaid) + amount;
  const isPaidFull = totalRepaid >= Number(credit.amount);

  await prisma.credit.update({
    where: { id: creditId },
    data: {
      amountRepaid: totalRepaid,
      status: isPaidFull ? "PAID" : "PARTIALLY_PAID",
      ...(isPaidFull ? { closedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ ok: true, repayment }, { status: 201 });
}
