import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";
import { csvResponse, exportFilename, toCsv } from "@/lib/csv";

// GET /api/ledger/export — CSV of the tenant's wallet ledger, scoped to the
// caller's branch visibility.
export async function GET() {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId || !ctx.organization) {
    return NextResponse.json({ error: "Organization is not ready for reports." }, { status: 400 });
  }

  const where = ctx.canSeeAllBranches
    ? { organizationId: ctx.organizationId }
    : { organizationId: ctx.organizationId, branchId: ctx.branchId };

  const entries = await prisma.walletLedgerEntry.findMany({
    where,
    include: { branch: true, vendor: { select: { businessName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Date",
    "Type",
    "Direction",
    "Amount (NGN)",
    "Branch",
    "Recorded By",
    "Source",
    "Description",
  ];

  const rows = entries.map((entry) => [
    new Date(entry.createdAt).toISOString(),
    entry.entryType,
    entry.direction,
    Number(entry.amount).toFixed(2),
    entry.branch?.name ?? "All branches",
    entry.vendor?.businessName ?? "",
    entry.sourceType,
    entry.description ?? "",
  ]);

  const csv = toCsv(header, rows);
  return csvResponse(csv, exportFilename(ctx.organization.name, "ledger"));
}
