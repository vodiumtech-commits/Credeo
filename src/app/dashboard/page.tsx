import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  ArrowRight, Plus, MessageCircle, Zap, Users
} from "lucide-react";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";

export default async function DashboardPage() {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  const credits = await prisma.credit.findMany({
    where: { vendorId: vendor.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Computed stats ──────────────────────────────────────────
  const outstanding = credits.filter((c) =>
    !["PAID", "WRITTEN_OFF"].includes(c.status)
  );
  const totalOwed = outstanding.reduce(
    (s, c) => s + Number(c.amount) - Number(c.amountRepaid), 0
  );
  const paidCredits = credits.filter((c) => c.status === "PAID");
  const paidThisMonth = paidCredits
    .filter((c) => c.closedAt && c.closedAt >= startOfMonth)
    .reduce((s, c) => s + Number(c.amount), 0);
  const overdueList = credits.filter((c) => c.status === "OVERDUE").slice(0, 5);
  const dueSoonList = credits.filter((c) => c.status === "DUE_SOON").slice(0, 5);
  const totalStudents = new Set(credits.map((c) => c.studentId)).size;
  const creditsOwing = outstanding.filter((c) => Number(c.amount) - Number(c.amountRepaid) > 0).length;
  const avgCredit = credits.length ? credits.reduce((s, c) => s + Number(c.amount), 0) / credits.length : 0;
  const creditsThisMonth = credits.filter((c) => c.createdAt >= startOfMonth).length;
  const recoveryRate = paidCredits.length && credits.length
    ? Math.round((paidCredits.length / credits.length) * 100)
    : 0;

  // ── Monthly volume (last 6 months) ────────────────────────
  const monthlyVolume = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthCredits = credits.filter((c) => c.createdAt >= d && c.createdAt < next);
    return {
      month: d.toLocaleString("en-NG", { month: "short" }).slice(0, 3),
      extended: monthCredits.reduce((s, c) => s + Number(c.amount), 0),
      recovered: monthCredits
        .filter((c) => c.status === "PAID")
        .reduce((s, c) => s + Number(c.amount), 0),
    };
  });
  const maxVolume = Math.max(...monthlyVolume.map((m) => m.extended), 1);

  // ── Activity feed (8 most recent events) ──────────────────
  const activity = credits.slice(0, 8).map((c) => ({
    id: c.id,
    type: c.status === "PAID" ? "paid" : c.status === "OVERDUE" ? "overdue" : "credit",
    text:
      c.status === "PAID"
        ? `${c.student.fullName} paid ${formatNaira(Number(c.amount))}`
        : c.status === "OVERDUE"
        ? `${c.student.fullName} is overdue — ${formatNaira(Number(c.amount) - Number(c.amountRepaid))} owed`
        : `Credit of ${formatNaira(Number(c.amount))} recorded for ${c.student.fullName}`,
    subtext: c.description ?? "",
    at: c.createdAt.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
  }));

  // This month's extended total for chart footer
  const thisMonthExtended = monthlyVolume[5]?.extended ?? 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">{vendor.businessName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {vendor.campusLocation ?? "Campus"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-active text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block mr-1" />
            {vendor.subscription?.plan ?? "STARTER"} plan
          </span>
          <Link href="/dashboard/credit/new" className="btn-gold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
            <Plus size={15} /> Add credit
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total owed to you"
          value={formatNaira(totalOwed)}
          sub={`${creditsOwing} credits outstanding`}
          accent
          icon={<TrendingUp size={18} />}
        />
        <KpiCard
          label="Recovered this month"
          value={formatNaira(paidThisMonth)}
          sub={`${recoveryRate}% recovery rate`}
          positive
          icon={<CheckCircle2 size={18} />}
        />
        <KpiCard
          label="Overdue"
          value={String(overdueList.length + (credits.filter((c) => c.status === "OVERDUE").length - overdueList.length))}
          sub="Need attention now"
          danger
          icon={<AlertCircle size={18} />}
        />
        <KpiCard
          label="Due within 2 days"
          value={String(credits.filter((c) => c.status === "DUE_SOON").length)}
          sub="Reminders sent"
          warning
          icon={<Clock size={18} />}
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Monthly chart */}
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
                  <div
                    className="w-[45%] bg-vodium-black/10 rounded-t-sm transition-all"
                    style={{ height: `${(m.extended / maxVolume) * 100}%`, minHeight: m.extended ? "4px" : "0" }}
                  />
                  <div
                    className="w-[45%] bg-vodium-gold rounded-t-sm transition-all"
                    style={{ height: `${(m.recovered / maxVolume) * 100}%`, minHeight: m.recovered ? "4px" : "0" }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-6 pt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">This month extended</p>
              <p className="font-semibold text-vodium-black mt-0.5">{formatNaira(thisMonthExtended)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recovered</p>
              <p className="font-semibold text-success mt-0.5">{formatNaira(paidThisMonth)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Still outstanding</p>
              <p className="font-semibold text-warning mt-0.5">{formatNaira(Math.max(0, thisMonthExtended - paidThisMonth))}</p>
            </div>
          </div>
        </div>

        {/* Quick actions + mini stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-vodium-black rounded-2xl p-5">
            <p className="text-xs text-vodium-cream/40 uppercase tracking-wider mb-4">Quick actions</p>
            <div className="space-y-2">
              {[
                { href: "/dashboard/credit/new", icon: <Plus size={16} className="text-vodium-gold" />, label: "Add a credit" },
                { href: "/dashboard/customers",  icon: <Users size={16} className="text-vodium-gold" />,   label: "View all customers" },
                { href: "https://wa.me/2348012345678?text=LIST", icon: <MessageCircle size={16} className="text-vodium-gold" />, label: "WhatsApp bot", external: true },
              ].map((a) =>
                a.external ? (
                  <a key={a.label} href={a.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-vodium-charcoal hover:bg-vodium-gold/10 transition-colors group">
                    <div className="flex items-center gap-3 text-sm text-vodium-cream/80 group-hover:text-vodium-cream">{a.icon} {a.label}</div>
                    <ArrowRight size={14} className="text-vodium-cream/30 group-hover:text-vodium-gold" />
                  </a>
                ) : (
                  <Link key={a.label} href={a.href}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-vodium-charcoal hover:bg-vodium-gold/10 transition-colors group">
                    <div className="flex items-center gap-3 text-sm text-vodium-cream/80 group-hover:text-vodium-cream">{a.icon} {a.label}</div>
                    <ArrowRight size={14} className="text-vodium-cream/30 group-hover:text-vodium-gold" />
                  </Link>
                )
              )}
            </div>
          </div>
          <div className="bg-white border border-border rounded-2xl p-5 grid grid-cols-2 gap-4">
            <MiniStat label="Total customers" value={String(totalStudents)} />
            <MiniStat label="Avg credit" value={formatNaira(Math.round(avgCredit))} />
            <MiniStat label="This month" value={String(creditsThisMonth)} sub="credits" />
            <MiniStat label="All time" value={String(credits.length)} sub="logged" />
          </div>
        </div>
      </div>

      {/* Due soon + Overdue */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-vodium-black flex items-center gap-2">
              <Clock size={16} className="text-warning" /> Due soon
            </h2>
            <span className="badge badge-due-soon">{dueSoonList.length}</span>
          </div>
          <div className="divide-y divide-border">
            {dueSoonList.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">No upcoming dues</p>
            ) : dueSoonList.map((c) => {
              const daysUntil = Math.ceil((new Date(c.dueDate).getTime() - now.getTime()) / 86_400_000);
              return (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between table-row">
                  <div>
                    <p className="font-medium text-sm text-vodium-black">{c.student.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.student.matricNumber ?? "—"} · Due {new Date(c.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-warning text-sm">{formatNaira(Number(c.amount) - Number(c.amountRepaid))}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">in {Math.max(0, daysUntil)} day{daysUntil !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-3 border-t border-border">
            <Link href="/dashboard/credits" className="text-sm text-vodium-gold hover:underline flex items-center gap-1">
              View all credits <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-vodium-black flex items-center gap-2">
              <AlertCircle size={16} className="text-danger" /> Overdue
            </h2>
            <span className="badge badge-overdue">{credits.filter((c) => c.status === "OVERDUE").length}</span>
          </div>
          <div className="divide-y divide-border">
            {overdueList.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">No overdue credits</p>
            ) : overdueList.map((c) => {
              const daysOver = Math.floor((now.getTime() - new Date(c.dueDate).getTime()) / 86_400_000);
              return (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between table-row">
                  <div>
                    <p className="font-medium text-sm text-vodium-black">{c.student.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.student.matricNumber ?? "—"} · {daysOver} day{daysOver !== 1 ? "s" : ""} overdue
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-danger text-sm">{formatNaira(Number(c.amount) - Number(c.amountRepaid))}</p>
                    <button className="text-xs text-vodium-gold hover:underline mt-0.5 block">Send reminder</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-3 border-t border-border">
            <Link href="/dashboard/credits" className="text-sm text-vodium-gold hover:underline flex items-center gap-1">
              View overdue credits <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-vodium-black flex items-center gap-2">
            <Zap size={16} className="text-vodium-gold" /> Recent activity
          </h2>
        </div>
        <div className="divide-y divide-border">
          {activity.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-muted-foreground text-sm">No activity yet.</p>
              <Link href="/dashboard/credit/new" className="btn-gold px-5 py-2.5 rounded-xl text-sm mt-4 inline-block">
                Record your first credit
              </Link>
            </div>
          ) : activity.map((a) => (
            <div key={a.id} className="px-6 py-4 flex items-start gap-4 table-row">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                a.type === "paid"    ? "bg-success/10 text-success" :
                a.type === "overdue" ? "bg-danger/10 text-danger" :
                "bg-vodium-gold/10 text-vodium-gold"
              }`}>
                {a.type === "paid"    && <CheckCircle2 size={15} />}
                {a.type === "overdue" && <AlertCircle size={15} />}
                {a.type === "credit"  && <Plus size={15} />}
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
        <p className={`text-xs uppercase tracking-wider ${accent ? "text-vodium-cream/50" : "text-muted-foreground"}`}>{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
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
