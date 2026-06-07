"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Store, Users, X, ExternalLink } from "lucide-react";
import { VendorRowMenu } from "@/components/ui/vendor-row-menu";
import type { VendorStatus } from "@prisma/client";

export interface AdminVendorRow {
  id:           string;
  businessName: string;
  ownerName:    string;
  phone:        string;
  status:       VendorStatus;
  university:   { shortName: string | null; name: string };
  subscription: { plan: string; status: string; monthlyAmount: number } | null;
  totalTracked: number;
  creditsLogged: number;
  studentsCount: number;
  subMrr:        number;
  createdAt:     string;
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Pro",
};

const PLAN_COLORS: Record<string, string> = {
  STARTER:    "text-vodium-cream/50 bg-white/[0.06] border-white/[0.08]",
  GROWTH:     "text-vodium-gold bg-vodium-gold/10 border-vodium-gold/20",
  CAMPUS_PRO: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

type Filter = "All" | "Active" | "Trial" | "Inactive";

export function AdminVendorsClient({
  vendors,
  formatNaira,
}: {
  vendors:     AdminVendorRow[];
  formatNaira: (n: number) => string;
}) {
  const [search,    setSearch]    = useState("");
  const [activeTab, setActiveTab] = useState<Filter>("All");

  const filtered = useMemo(() => {
    let rows = vendors;

    if (activeTab === "Active")   rows = rows.filter((v) => v.subscription?.status === "ACTIVE");
    else if (activeTab === "Trial") rows = rows.filter((v) => v.subscription?.status === "TRIAL");
    else if (activeTab === "Inactive") rows = rows.filter((v) => v.status !== "ACTIVE" || (!v.subscription));

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (v) =>
          v.businessName.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q) ||
          (v.university.shortName ?? v.university.name).toLowerCase().includes(q) ||
          v.phone.includes(q)
      );
    }

    return rows;
  }, [vendors, activeTab, search]);

  const TABS: Filter[] = ["All", "Active", "Trial", "Inactive"];

  return (
    <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, owner, phone, or university…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-vodium-slate border border-white/[0.06] rounded-lg pl-9 pr-9 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream/70">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "h-9 px-3 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                activeTab === tab
                  ? "bg-vodium-gold text-vodium-black"
                  : "bg-white/[0.04] text-vodium-cream/40 hover:text-vodium-cream border border-white/[0.07]",
              ].join(" ")}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-black/20 text-[10px] font-semibold text-vodium-cream/22 uppercase tracking-[0.12em]">
        <span className="col-span-3">Vendor</span>
        <span className="col-span-2">University</span>
        <span className="col-span-1 text-center">Students</span>
        <span className="col-span-2 text-right">Tracked</span>
        <span className="col-span-1 text-right">MRR</span>
        <span className="col-span-1 text-center">Status</span>
        <span className="col-span-1 text-center">Plan</span>
        <span className="col-span-1" />
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="px-6 py-16 text-center">
          <Store size={28} className="text-vodium-cream/15 mx-auto mb-3" />
          <p className="text-vodium-cream/25 text-sm">
            {vendors.length === 0 ? "No vendors yet." : "No vendors match your search."}
          </p>
          {vendors.length > 0 && (
            <button onClick={() => { setSearch(""); setActiveTab("All"); }} className="text-vodium-gold text-xs hover:underline mt-2">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Rows */}
      {filtered.map((v) => {
        const subStatus = v.subscription?.status ?? "TRIAL";
        const plan      = v.subscription?.plan ?? "STARTER";

        const statusCls =
          subStatus === "TRIAL"  ? "badge-trial"
          : v.status === "ACTIVE" ? "badge-active"
          : "badge-inactive";

        return (
          <div key={v.id} className="group border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
            {/* Mobile */}
            <div className="md:hidden px-5 py-4 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center flex-shrink-0 font-serif text-vodium-gold font-bold">
                    {v.businessName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-vodium-cream truncate">{v.businessName}</p>
                    <p className="text-xs text-vodium-cream/35">{v.ownerName}</p>
                  </div>
                </div>
                <VendorRowMenu vendorId={v.id} businessName={v.businessName} currentStatus={v.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-vodium-cream/40">
                <span>{v.university.shortName ?? v.university.name}</span>
                <span className={`badge ${statusCls}`}>{subStatus}</span>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden md:grid grid-cols-12 items-center px-5 py-3.5 gap-2">
              <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center flex-shrink-0 font-serif text-vodium-gold text-sm font-bold">
                  {v.businessName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-vodium-cream truncate leading-tight">{v.businessName}</p>
                  <p className="text-[10px] text-vodium-cream/35 mt-0.5">{v.ownerName}</p>
                </div>
              </div>

              <div className="col-span-2 text-xs text-vodium-cream/45 truncate">
                {v.university.shortName ?? v.university.name}
              </div>

              <div className="col-span-1 text-center">
                <span className="inline-flex items-center gap-1 text-xs text-vodium-cream/50">
                  <Users size={10} /> {v.studentsCount}
                </span>
              </div>

              <div className="col-span-2 text-right">
                <p className="text-sm text-vodium-cream font-medium">{formatNaira(v.totalTracked)}</p>
                <p className="text-[10px] text-vodium-cream/28 mt-0.5">{v.creditsLogged} credits</p>
              </div>

              <div className="col-span-1 text-right">
                <p className={`text-sm font-medium ${v.subMrr > 0 ? "text-vodium-gold" : "text-vodium-cream/25"}`}>
                  {v.subMrr > 0 ? formatNaira(v.subMrr) : "—"}
                </p>
              </div>

              <div className="col-span-1 flex justify-center">
                <span className={`badge ${statusCls} text-[10px]`}>
                  {subStatus === "TRIAL" ? "TRIAL" : v.status}
                </span>
              </div>

              <div className="col-span-1 flex justify-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PLAN_COLORS[plan] ?? ""}`}>
                  {PLAN_LABELS[plan] ?? plan}
                </span>
              </div>

              <div className="col-span-1 flex items-center justify-end gap-1.5">
                <Link
                  href={`/admin/vendors/${v.id}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-vodium-cream/25 hover:text-vodium-gold hover:bg-vodium-gold/10 transition-colors"
                  title="View details"
                >
                  <ExternalLink size={12} />
                </Link>
                <VendorRowMenu
                  vendorId={v.id}
                  businessName={v.businessName}
                  currentStatus={v.status}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-white/[0.05] text-[11px] text-vodium-cream/22">
        {filtered.length === vendors.length
          ? `${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`
          : `Showing ${filtered.length} of ${vendors.length}`}
      </div>
    </div>
  );
}
