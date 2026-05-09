import Link from "next/link";
import {
  Store, Users, CreditCard, TrendingUp, ArrowUpRight,
  ArrowRight, Shield, Activity, Zap, CheckCircle2, AlertCircle
} from "lucide-react";
import {
  ADMIN_PLATFORM_STATS, ADMIN_MRR_HISTORY, ADMIN_UNIVERSITY_BREAKDOWN,
  ADMIN_VENDORS, ADMIN_ACTIVITY,
} from "@/lib/data/demo-data";
import { formatNaira } from "@/lib/utils";

export default function AdminPage() {
  const s = ADMIN_PLATFORM_STATS;
  const mrrMax = Math.max(...ADMIN_MRR_HISTORY.map((m) => m.mrr));

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* ── Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1">Platform overview</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Vodium Ledger Admin</h1>
          <p className="text-vodium-cream/40 text-sm mt-0.5">Real-time platform metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success text-xs font-medium">All systems operational</span>
          </div>
        </div>
      </div>

      {/* ── Primary KPIs ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKpi
          label="Active vendors"
          value={String(s.activeVendors)}
          sub={`${s.trialVendors} on trial · ${s.inactiveVendors} inactive`}
          delta="+7 this week"
          positive
          icon={<Store size={18} />}
        />
        <AdminKpi
          label="Total students"
          value={s.totalStudents.toLocaleString()}
          sub={`${s.uniqueStudentsWithHistory.toLocaleString()} with credit history`}
          delta="+234 this week"
          positive
          icon={<Users size={18} />}
        />
        <AdminKpi
          label="Total ₦ tracked"
          value={`₦${(s.totalNairaTracked / 1_000_000).toFixed(1)}M`}
          sub={`₦${(s.totalNairaRecovered / 1_000_000).toFixed(1)}M recovered`}
          delta="+₦3.2M this week"
          positive
          icon={<CreditCard size={18} />}
        />
        <AdminKpi
          label="Monthly revenue (MRR)"
          value={formatNaira(s.mrr)}
          sub={`${formatNaira(s.arr)} ARR`}
          delta="+18.7% MoM"
          positive
          icon={<TrendingUp size={18} />}
        />
      </div>

      {/* ── Secondary KPIs ────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Credits logged (all time)", value: s.totalCreditsLogged.toLocaleString() },
          { label: "Credits this week",         value: s.creditsThisWeek.toLocaleString() },
          { label: "Platform repayment rate",   value: `${s.repaymentRate}%` },
          { label: "Default rate",              value: `${s.defaultRate}%` },
        ].map((k) => (
          <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
            <p className="text-vodium-cream/40 text-xs">{k.label}</p>
            <p className="font-serif text-2xl text-vodium-cream mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* MRR chart */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-vodium-cream">Monthly Recurring Revenue</h2>
              <p className="text-vodium-cream/40 text-xs mt-0.5">Nov 2025 – Apr 2026</p>
            </div>
            <div className="text-right">
              <p className="text-vodium-gold font-serif text-xl">{formatNaira(s.mrr)}</p>
              <p className="text-success text-xs mt-0.5">+18.7% MoM</p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-36">
            {ADMIN_MRR_HISTORY.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full flex flex-col items-center">
                  <span className="text-vodium-gold text-[9px] mb-1 opacity-0 group-hover:opacity-100">
                    {formatNaira(m.mrr)}
                  </span>
                  <div
                    className="w-full gold-gradient-bg rounded-t-md transition-all min-h-[4px]"
                    style={{ height: `${(m.mrr / mrrMax) * 112}px` }}
                  />
                </div>
                <span className="text-[10px] text-vodium-cream/35">{m.month.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* University breakdown */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-vodium-cream">University Coverage</h2>
              <p className="text-vodium-cream/40 text-xs mt-0.5">Vendors and credit volume by campus</p>
            </div>
            <span className="badge badge-active text-xs">{ADMIN_UNIVERSITY_BREAKDOWN.length} campuses</span>
          </div>
          <div className="space-y-4">
            {ADMIN_UNIVERSITY_BREAKDOWN.map((u) => {
              const maxVendors = Math.max(...ADMIN_UNIVERSITY_BREAKDOWN.map(x => x.vendors));
              return (
                <div key={u.shortName}>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-vodium-cream/80 font-medium">{u.shortName}</span>
                    <div className="flex items-center gap-4 text-vodium-cream/40">
                      <span>{u.vendors} vendors</span>
                      <span>{u.students.toLocaleString()} students</span>
                      <span className="text-success">{u.repaymentRate}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-vodium-slate rounded-full overflow-hidden">
                    <div
                      className="h-full gold-gradient-bg rounded-full transition-all"
                      style={{ width: `${(u.vendors / maxVendors) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent vendors + activity ─────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent vendor signups */}
        <div className="lg:col-span-2 bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="font-semibold text-vodium-cream flex items-center gap-2">
              <Store size={16} className="text-vodium-gold" /> Recent vendors
            </h2>
            <Link
              href="/admin/vendors"
              className="text-xs text-vodium-gold hover:underline flex items-center gap-1"
            >
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {ADMIN_VENDORS.slice(0, 6).map((v) => (
              <div key={v.id} className="px-6 py-4 flex items-center justify-between table-row-dark">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-vodium-slate flex items-center justify-center flex-shrink-0">
                    <Store size={14} className="text-vodium-gold/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-vodium-cream truncate">{v.businessName}</p>
                    <p className="text-xs text-vodium-cream/40 mt-0.5">{v.university} · {v.vendorType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-vodium-cream/60">{v.studentsCount} students</p>
                    <p className="text-xs text-vodium-gold mt-0.5">{v.mrr > 0 ? formatNaira(v.mrr) + "/mo" : "Trial"}</p>
                  </div>
                  <span className={`badge text-[10px] ${v.status === "ACTIVE" ? "badge-active" : v.status === "TRIAL" ? "badge-trial" : "badge-inactive"}`}>
                    {v.status}
                  </span>
                  <PlanBadge plan={v.plan} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System activity */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-vodium-cream flex items-center gap-2">
              <Activity size={16} className="text-vodium-gold" /> System activity
            </h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {ADMIN_ACTIVITY.map((a) => (
              <div key={a.id} className="px-5 py-4 flex items-start gap-3 table-row-dark">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  a.type === "vendor_joined"  ? "bg-blue-500/10 text-blue-400" :
                  a.type === "payment"        ? "bg-success/10 text-success" :
                  a.type === "milestone"      ? "bg-vodium-gold/10 text-vodium-gold" :
                  a.type === "subscription"   ? "bg-purple-500/10 text-purple-400" :
                  "bg-vodium-slate text-vodium-cream/40"
                }`}>
                  {a.type === "vendor_joined"  && <Store size={13} />}
                  {a.type === "payment"        && <CheckCircle2 size={13} />}
                  {a.type === "milestone"      && <Zap size={13} />}
                  {a.type === "subscription"   && <ArrowUpRight size={13} />}
                  {a.type === "credit_logged"  && <CreditCard size={13} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-vodium-cream/80 leading-relaxed">{a.text}</p>
                  <p className="text-[10px] text-vodium-cream/35 mt-1">{a.subtext}</p>
                  <p className="text-[10px] text-vodium-cream/25 mt-0.5">{a.at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Platform health strip ──────────────────────── */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
        <h2 className="font-semibold text-vodium-cream mb-5 flex items-center gap-2">
          <Shield size={16} className="text-vodium-gold" /> Platform health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "API response",      value: "142ms",  status: "good" },
            { label: "DB uptime (30d)",   value: "99.97%", status: "good" },
            { label: "WhatsApp delivery", value: "98.3%",  status: "good" },
            { label: "Failed payments",   value: "1.2%",   status: "warning" },
          ].map((h) => (
            <div key={h.label}>
              <p className="text-vodium-cream/40 text-xs">{h.label}</p>
              <p className={`font-mono font-bold text-xl mt-1 ${h.status === "good" ? "text-success" : "text-warning"}`}>
                {h.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function AdminKpi({
  label, value, sub, delta, positive, icon,
}: {
  label: string; value: string; sub: string; delta: string; positive: boolean; icon: React.ReactNode;
}) {
  return (
    <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-vodium-cream/40 text-xs uppercase tracking-wider leading-tight">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center text-vodium-gold flex-shrink-0">
          {icon}
        </div>
      </div>
      <p className="font-serif text-2xl md:text-3xl text-vodium-gold">{value}</p>
      <p className="text-vodium-cream/35 text-xs mt-1.5">{sub}</p>
      <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-1 text-xs">
        {positive
          ? <ArrowUpRight size={13} className="text-success" />
          : <AlertCircle size={13} className="text-danger" />}
        <span className={positive ? "text-success" : "text-danger"}>{delta}</span>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    STARTER:    "text-vodium-cream/50 bg-vodium-slate",
    GROWTH:     "text-vodium-gold bg-vodium-gold/10",
    CAMPUS_PRO: "text-purple-400 bg-purple-400/10",
  };
  const labels: Record<string, string> = {
    STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Pro",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${map[plan] ?? ""}`}>
      {labels[plan] ?? plan}
    </span>
  );
}
