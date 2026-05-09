import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, AlertCircle, CheckCircle2,
  Clock, ArrowRight, Plus, MessageCircle, Zap
} from "lucide-react";
import {
  DEMO_VENDOR, VENDOR_STATS, DEMO_DUE_SOON, DEMO_OVERDUE,
  DEMO_ACTIVITY, VENDOR_MONTHLY_VOLUME,
} from "@/lib/data/demo-data";
import { formatNaira } from "@/lib/utils";

// Pull from demo; replace with prisma query once auth is wired
function getDashboardData() {
  return {
    vendor: DEMO_VENDOR,
    stats: VENDOR_STATS,
    dueSoon: DEMO_DUE_SOON,
    overdue: DEMO_OVERDUE,
    activity: DEMO_ACTIVITY,
    monthlyVolume: VENDOR_MONTHLY_VOLUME,
  };
}

export default function DashboardPage() {
  const { vendor, stats, dueSoon, overdue, activity, monthlyVolume } = getDashboardData();
  const maxVolume = Math.max(...monthlyVolume.map((m) => m.extended));

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* ── Page header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">
            {vendor.businessName}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {vendor.university.name} · {vendor.campusLocation}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-active text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            {vendor.subscription.plan} plan
          </span>
          <Link
            href="/dashboard/credit/new"
            className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2"
          >
            <Plus size={15} /> Add credit
          </Link>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total owed to you"
          value={formatNaira(stats.totalOwed)}
          sub={`${stats.customersOwing} customers owing`}
          accent
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          label="Recovered this month"
          value={formatNaira(stats.paidThisMonth)}
          sub={`${stats.recoveryRate}% recovery rate`}
          positive
          icon={<CheckCircle2 size={18} />}
        />
        <KpiCard
          label="Overdue"
          value={String(stats.overdueCount)}
          sub="Need attention now"
          danger
          icon={<AlertCircle size={18} />}
        />
        <KpiCard
          label="Due within 2 days"
          value={String(stats.dueSoonCount)}
          sub="Reminders sent"
          warning
          icon={<Clock size={18} />}
        />
      </div>

      {/* ── Main grid ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Monthly volume chart (spans 3 cols) */}
        <div className="lg:col-span-3 bg-white border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-semibold text-vodium-black">Credit volume</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Extended vs recovered, last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded bg-vodium-black/20 inline-block" /> Extended
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded bg-vodium-gold inline-block" /> Recovered
              </span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthlyVolume.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 justify-center" style={{ height: "120px" }}>
                  {/* Extended bar */}
                  <div
                    className="w-[45%] bg-vodium-black/10 rounded-t-sm transition-all"
                    style={{ height: `${(m.extended / maxVolume) * 100}%` }}
                  />
                  {/* Recovered bar */}
                  <div
                    className="w-[45%] bg-vodium-gold rounded-t-sm transition-all"
                    style={{ height: `${(m.recovered / maxVolume) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-6 pt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">This month extended</p>
              <p className="font-semibold text-vodium-black mt-0.5">{formatNaira(245_000)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recovered</p>
              <p className="font-semibold text-success mt-0.5">{formatNaira(stats.paidThisMonth)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Still outstanding</p>
              <p className="font-semibold text-warning mt-0.5">{formatNaira(245_000 - stats.paidThisMonth)}</p>
            </div>
          </div>
        </div>

        {/* Quick actions + stats (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick actions */}
          <div className="bg-vodium-black rounded-2xl p-5">
            <p className="text-xs text-vodium-cream/40 uppercase tracking-wider mb-4">Quick actions</p>
            <div className="space-y-2">
              <Link
                href="/dashboard/credit/new"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-vodium-charcoal hover:bg-vodium-gold/10 transition-colors group"
              >
                <div className="flex items-center gap-3 text-sm text-vodium-cream/80 group-hover:text-vodium-cream">
                  <Plus size={16} className="text-vodium-gold" /> Add a credit
                </div>
                <ArrowRight size={14} className="text-vodium-cream/30 group-hover:text-vodium-gold" />
              </Link>
              <Link
                href="/dashboard/customers"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-vodium-charcoal hover:bg-vodium-gold/10 transition-colors group"
              >
                <div className="flex items-center gap-3 text-sm text-vodium-cream/80 group-hover:text-vodium-cream">
                  <Users size={16} className="text-vodium-gold" /> View all customers
                </div>
                <ArrowRight size={14} className="text-vodium-cream/30 group-hover:text-vodium-gold" />
              </Link>
              <a
                href="https://wa.me/2348012345678?text=LIST"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-vodium-charcoal hover:bg-vodium-gold/10 transition-colors group"
              >
                <div className="flex items-center gap-3 text-sm text-vodium-cream/80 group-hover:text-vodium-cream">
                  <MessageCircle size={16} className="text-vodium-gold" /> WhatsApp bot
                </div>
                <ArrowRight size={14} className="text-vodium-cream/30 group-hover:text-vodium-gold" />
              </a>
            </div>
          </div>

          {/* Mini stats */}
          <div className="bg-white border border-border rounded-2xl p-5 grid grid-cols-2 gap-4">
            <MiniStat label="Total customers" value={String(stats.totalStudents)} />
            <MiniStat label="Avg credit" value={formatNaira(stats.avgCreditAmount)} />
            <MiniStat label="This month" value={String(stats.creditsThisMonth)} sub="credits" />
            <MiniStat label="Since Nov '25" value={String(vendor.totalCreditsLogged)} sub="logged" />
          </div>
        </div>
      </div>

      {/* ── Due soon + Overdue ─────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Due soon */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-vodium-black flex items-center gap-2">
              <Clock size={16} className="text-warning" /> Due soon
            </h2>
            <span className="badge badge-due-soon">{dueSoon.length}</span>
          </div>
          <div className="divide-y divide-border">
            {dueSoon.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between table-row">
                <div>
                  <p className="font-medium text-sm text-vodium-black">{c.studentName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.matricNumber} · Due {c.dueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-warning text-sm">{formatNaira(c.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    in {c.daysUntilDue} day{c.daysUntilDue !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-border">
            <Link href="/dashboard/credits" className="text-sm text-vodium-gold hover:underline flex items-center gap-1">
              View all credits <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-vodium-black flex items-center gap-2">
              <AlertCircle size={16} className="text-danger" /> Overdue
            </h2>
            <span className="badge badge-overdue">{overdue.length}</span>
          </div>
          <div className="divide-y divide-border">
            {overdue.map((c) => (
              <div key={c.id} className="px-6 py-4 flex items-center justify-between table-row">
                <div>
                  <p className="font-medium text-sm text-vodium-black">{c.studentName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.matricNumber} · {c.daysOverdue} day{c.daysOverdue !== 1 ? "s" : ""} overdue
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-danger text-sm">{formatNaira(c.amount)}</p>
                  <button className="text-xs text-vodium-gold hover:underline mt-0.5 block">
                    Send reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-border">
            <Link href="/dashboard/credits?filter=overdue" className="text-sm text-vodium-gold hover:underline flex items-center gap-1">
              View overdue credits <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Activity feed ─────────────────────────────── */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-vodium-black flex items-center gap-2">
            <Zap size={16} className="text-vodium-gold" /> Recent activity
          </h2>
        </div>
        <div className="divide-y divide-border">
          {activity.map((a) => (
            <div key={a.id} className="px-6 py-4 flex items-start gap-4 table-row">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                a.type === "paid"     ? "bg-success/10 text-success" :
                a.type === "credit"  ? "bg-vodium-gold/10 text-vodium-gold" :
                a.type === "overdue" ? "bg-danger/10 text-danger" :
                a.type === "score"   ? "bg-blue-50 text-blue-600" :
                "bg-muted text-muted-foreground"
              }`}>
                {a.type === "paid"     && <CheckCircle2 size={15} />}
                {a.type === "credit"   && <Plus size={15} />}
                {a.type === "overdue"  && <AlertCircle size={15} />}
                {a.type === "reminder" && <MessageCircle size={15} />}
                {a.type === "score"    && <TrendingDown size={15} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-vodium-black">{a.text}</p>
                {a.subtext && <p className="text-xs text-muted-foreground mt-0.5">{a.subtext}</p>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{a.at}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent, positive, danger, warning, icon,
}: {
  label: string; value: string; sub: string;
  accent?: boolean; positive?: boolean; danger?: boolean; warning?: boolean;
  icon: React.ReactNode;
}) {
  const bgClass = accent ? "bg-vodium-black text-vodium-cream border-vodium-gold/30" : "bg-white border-border";
  const valClass = accent ? "text-vodium-gold" : danger ? "text-danger" : warning ? "text-warning" : positive ? "text-success" : "text-vodium-black";
  const iconBg = accent ? "bg-vodium-gold/15 text-vodium-gold" : danger ? "bg-danger/10 text-danger" : warning ? "bg-warning/10 text-warning" : positive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground";

  return (
    <div className={`rounded-2xl border p-5 ${bgClass}`}>
      <div className="flex items-start justify-between mb-4">
        <p className={`text-xs uppercase tracking-wider ${accent ? "text-vodium-cream/50" : "text-muted-foreground"}`}>
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`font-serif text-2xl md:text-3xl ${valClass}`}>{value}</p>
      <p className={`text-xs mt-1.5 ${accent ? "text-vodium-cream/40" : "text-muted-foreground"}`}>{sub}</p>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-vodium-black mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

