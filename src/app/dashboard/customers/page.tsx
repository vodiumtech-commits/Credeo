import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
function getScoreTier(score: number) {
  if (score >= 750) return { className: "bg-success/10 text-success border-success/20" };
  if (score >= 650) return { className: "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/20" };
  if (score >= 450) return { className: "bg-warning/10 text-warning border-warning/20" };
  return { className: "bg-danger/10 text-danger border-danger/20" };
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

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{totalCount} students on your book</p>
        </div>
        <Link href="/dashboard/credit/new" className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <Plus size={15} /> New credit
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",    value: totalCount,   color: "text-vodium-black" },
          { label: "Owing",    value: owingCount,   color: "text-warning" },
          { label: "Overdue",  value: overdueCount, color: "text-danger" },
          { label: "Settled",  value: settledCount, color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl p-4 text-center">
            <p className={`font-serif text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-muted/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
          <span className="col-span-3">Student</span>
          <span className="col-span-2 text-center">Score</span>
          <span className="col-span-1 text-center">Credits</span>
          <span className="col-span-3 text-right">Amount owed</span>
          <span className="col-span-2 text-center">Status</span>
          <span className="col-span-1" />
        </div>

        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-muted-foreground mb-4">No customers yet. Record your first credit to add one.</p>
            <Link href="/dashboard/credit/new" className="btn-gold px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus size={15} /> Add first credit
            </Link>
          </div>
        ) : (
          rows.map((s) => {
            const tier = getScoreTier(s.vodiumScore);
            return (
              <div key={s.id} className="md:grid grid-cols-12 items-center px-6 py-4 border-t border-border table-row gap-2">
                <div className="col-span-3">
                  <p className="font-medium text-sm text-vodium-black">{s.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.matricNumber ?? "—"}</p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${tier.className}`}>
                    {s.vodiumScore}
                  </span>
                </div>
                <div className="col-span-1 text-center text-sm text-muted-foreground">
                  {s.credits.length}
                </div>
                <div className="col-span-3 text-right">
                  <p className={`font-semibold text-sm ${s.totalOwed > 0 ? (s.status === "overdue" ? "text-danger" : "text-warning") : "text-success"}`}>
                    {s.totalOwed > 0 ? formatNaira(s.totalOwed) : "Settled"}
                  </p>
                </div>
                <div className="col-span-2 flex justify-center">
                  <StatusDot status={s.status} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <ArrowRight size={14} className="text-muted-foreground" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Score legend */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Vodium score:</span>
          {[
            { range: "750–1000", label: "Excellent", cls: "bg-success/10 text-success border-success/20" },
            { range: "650–749",  label: "Good",      cls: "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/20" },
            { range: "450–649",  label: "Fair",      cls: "bg-warning/10 text-warning border-warning/20" },
            { range: "0–449",    label: "Poor",      cls: "bg-danger/10 text-danger border-danger/20" },
          ].map((t) => (
            <span key={t.label} className={`px-2 py-0.5 rounded-md border font-medium ${t.cls}`}>
              {t.label} ({t.range})
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    overdue:  { dot: "bg-danger",  label: "Overdue" },
    due_soon: { dot: "bg-warning", label: "Due soon" },
    owing:    { dot: "bg-warning", label: "Owing" },
    settled:  { dot: "bg-success", label: "Settled" },
  };
  const { dot, label } = map[status] ?? { dot: "bg-muted", label: status };
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
