import { redirect } from "next/navigation";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { CreditsClient } from "@/components/ui/credits-client";
import type { CreditStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  const credits = await prisma.credit.findMany({
    where: { vendorId: vendor.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const outstandingAmount = credits
    .filter((c) =>
      ["OUTSTANDING", "DUE_SOON", "PARTIALLY_PAID"].includes(c.status),
    )
    .reduce((s, c) => s + Number(c.amount) - Number(c.amountRepaid), 0);
  const overdueAmount = credits
    .filter((c) => c.status === "OVERDUE")
    .reduce((s, c) => s + Number(c.amount) - Number(c.amountRepaid), 0);
  const paidAmount = credits
    .filter((c) => c.status === "PAID")
    .reduce((s, c) => s + Number(c.amount), 0);
  const totalAmount = credits.reduce((s, c) => s + Number(c.amount), 0);
  const overdueCount = credits.filter((c) => c.status === "OVERDUE").length;
  const paidCount = credits.filter((c) => c.status === "PAID").length;
  const recoveryRate =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // FIXED: Removed the undefined : CreditRow[] type to allow TypeScript inference
  const rows = credits.map((c) => ({
    id: c.id,
    amount: Number(c.amount),
    amountRepaid: Number(c.amountRepaid),
    status: c.status,
    description: c.description,
    dueDate: c.dueDate.toISOString(),
    createdAt: c.createdAt.toISOString(),
    customer: {
      id: c.student.id,
      fullName: c.student.fullName,
      customerID: c.student.matricNumber ?? null,
    },
  }));

  const stats = {
    outstandingAmount,
    overdueAmount,
    paidAmount,
    recoveryRate,
    overdueCount,
    paidCount,
    totalCount: credits.length,
  };

  // FIXED: Changed 'serialised' to 'rows'
  return <CreditsClient credits={rows} stats={stats} />;
}
