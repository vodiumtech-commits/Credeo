import {
  TrendingUp, Users, CreditCard, ArrowUpRight, CheckCircle2,
  AlertCircle, BarChart3, PieChart
} from "lucide-react";
import {
  ADMIN_PLATFORM_STATS, ADMIN_MRR_HISTORY, ADMIN_UNIVERSITY_BREAKDOWN,
  ADMIN_VENDORS
} from "@/lib/data/demo-data";
import { formatNaira } from "@/lib/utils";

// Extended mock data for analytics
const REPAYMENT_HISTORY = [
  { month: "Nov '25", rate: 68.2, credits: 234 },
  { month: "Dec '25", rate: 70.1, credits: 891 },
  { month: "Jan '26", rate: 71.5, credits: 1543 },
  { month: "Feb '26", rate: 72.8, credits: 2210 },
  { month: "Mar '26", rate: 72.9, credits: 3107 },
  { month: "Apr '26", rate: 73.4, credits: 3987 },
];

const SCORE_DISTRIBUTION = [
  { tier: "Excellent (750–1000)", count: 892,  pct: 22.8, color: "#16A34A" },
  { tier: "Good (650–749)",       count: 1234, pct: 31.6, color: "#C9A961" },
  { tier: "Fair (450–649)",       count: 1103, pct: 28.2, color: "#D97706" },
  { tier: "Poor (0–449)",         count: 685,  pct: 17.5, color: "#DC2626" },
];

const TOP_VENDORS = [
  { name: "Oga Emeka's Mini Mart", university: "UNILAG", students: 102, collected: 512_000, rate: 91 },
  { name: "Baba Wale's Food Canteen", university: "UNILAG", students: 89, collected: 780_000, rate: 88 },
  { name: "Mama Taiwo's Provisions", university: "UNILAG", students: 63, collected: 324_500, rate: 82 },
  { name: "Campus Bites Canteen", university: "UI", students: 45, collected: 256_000, rate: 79 },
  { name: "Ibadan Student Supplies", university: "UI", students: 41, collected: 245_000, rate: 77 },
];

const VENDOR_TYPE_BREAKDOWN = [
  { type: "Food Canteen",    count: 38, pct: 30 },
  { type: "Provision Shop",  count: 29, pct: 23 },
  { type: "Mini Mart",       count: 22, pct: 17 },
  { type: "Print Shop",      count: 16, pct: 13 },
  { type: "Laundry",         count: 12, pct: 9 },
  { type: "Other",           count: 10, pct: 8 },
];

export default function AdminAnalyticsPage() {
  const s = ADMIN_PLATFORM_STATS;
  const mrrMax = Math.max(...ADMIN_MRR_HISTORY.map((m) => m.mrr));
  const rateMax = Math.max(...REPAYMENT_HISTORY.map((m) => m.rate));

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1">Platform analytics</p>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Analytics Dashboard</h1>
        <p className="text-vodium-cream/40 text-sm mt-0.5">Nov 2025 – Apr 2026 · Updated every hour</p>
      </div>

      {/* ── Revenue metrics ────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-vodium-cream/60 uppercase tracking-wider mb-4">
          Revenue
        </h2>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            { label: "MRR", value: formatNaira(s.mrr), sub: "Monthly recurring revenue", delta: "+18.7% MoM", positive: true },
            { label: "ARR", value: formatNaira(s.arr), sub: "Annualized run rate", delta: "+₦1.6M from March", positive: true },
            { label: "Avg revenue per vendor", value: formatNaira(Math.round(s.mrr / s.activeVendors)), sub: "Active vendors only", delta: "+2.1% MoM", positive: true },
          ].map((k) => (
            <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-5">
              <p className="text-vodium-cream/40 text-xs">{k.label}</p>
              <p className="font-serif text-2xl text-vodium-gold mt-1.5">{k.value}</p>
              <p className="text-vodium-cream/30 text-xs mt-1">{k.sub}</p>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/[0.05] text-xs text-success">
                <ArrowUpRight size={12} /> {k.delta}
              </div>
            </div>
          ))}
        </div>

        {/* MRR + vendor growth chart */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-1">MRR growth</h3>
            <p className="text-vodium-cream/35 text-xs mb-6">₦180K → ₦890K in 6 months</p>
            <div className="flex items-end gap-2 h-32">
              {ADMIN_MRR_HISTORY.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full gold-gradient-bg rounded-t-sm min-h-[4px] transition-all"
                    style={{ height: `${(m.mrr / mrrMax) * 112}px` }}
                  />
                  <span className="text-[9px] text-vodium-cream/30">{m.month.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-vodium-cream mb-1">Vendor growth</h3>
            <p className="text-vodium-cream/35 text-xs mb-6">18 → 127 vendors in 6 months</p>
            <div className="flex items-end gap-2 h-32">
              {ADMIN_MRR_HISTORY.map((m) => {
                const maxV = 127;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <div
                      className="w-full bg-blue-400/60 rounded-t-sm min-h-[4px] transition-all"
                      style={{ height: `${(m.vendors / maxV) * 112}px` }}
                    />
                    <span className="text-[9px] text-vodium-cream/30">{m.month.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Credit volume & repayment ──────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-vodium-cream/60 uppercase tracking-wider mb-4">
          Credit & repayment
        </h2>
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {[
            { label: "Total ₦ tracked", value: `₦${(s.totalNairaTracked / 1e6).toFixed(1)}M`, sub: "Across all vendors", positive: true },
            { label: "Total ₦ recovered", value: `₦${(s.totalNairaRecovered / 1e6).toFixed(1)}M`, sub: "73.4% of all credit", positive: true },
            { label: "Avg credit amount", value: formatNaira(s.averageCreditAmount), sub: "Per single credit", positive: false },
            { label: "Default rate", value: `${s.defaultRate}%`, sub: "Written off or abandoned", positive: false },
          ].map((k) => (
            <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
              <p className="text-vodium-cream/40 text-xs">{k.label}</p>
              <p className={`font-serif text-2xl mt-1 ${k.positive ? "text-vodium-gold" : "text-vodium-cream"}`}>{k.value}</p>
              <p className="text-vodium-cream/30 text-xs mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Repayment rate trend */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-vodium-cream">Repayment rate trend</h3>
              <p className="text-vodium-cream/35 text-xs mt-0.5">Platform-wide, monthly</p>
            </div>
            <div className="text-right">
              <p className="text-success font-bold text-lg">{s.repaymentRate}%</p>
              <p className="text-vodium-cream/35 text-xs">Current rate</p>
            </div>
          </div>
          <div className="flex items-end gap-4 h-24">
            {REPAYMENT_HISTORY.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <p className="text-[9px] text-vodium-cream/40 mb-1">{m.rate}%</p>
                <div
                  className="w-full bg-success/60 rounded-t-sm min-h-[4px]"
                  style={{ height: `${(m.rate / rateMax) * 72}px` }}
                />
                <span className="text-[9px] text-vodium-cream/25">{m.month.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Student score distribution ─────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-vodium-cream/60 uppercase tracking-wider mb-4">
          Vodium score distribution
        </h2>
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-semibold text-vodium-cream">Student score breakdown</h3>
              <p className="text-vodium-cream/35 text-xs mt-0.5">{s.uniqueStudentsWithHistory.toLocaleString()} students with at least 1 credit</p>
            </div>
          </div>
          <div className="space-y-5">
            {SCORE_DISTRIBUTION.map((t) => (
              <div key={t.tier}>
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                    <span className="text-vodium-cream/70">{t.tier}</span>
                  </div>
                  <div className="flex items-center gap-4 text-vodium-cream/40">
                    <span>{t.count.toLocaleString()} students</span>
                    <span className="font-mono">{t.pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-vodium-slate rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${t.pct}%`, background: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top vendors + business types ──────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top performing vendors */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-vodium-cream mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-vodium-gold" /> Top performing vendors
          </h3>
          <div className="space-y-4">
            {TOP_VENDORS.map((v, i) => (
              <div key={v.name} className="flex items-center gap-3">
                <span className="text-vodium-gold font-mono text-sm w-5 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-vodium-cream truncate">{v.name}</p>
                  <p className="text-xs text-vodium-cream/35">{v.university} · {v.students} students</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-vodium-gold">{formatNaira(v.collected)}</p>
                  <p className="text-xs text-success mt-0.5">{v.rate}% rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor type breakdown */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6">
          <h3 className="font-semibold text-vodium-cream mb-5 flex items-center gap-2">
            <BarChart3 size={16} className="text-vodium-gold" /> Vendor types
          </h3>
          <div className="space-y-3">
            {VENDOR_TYPE_BREAKDOWN.map((t) => (
              <div key={t.type}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-vodium-cream/70">{t.type}</span>
                  <div className="flex items-center gap-3 text-vodium-cream/40">
                    <span>{t.count} vendors</span>
                    <span className="font-mono w-8 text-right">{t.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-vodium-slate rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vodium-gold/60 rounded-full"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
