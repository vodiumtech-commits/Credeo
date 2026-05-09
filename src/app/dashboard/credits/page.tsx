import Link from "next/link";
import { Search, Plus, Filter } from "lucide-react";
import { DEMO_CREDITS } from "@/lib/data/demo-data";
import { formatNaira } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  OUTSTANDING:    { label: "Outstanding",   className: "badge-outstanding" },
  DUE_SOON:       { label: "Due soon",      className: "badge-due-soon" },
  OVERDUE:        { label: "Overdue",       className: "badge-overdue" },
  PAID:           { label: "Paid",          className: "badge-paid" },
  PARTIALLY_PAID: { label: "Partial",       className: "badge-outstanding" },
  WRITTEN_OFF:    { label: "Written off",   className: "badge-inactive" },
};

export default function CreditsPage() {
  const credits = DEMO_CREDITS;
  const outstanding = credits.filter((c) => ["OUTSTANDING", "DUE_SOON"].includes(c.status));
  const overdue = credits.filter((c) => c.status === "OVERDUE");
  const paid = credits.filter((c) => c.status === "PAID");
  const totalOutstanding = outstanding.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">Credits</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {credits.length} total · {formatNaira(totalOutstanding)} outstanding
          </p>
        </div>
        <Link
          href="/dashboard/credit/new"
          className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
        >
          <Plus size={15} /> Add credit
        </Link>
      </div>

      {/* Summary tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Outstanding", count: outstanding.length, amount: totalOutstanding, color: "text-warning", border: "border-warning/20" },
          { label: "Overdue", count: overdue.length, amount: overdue.reduce((s, c) => s + c.amount, 0), color: "text-danger", border: "border-danger/20" },
          { label: "Paid this month", count: paid.length, amount: paid.reduce((s, c) => s + c.amount, 0), color: "text-success", border: "border-success/20" },
          { label: "Total logged", count: credits.length, amount: credits.reduce((s, c) => s + c.amount, 0), color: "text-vodium-black", border: "border-border" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border ${s.border} rounded-xl p-4`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`font-serif text-xl mt-1 ${s.color}`}>{s.count}</p>
            <p className={`text-xs mt-0.5 font-medium ${s.color}`}>{formatNaira(s.amount)}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search credits…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-vodium-gold transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:border-vodium-gold hover:text-vodium-gold transition-colors">
              <Filter size={13} /> Filter
            </button>
            {(["All", "Outstanding", "Overdue", "Paid"] as const).map((f) => (
              <button
                key={f}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hidden sm:block ${
                  f === "All"
                    ? "bg-vodium-black text-vodium-cream"
                    : "text-muted-foreground hover:text-vodium-black border border-border"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table head */}
        <div className="grid grid-cols-12 px-6 py-3 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="col-span-3">Student</span>
          <span className="col-span-2">Description</span>
          <span className="col-span-2 text-right">Amount</span>
          <span className="col-span-1 text-right">Repaid</span>
          <span className="col-span-2 text-center">Due date</span>
          <span className="col-span-2 text-center">Status</span>
        </div>

        {/* Rows */}
        {credits.map((c) => {
          const s = STATUS_LABELS[c.status] ?? { label: c.status, className: "badge-inactive" };
          const remaining = c.amount - c.amountRepaid;
          return (
            <div
              key={c.id}
              className="grid grid-cols-12 items-center px-6 py-4 table-row border-t border-border"
            >
              <div className="col-span-3">
                <p className="font-medium text-sm text-vodium-black">{c.studentName}</p>
                <p className="text-xs text-muted-foreground">{c.matricNumber}</p>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground truncate pr-2">
                {c.description}
              </div>
              <div className="col-span-2 text-right">
                <p className="font-semibold text-sm text-vodium-black">{formatNaira(c.amount)}</p>
              </div>
              <div className="col-span-1 text-right">
                <p className={`text-xs ${c.amountRepaid > 0 ? "text-success font-medium" : "text-muted-foreground"}`}>
                  {c.amountRepaid > 0 ? formatNaira(c.amountRepaid) : "—"}
                </p>
              </div>
              <div className="col-span-2 text-center text-xs text-muted-foreground">
                {c.dueDate}
              </div>
              <div className="col-span-2 flex justify-center">
                <span className={`badge ${s.className} text-xs`}>{s.label}</span>
              </div>
            </div>
          );
        })}

        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {credits.length} credits</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border text-xs hover:border-vodium-gold disabled:opacity-40 transition-colors" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-border text-xs hover:border-vodium-gold transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
