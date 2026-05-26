import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";

// GET /api/credits/export — returns a CSV of all credits for the authenticated vendor
export async function GET(_req: NextRequest) {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const credits = await prisma.credit.findMany({
    where: { vendorId: vendor.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Date",
    "Student Name",
    "Matric Number",
    "Description",
    "Amount (NGN)",
    "Amount Repaid (NGN)",
    "Amount Owed (NGN)",
    "Due Date",
    "Status",
  ].join(",");

  const rows = credits.map((c) => {
    const owed = Math.max(0, Number(c.amount) - Number(c.amountRepaid));
    return [
      new Date(c.createdAt).toLocaleDateString("en-GB"),
      `"${c.student.fullName.replace(/"/g, '""')}"`,
      c.student.matricNumber ?? "",
      `"${(c.description ?? "").replace(/"/g, '""')}"`,
      Number(c.amount).toFixed(2),
      Number(c.amountRepaid).toFixed(2),
      owed.toFixed(2),
      new Date(c.dueDate).toLocaleDateString("en-GB"),
      c.status,
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  const filename = `${vendor.businessName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-credits-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
