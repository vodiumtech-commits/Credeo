import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CreditCard, ReceiptText, TicketPercent, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { requireTenantContext } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function SupermarketDashboardPage() {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId || !ctx.organization || ctx.organization.type === "SOLO_VENDOR") {
    redirect("/dashboard");
  }

  const where = ctx.canSeeAllBranches
    ? { organizationId: ctx.organizationId }
    : { organizationId: ctx.organizationId, branchId: ctx.branchId };

  const [credits, orders, ledger, coupons, customers] = await Promise.all([
    prisma.credit.findMany({
      where,
      include: { branch: true, student: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bnplOrder.findMany({
      where,
      include: { branch: true, student: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.walletLedgerEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.couponCampaign.findMany({
      where: { organizationId: ctx.organizationId, ...(ctx.canSeeAllBranches ? {} : { branchId: ctx.branchId }) },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.student.count({ where: { credits: { some: where } } }),
  ]);

  const outstanding = credits
    .filter((credit) => !["PAID", "WRITTEN_OFF"].includes(credit.status))
    .reduce((sum, credit) => sum + Number(credit.amount) - Number(credit.amountRepaid), 0);
  const overdue = credits.filter((credit) => credit.status === "OVERDUE");
  const paid = credits.filter((credit) => credit.status === "PAID");
  const issued = credits.reduce((sum, credit) => sum + Number(credit.amount), 0);
  const recovered = paid.reduce((sum, credit) => sum + Number(credit.amount), 0);

  const branchStats = ctx.organization.branches.map((branch) => {
    const branchCredits = credits.filter((credit) => credit.branchId === branch.id);
    const owed = branchCredits
      .filter((credit) => !["PAID", "WRITTEN_OFF"].includes(credit.status))
      .reduce((sum, credit) => sum + Number(credit.amount) - Number(credit.amountRepaid), 0);
    return {
      branch,
      owed,
      total: branchCredits.length,
      overdue: branchCredits.filter((credit) => credit.status === "OVERDUE").length,
    };
  });

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Enterprise</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">
            {ctx.organization.name}
          </h1>
          <p className="text-sm text-vodium-cream/45 mt-1">
            {ctx.canSeeAllBranches ? "All branches" : ctx.branch?.name ?? "Assigned branch"} · {ctx.role}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/bnpl" className="btn-gold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2">
            <ReceiptText size={15} /> BNPL orders
          </Link>
          <Link href="/dashboard/coupons" className="px-4 py-2 rounded-lg text-sm border border-white/10 text-vodium-cream/70 hover:text-vodium-gold hover:border-vodium-gold/30 inline-flex items-center gap-2">
            <TicketPercent size={15} /> Coupons
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <Metric label="Outstanding" value={formatNaira(outstanding)} icon={<CreditCard size={16} />} />
        <Metric label="Overdue" value={String(overdue.length)} icon={<ReceiptText size={16} />} />
        <Metric label="Recovered" value={formatNaira(recovered)} icon={<CreditCard size={16} />} />
        <Metric label="Customers" value={String(customers)} icon={<Users size={16} />} />
        <Metric label="Issued" value={formatNaira(issued)} icon={<Building2 size={16} />} />
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-semibold text-vodium-cream">Branch performance</h2>
            <span className="text-xs text-vodium-cream/35">{branchStats.length} branches</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-vodium-cream/35">
                <tr>
                  <th className="py-2 pr-4">Branch</th>
                  <th className="py-2 pr-4">Credits</th>
                  <th className="py-2 pr-4">Overdue</th>
                  <th className="py-2 pr-4">Owed</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {branchStats.map(({ branch, total, overdue: overdueCount, owed }) => (
                  <tr key={branch.id} className="text-vodium-cream/70">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-vodium-cream">{branch.name}</p>
                      <p className="text-xs text-vodium-cream/35">{branch.code}</p>
                    </td>
                    <td className="py-3 pr-4">{total}</td>
                    <td className="py-3 pr-4 text-rose-300">{overdueCount}</td>
                    <td className="py-3 pr-4">{formatNaira(owed)}</td>
                    <td className="py-3 text-right">
                      <Link href={`/dashboard/branches/${branch.id}`} className="text-xs text-vodium-gold hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
          <h2 className="text-sm font-semibold text-vodium-cream mb-4">Recent BNPL orders</h2>
          <div className="space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-vodium-cream/35">No BNPL orders yet.</p>
            ) : orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-vodium-cream truncate">{order.student.fullName}</p>
                  <p className="text-xs text-vodium-cream/35">{order.orderNumber} · {order.status}</p>
                </div>
                <p className="text-sm text-vodium-gold">{formatNaira(Number(order.totalAmount))}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
          <h2 className="text-sm font-semibold text-vodium-cream mb-4">Active coupons</h2>
          <div className="space-y-3">
            {coupons.length === 0 ? (
              <p className="text-sm text-vodium-cream/35">No coupon campaign yet.</p>
            ) : coupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-vodium-cream">{coupon.name}</p>
                  <p className="text-xs text-vodium-cream/35">{coupon.code} · {coupon.type}</p>
                </div>
                <span className="text-xs text-vodium-gold">{coupon.active ? "Active" : "Paused"}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
          <h2 className="text-sm font-semibold text-vodium-cream mb-4">Ledger activity</h2>
          <div className="space-y-3">
            {ledger.length === 0 ? (
              <p className="text-sm text-vodium-cream/35">Ledger entries will appear as BNPL and payments are recorded.</p>
            ) : ledger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-vodium-cream">{entry.entryType}</p>
                  <p className="text-xs text-vodium-cream/35">{entry.description ?? entry.sourceType}</p>
                </div>
                <span className={entry.direction === "CREDIT" ? "text-emerald-300" : "text-rose-300"}>
                  {formatNaira(Number(entry.amount))}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
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
