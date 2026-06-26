import { Download, WalletCards } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { requireTenantContext } from "@/lib/tenant-context";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const ctx = await requireTenantContext();
  const where = ctx.organizationId
    ? ctx.canSeeAllBranches
      ? { organizationId: ctx.organizationId }
      : { organizationId: ctx.organizationId, branchId: ctx.branchId }
    : null;

  const entries = where
    ? await prisma.walletLedgerEntry.findMany({
        where,
        include: { branch: true, vendor: { select: { businessName: true } } },
        orderBy: { createdAt: "desc" },
        take: 200,
      })
    : [];

  const credit = entries.filter((entry) => entry.direction === "CREDIT").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const debit = entries.filter((entry) => entry.direction === "DEBIT").reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Ledger</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">Internal wallet ledger</h1>
          <p className="text-sm text-vodium-cream/45 mt-1">Reporting ledger only. Real custody should remain with licensed payment partners.</p>
        </div>
        {where && (
          <a
            href="/api/ledger/export"
            className="px-4 py-2 rounded-lg text-sm border border-white/10 text-vodium-cream/70 hover:text-vodium-gold hover:border-vodium-gold/30 inline-flex items-center gap-2 shrink-0"
          >
            <Download size={15} /> Export CSV
          </a>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Metric label="Credits" value={formatNaira(credit)} />
        <Metric label="Debits" value={formatNaira(debit)} />
        <Metric label="Net" value={formatNaira(credit - debit)} />
      </div>

      <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <WalletCards size={16} className="text-vodium-gold" />
          <h2 className="text-sm font-semibold text-vodium-cream">Ledger entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-vodium-cream/35">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3">Direction</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {entries.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-vodium-cream/35">No ledger entries yet.</td></tr>
              ) : entries.map((entry) => (
                <tr key={entry.id} className="text-vodium-cream/70">
                  <td className="px-5 py-3">{entry.createdAt.toLocaleString("en-NG")}</td>
                  <td className="px-5 py-3">{entry.entryType}</td>
                  <td className="px-5 py-3">{entry.branch?.name ?? "All branches"}</td>
                  <td className="px-5 py-3">{entry.direction}</td>
                  <td className="px-5 py-3 text-vodium-gold">{formatNaira(Number(entry.amount))}</td>
                  <td className="px-5 py-3">{entry.description ?? entry.sourceType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-4">
      <p className="text-xs uppercase tracking-wider text-vodium-cream/35">{label}</p>
      <p className="font-serif text-xl text-vodium-cream mt-3">{value}</p>
    </div>
  );
}
