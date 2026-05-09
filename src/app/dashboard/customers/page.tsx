import Link from "next/link";
import { Search, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { DEMO_CUSTOMERS, getScoreTier } from "@/lib/data/demo-data";
import { formatNaira } from "@/lib/utils";

export default function CustomersPage() {
  const customers = DEMO_CUSTOMERS;
  const totalOwed = customers.reduce((sum, c) => sum + c.totalOwed, 0);
  const overdue = customers.filter((c) => c.status === "overdue").length;

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {customers.length} students — {formatNaira(totalOwed)} total owed
          </p>
        </div>
        <Link
          href="/dashboard/credit/new"
          className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
        >
          + Add credit
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total customers", value: String(customers.length), color: "text-vodium-black" },
          { label: "Owing money", value: String(customers.filter(c => c.totalOwed > 0).length), color: "text-warning" },
          { label: "Overdue", value: String(overdue), color: "text-danger" },
          { label: "All settled", value: String(customers.filter(c => c.status === "paid").length), color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`font-serif text-2xl mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search / filter bar */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name or matric number…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-vodium-gold focus:ring-1 focus:ring-vodium-gold/20 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            {(["all", "owing", "overdue", "paid"] as const).map((f) => (
              <button
                key={f}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  f === "all"
                    ? "bg-vodium-black text-vodium-cream"
                    : "text-muted-foreground hover:text-vodium-black border border-border"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 px-6 py-3 bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span className="col-span-4">Customer</span>
          <span className="col-span-2 text-center">Score</span>
          <span className="col-span-2 text-right">Total credits</span>
          <span className="col-span-2 text-right">Amount owed</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1" />
        </div>

        {/* Rows */}
        {customers.map((c) => {
          const tier = getScoreTier(c.vodiumScore);
          return (
            <div
              key={c.id}
              className="grid grid-cols-12 items-center px-6 py-4 table-row border-t border-border"
            >
              {/* Name + matric */}
              <div className="col-span-4">
                <p className="font-medium text-sm text-vodium-black">{c.fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.matricNumber}</p>
              </div>

              {/* Vodium score */}
              <div className="col-span-2 flex flex-col items-center">
                <span className={`badge text-xs font-bold ${tier.className} rounded-lg px-2.5 py-1`}>
                  {c.vodiumScore}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">{tier.label}</span>
              </div>

              {/* Credits count */}
              <div className="col-span-2 text-right">
                <p className="text-sm text-vodium-black font-medium">{c.totalCredits}</p>
                <p className="text-xs text-muted-foreground">credits</p>
              </div>

              {/* Amount owed */}
              <div className="col-span-2 text-right">
                <p className={`text-sm font-semibold ${c.totalOwed > 0 ? (c.status === "overdue" ? "text-danger" : "text-warning") : "text-success"}`}>
                  {c.totalOwed > 0 ? formatNaira(c.totalOwed) : "Settled"}
                </p>
                {c.totalOwed > 0 && <p className="text-xs text-muted-foreground">{c.lastActivity}</p>}
              </div>

              {/* Status badge */}
              <div className="col-span-1 flex justify-center">
                <StatusDot status={c.status} />
              </div>

              {/* Action */}
              <div className="col-span-1 flex justify-end">
                <button className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-vodium-gold hover:border-vodium-gold transition-colors">
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Pagination stub */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing 20 of {customers.length} customers</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-border text-xs hover:border-vodium-gold transition-colors disabled:opacity-40" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-border text-xs hover:border-vodium-gold transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Score legend */}
      <div className="mt-6 bg-white border border-border rounded-xl p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Vodium Score Guide
        </p>
        <div className="flex flex-wrap gap-4">
          {[
            { label: "Excellent (750–1000)", className: "score-excellent", desc: "Safe to extend credit — consistent payer" },
            { label: "Good (650–749)", className: "score-good", desc: "Generally reliable" },
            { label: "Fair (450–649)", className: "score-fair", desc: "Use caution — some late payments" },
            { label: "Poor (0–449)", className: "score-poor", desc: "High risk — consider declining" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-2">
              <span className={`badge ${t.className} text-[10px] font-bold rounded-md`}>{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { dot: string; label: string }> = {
    paid:        { dot: "bg-success", label: "Paid" },
    outstanding: { dot: "bg-warning", label: "Owing" },
    overdue:     { dot: "bg-danger",  label: "Overdue" },
    due_soon:    { dot: "bg-warning animate-pulse", label: "Due soon" },
  };
  const s = map[status] ?? { dot: "bg-muted", label: "—" };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${s.dot}`} />
      <span className="text-[10px] text-muted-foreground">{s.label}</span>
    </div>
  );
}
