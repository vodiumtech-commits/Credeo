import { redirect } from "next/navigation";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { CustomersClient } from "@/components/ui/customers-client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  const students = await prisma.student.findMany({
    where: { credits: { some: { vendorId: vendor.id } } },
    include: {
      credits: {
        where: { vendorId: vendor.id },
        select: { id: true, amount: true, amountRepaid: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = students.map((s) => {
    const credits = s.credits;
    const totalOwed = credits
      .filter((c) => !["PAID", "WRITTEN_OFF"].includes(c.status))
      .reduce((sum, c) => sum + Number(c.amount) - Number(c.amountRepaid), 0);
    const hasOverdue = credits.some((c) => c.status === "OVERDUE");
    const hasDueSoon = credits.some((c) => c.status === "DUE_SOON");
    const creditStatus =
      hasOverdue ? "overdue"
      : hasDueSoon ? "due_soon"
      : totalOwed > 0 ? "owing"
      : "settled";

    return {
      id:           s.id,
      fullName:     s.fullName,
      matricNumber: s.matricNumber ?? null,
      vodiumScore:  s.vodiumScore,
      creditCount:  credits.length,
      totalOwed,
      creditStatus,
    };
  });

  return <CustomersClient rows={rows} formatNaira={formatNaira} />;
}
