import Link from "next/link";
import {
  Search, Store, Filter, ArrowUpRight, Users, CreditCard,
  MoreHorizontal, ChevronDown
} from "lucide-react";
import {
  ADMIN_VENDORS, ADMIN_PLATFORM_STATS, AdminVendorRow
} from "@/lib/data/demo-data";
import { formatNaira } from "@/lib/utils";

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Campus Pro",
};

const PLAN_COLORS: Record<string, string> = {
  STARTER:    "text-vodium-cream/50 bg-vodium-slate border-vodium-slate",
  GROWTH:     "text-vodium-gold bg-vodium-gold/10 border-vodium-gold/20",
  CAMPUS_PRO: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function AdminVendorsPage() {
  const vendors = ADMIN_VENDORS;
  const s = ADMIN_PLATFORM_STATS;
  const totalMRR = vendors.filter(v => v.status === "ACTIVE").reduce((sum, v) => sum + v.mrr, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1">Vendor management</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">
            {s.totalVendors} Vendors
          </h1>
          <p className="text-vodium-cream/40 text-sm mt-0.5">
            {s.activeVendors} active · {s.trialVendors} on trial · {s.inactiveVendors} inactive
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-ghost px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active vendors",   value: String(s.activeVendors),  sub: "Paying" },
          { label: "Trial vendors",    value: String(s.trialVendors),   sub: "60-day free" },
          { label: "Total MRR",        value: formatNaira(s.mrr),        sub: "Recurring monthly" },
          { label: "Avg revenue/vendor", value: formatNaira(Math.round(s.mrr / s.activeVendors)), sub: "Per active vendor" },
        ].map((k) => (
          <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
            <p className="text-vodium-cream/40 text-xs">{k.label}</p>
            <p className="font-serif text-2xl text-vodium-gold mt-1">{k.value}</p>
            <p className="text-vodium-cream/30 text-xs mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Plan breakdown */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { plan: "STARTER",    vendors: vendors.filter(v => v.plan === "STARTER").length,    mrr: vendors.filter(v => v.plan === "STARTER" && v.status === "ACTIVE").reduce((s, v) => s + v.mrr, 0) },
          { plan: "GROWTH",     vendors: vendors.filter(v => v.plan === "GROWTH").length,     mrr: vendors.filter(v => v.plan === "GROWTH" && v.status === "ACTIVE").reduce((s, v) => s + v.mrr, 0) },
          { plan: "CAMPUS_PRO", vendors: vendors.filter(v => v.plan === "CAMPUS_PRO").length, mrr: vendors.filter(v => v.plan === "CAMPUS_PRO" && v.status === "ACTIVE").reduce((s, v) => s + v.mrr, 0) },
        ].map((p) => (
          <div key={p.plan} className={`border rounded-xl p-5 ${PLAN_COLORS[p.plan]}`}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3">{PLAN_LABELS[p.plan]}</p>
            <p className="font-serif text-3xl mb-1">{p.vendors}</p>
            <p className="text-xs opacity-70">{formatNaira(p.mrr)}/mo contribution</p>
          </div>
        ))}
      </div>

      {/* Vendor table */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
            <input
              type="search"
              placeholder="Search vendors by name, owner, or university…"
              className="w-full bg-vodium-slate border border-white/[0.06] rounded-lg pl-9 pr-4 py-2.5 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/[0.08] rounded-lg text-vodium-cream/50 hover:border-vodium-gold/30 hover:text-vodium-gold transition-colors">
              <Filter size={12} /> Filter
            </button>
            {(["All", "Active", "Trial", "Inactive"] as const).map((f) => (
              <button
                key={f}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hidden sm:block ${
                  f === "All"
                    ? "bg-vodium-gold text-vodium-black"
                    : "text-vodium-cream/40 hover:text-vodium-cream border border-white/[0.06]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table head */}
        <div className="grid grid-cols-12 px-6 py-3 bg-black/20 text-[11px] font-medium text-vodium-cream/30 uppercase tracking-wider">
          <span className="col-span-3">Vendor</span>
          <span className="col-span-2">University</span>
          <span className="col-span-1 text-center">Students</span>
          <span className="col-span-2 text-right">Total tracked</span>
          <span className="col-span-1 text-right">MRR</span>
          <span className="col-span-1 text-center">Status</span>
          <span className="col-span-1 text-center">Plan</span>
          <span className="col-span-1 text-center" />
        </div>

        {/* Rows */}
        {vendors.map((v) => (
          <VendorRow key={v.id} v={v} />
        ))}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-vodium-cream/30">
          <span>Showing {vendors.length} of {s.totalVendors} vendors</span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-vodium-gold/30 disabled:opacity-30 transition-colors" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-white/[0.06] hover:border-vodium-gold/30 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorRow({ v }: { v: AdminVendorRow }) {
  const statusMap: Record<string, string> = {
    ACTIVE:    "badge-active",
    TRIAL:     "badge-trial",
    INACTIVE:  "badge-inactive",
    SUSPENDED: "badge-suspended",
  };

  return (
    <div className="grid grid-cols-12 items-center px-6 py-4 table-row-dark border-t border-white/[0.04]">
      {/* Business name + owner */}
      <div className="col-span-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-vodium-slate border border-white/[0.06] flex items-center justify-center flex-shrink-0">
          <Store size={14} className="text-vodium-gold/60" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-vodium-cream truncate">{v.businessName}</p>
          <p className="text-xs text-vodium-cream/35 mt-0.5">{v.ownerName}</p>
        </div>
      </div>

      {/* University */}
      <div className="col-span-2 text-xs text-vodium-cream/50">{v.university}</div>

      {/* Students */}
      <div className="col-span-1 text-center">
        <div className="inline-flex items-center gap-1 text-xs text-vodium-cream/60">
          <Users size={11} /> {v.studentsCount}
        </div>
      </div>

      {/* Total tracked */}
      <div className="col-span-2 text-right">
        <p className="text-sm font-semibold text-vodium-cream">{formatNaira(v.totalTracked)}</p>
        <p className="text-[10px] text-vodium-cream/30 mt-0.5">{v.creditsLogged} credits</p>
      </div>

      {/* MRR */}
      <div className="col-span-1 text-right">
        <p className={`text-sm font-medium ${v.mrr > 0 ? "text-vodium-gold" : "text-vodium-cream/30"}`}>
          {v.mrr > 0 ? formatNaira(v.mrr) : "Trial"}
        </p>
      </div>

      {/* Status */}
      <div className="col-span-1 flex justify-center">
        <span className={`badge ${statusMap[v.status] ?? "badge-inactive"} text-[10px]`}>
          {v.status}
        </span>
      </div>

      {/* Plan */}
      <div className="col-span-1 flex justify-center">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PLAN_COLORS[v.plan] ?? ""}`}>
          {PLAN_LABELS[v.plan] ?? v.plan}
        </span>
      </div>

      {/* Actions */}
      <div className="col-span-1 flex justify-center">
        <button className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-vodium-cream/30 hover:text-vodium-gold hover:border-vodium-gold/30 transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
