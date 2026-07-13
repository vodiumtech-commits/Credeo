import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";
import { signInvoiceToken } from "@/lib/bnpl-token";
import { InvoicesClient, type InvoiceRow } from "@/components/ui/invoices-client";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const ctx = await requireTenantContext();

  const invoices = ctx.organizationId
    ? await prisma.invoice.findMany({
        where: ctx.canSeeAllBranches
          ? { organizationId: ctx.organizationId }
          : { organizationId: ctx.organizationId, branchId: ctx.branchId },
        include: { student: true, branch: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  const rows: InvoiceRow[] = invoices.map((inv) => {
    const total = Number(inv.total);
    const outstanding = Math.max(0, total - Number(inv.amountPaid));
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.student.fullName,
      branchName: inv.branch?.name ?? "—",
      status: inv.status,
      total,
      outstanding,
      dueDate: inv.dueDate.toISOString(),
      sent: Boolean(inv.sentAt),
      publicPath: `/invoice/${signInvoiceToken(inv.id)}`,
    };
  });

  const branches = ctx.organization?.branches.map((b) => ({ id: b.id, name: b.name, code: b.code })) ?? [];

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <InvoicesClient
        invoices={rows}
        branches={branches}
        canWrite={ctx.canWrite && Boolean(ctx.organizationId)}
        canSeeAllBranches={ctx.canSeeAllBranches}
        defaultBranchId={ctx.branchId}
      />
    </div>
  );
}
