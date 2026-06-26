import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, ReceiptText, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { assertCanAccessBranch, requireTenantContext } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function BranchDashboardPage({ params }: { params: { id: string } }) {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId) notFound();
  assertCanAccessBranch(ctx, params.id);

  const branch = await prisma.branch.findFirst({
    where: { id: params.id, organizationId: ctx.organizationId },
  });
  if (!branch) notFound();

  const [credits, orders, staff] = await Promise.all([
    prisma.credit.findMany({
      where: { organizationId: ctx.organizationId, branchId: branch.id },
      include: { student: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.bnplOrder.findMany({
      where: { organizationId: ctx.organizationId, branchId: branch.id },
      include: { student: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.organizationMembership.findMany({
      where: { organizationId: ctx.organizationId, branchId: branch.id },
      include: { vendor: { select: { id: true, businessName: true, ownerName: true, phone: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const outstanding = credits
    .filter((credit) => !["PAID", "WRITTEN_OFF"].includes(credit.status))
    .reduce((sum, credit) => sum + Number(credit.amount) - Number(credit.amountRepaid), 0);
  const overdue = credits.filter((credit) => credit.status === "OVERDUE");
  const customers = new Set(credits.map((credit) => credit.studentId)).size;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      <Link href="/dashboard/supermarket" className="inline-flex items-center gap-2 text-sm text-vodium-cream/45 hover:text-vodium-gold">
        <ArrowLeft size={15} /> Supermarket dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Branch</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">{branch.name}</h1>
          <p className="text-sm text-vodium-cream/45 mt-1">{branch.code} · {branch.address ?? "No address set"}</p>
        </div>
        <Link href="/dashboard/bnpl" className="btn-gold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2">
          <ReceiptText size={15} /> Create BNPL order
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Metric label="Outstanding" value={formatNaira(outstanding)} icon={<CreditCard size={16} />} />
        <Metric label="Overdue credits" value={String(overdue.length)} icon={<ReceiptText size={16} />} />
        <Metric label="Customers" value={String(customers)} icon={<Users size={16} />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
          <h2 className="text-sm font-semibold text-vodium-cream mb-4">Recent credits</h2>
          <div className="space-y-3">
            {credits.length === 0 ? (
              <p className="text-sm text-vodium-cream/35">No credit activity in this branch yet.</p>
            ) : credits.map((credit) => (
              <div key={credit.id} className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm text-vodium-cream truncate">{credit.student.fullName}</p>
                  <p className="text-xs text-vodium-cream/35">{credit.status} · due {credit.dueDate.toLocaleDateString("en-NG")}</p>
                </div>
                <p className="text-sm text-vodium-gold">{formatNaira(Number(credit.amount) - Number(credit.amountRepaid))}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
          <h2 className="text-sm font-semibold text-vodium-cream mb-4">BNPL orders</h2>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-vodium-cream/35">No BNPL order in this branch yet.</p>
            ) : orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm text-vodium-cream">{order.student.fullName}</p>
                  <p className="text-xs text-vodium-cream/35">{order.orderNumber} · {order.status}</p>
                </div>
                <p className="text-sm text-vodium-gold">{formatNaira(Number(order.totalAmount))}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
        <h2 className="text-sm font-semibold text-vodium-cream mb-4">Branch staff</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {staff.length === 0 ? (
            <p className="text-sm text-vodium-cream/35">No staff assigned yet.</p>
          ) : staff.map((member) => (
            <div key={member.id} className="rounded-lg bg-black/20 px-3 py-3">
              <p className="text-sm text-vodium-cream">{member.vendor.ownerName}</p>
              <p className="text-xs text-vodium-cream/35">{member.role} · {member.vendor.phone}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-vodium-cream/35">{label}</p>
        <span className="text-vodium-gold">{icon}</span>
      </div>
      <p className="font-serif text-xl text-vodium-cream mt-3">{value}</p>
    </div>
  );
}
