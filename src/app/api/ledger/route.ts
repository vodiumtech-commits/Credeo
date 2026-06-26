import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";

export async function GET() {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId) return NextResponse.json({ entries: [], summary: null });

  const where = ctx.canSeeAllBranches
    ? { organizationId: ctx.organizationId }
    : { organizationId: ctx.organizationId, branchId: ctx.branchId };

  const entries = await prisma.walletLedgerEntry.findMany({
    where,
    include: { branch: true, vendor: { select: { businessName: true, ownerName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const summary = entries.reduce(
    (acc, entry) => {
      const amount = Number(entry.amount);
      if (entry.direction === "CREDIT") acc.credit += amount;
      if (entry.direction === "DEBIT") acc.debit += amount;
      acc.net = acc.credit - acc.debit;
      return acc;
    },
    { credit: 0, debit: 0, net: 0 }
  );

  return NextResponse.json({ entries, summary });
}
