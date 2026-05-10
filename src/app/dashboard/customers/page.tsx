import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowRight, Users } from "lucide-react";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

function getScoreTier(score: number): { className: string; label: string; color: string } {
  if (score >= 750) return {
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    label: "Excellent",
    color: "text-emerald-400",
  };
  if (score >= 650) return {
    className: "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/25",
    label: "Good",
    color: "text-vodium-gold",
  };
  if (score >= 450) return {
    className: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    label: "Fair",
    color: "text-amber-400",
  };
  return {
    className: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    label: "Poor",
    color: "text-rose-400",
  };
}

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

  // Compute per-student stats
  const rows = students.map((s) => {
    const credits = s.credits;
    const totalOwed = credits
      .filter((c) => !["PAID", "WRITTEN_OFF"].includes(c.status))
      .reduce((sum, c) => sum + Number(c.amount) - Number(c.amountRepaid), 0);
    const hasOverdue = credits.some((c) => c.status === "OVERDUE");
    const hasDueSoon = credits.some((c) => c.status === "DUE_SOON");
    const status =
      hasOverdue ? "overdue"
      : hasDueSoon ? "due_soon"
      : totalOwed > 0 ? "owing"
      : "settled";
    return { ...s, totalOwed, status };
  });

  const totalCount = rows.length;
  const owingCount = rows.filter((r) => r.status !== "settled").length;
  const overdueCount = rows.filter((r) => r.status === "overdue").length;
  const settledCount = rows.filter((r) => r.status === "settled").length;

  const summaryCards = [
    { label: "Total",   value: totalCount,   accent: "text-vodium-cream",  border: "border-white/[0.08]",    bg: "bg-white/[0.03]" },
    { label: "Owing",   value: owingCount,   accent: "text-amber-400",     border: "border-amber-500/20",    bg: "bg-amber-500/[0.05]" },
    { label: "Overdue", value: overdueCount, accent: "text-rose-400",      border: "border-rose-500/20",     bg: "bg-rose-500/[0.05]" },
    { label: "Settled", value: settledCount, accent: "text-emerald-400",   border: "border-emerald-500/20",  bg: "bg-emerald-500/[0.05]" },
  ] as const;

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Customers</h1>
          <p className="text-sm text-vodium-cream/40 mt-1.5">
            {totalCount} student{totalCount !== 1 ? "s" : ""} on your book
          </p>
        </div>
        <Link
          href="/dashboard/credit/new"
          className="btn-gold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 flex-shrink-0"
        >
          <Plus size={15} /> New credit
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border ${s.border} ${s.bg} px-5 py-4 space-y-1`}
          >
            <p className={`font-serif text-3xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="text-[11px] text-vodium-cream/30 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Customer table */}
      <div className="bg-vodium-charcoal rounded-2xl border border-white/[0.06] overflow-hidden">

        {/* Table column headers */}
        <div className="hidden md:grid grid-cols-12 px-6 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-vodium-cream/25 uppercase tracking-widest">
          <span className="col-span-3">Customer</span>
          <span className="col-span-2 text-center">Vodium Score</span>
          <span className="col-span-1 text-center">Credits</span>
          <span className="col-span-3 text-right">Amount Owed</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-1" />
        </div>

        {rows.length === 0 ? (
          /* Dark empty state */
          <div className="px-6 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-vodium-gold/[0.08] border border-vodium-gold/15 flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-vodium-gold/40" />
            </div>
            <p className="text-vodium-cream/40 text-sm mb-1">No customers yet.</p>
            <p className="text-vodium-cream/25 text-xs mb-6">Record your first credit to add one.</p>
            <Link
              href="/dashboard/credit/new"
              className="btn-gold px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2"
            >
              <Plus size={15} /> Add first credit
            </Link>
          </div>
        ) : (
          rows.map((s) => {
            const tier = getScoreTier(s.vodiumScore);
            const owedColor =
              s.status === "overdue" ? "text-rose-400"
              : s.totalOwed > 0 ? "text-amber-400"
              : "text-emerald-400";

            return (
              <div
                key={s.id}
                className="md:grid grid-cols-12 items-center px-6 py-4 table-row-dark gap-2"
              >
                {/* Customer name + matric */}
                <div className="col-span-3 mb-1 md:mb-0">
                  <p className="font-medium text-sm text-vodium-cream">{s.fullName}</p>
                  <p className="text-xs text-vodium-cream/30 mt-0.5">{s.matricNumber ?? "—"}</p>
                </div>

                {/* Vodium score badge */}
                <div className="col-span-2 flex justify-center mb-1 md:mb-0">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${tier.className}`}>
                    {s.vodiumScore}
                  </span>
                </div>

                {/* Credit count */}
                <div className="col-span-1 text-center mb-1 md:mb-0">
                  <span className="text-sm text-vodium-cream/50">{s.credits.length}</span>
                </div>

                {/* Amount owed — serif, color-coded */}
                <div className="col-span-3 text-right mb-1 md:mb-0">
                  <p className={`font-serif text-sm font-semibold ${owedColor}`}>
                    {s.totalOwed > 0 ? formatNaira(s.totalOwed) : "Settled"}
                  </p>
                </div>

                {/* Status dot + label */}
                <div className="col-span-2 flex justify-center mb-1 md:mb-0">
                  <StatusDot status={s.status} />
                </div>

                {/* Arrow */}
                <div className="col-span-1 flex justify-end">
                  <ArrowRight size={14} className="text-vodium-cream/20" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Score legend */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-vodium-cream/30">
          <span>Vodium score:</span>
          {[
            { range: "750–1000", label: "Excellent", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" },
            { range: "650–749",  label: "Good",      cls: "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/25" },
            { range: "450–649",  label: "Fair",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/25" },
            { range: "0–449",    label: "Poor",      cls: "bg-rose-500/10 text-rose-400 border-rose-500/25" },
          ].map((t) => (
            <span key={t.label} className={`px-2 py-0.5 rounded-full border font-medium ${t.cls}`}>
              {t.label} ({t.range})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string; text: string }> = {
    overdue:  { dot: "bg-rose-400",    label: "Overdue",  text: "text-rose-400/80" },
    due_soon: { dot: "bg-amber-400",   label: "Due soon", text: "text-amber-400/80" },
    owing:    { dot: "bg-amber-400",   label: "Owing",    text: "text-amber-400/80" },
    settled:  { dot: "bg-emerald-400", label: "Settled",  text: "text-emerald-400/80" },
  };
  const { dot, label, text } = map[status] ?? { dot: "bg-vodium-cream/20", label: status, text: "text-vodium-cream/40" };
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
      {label}
    </span>
  );
}
