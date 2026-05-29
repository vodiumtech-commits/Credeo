import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Store, Mail, Phone, MapPin, Calendar,
  CreditCard, TrendingUp, AlertCircle, CheckCircle2,
  User, Building2, BadgeCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import { VendorStatusActions } from "@/components/ui/vendor-status-actions";
import type { CreditStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<CreditStatus, string> = {
  OUTSTANDING:    "badge badge-outstanding",
  DUE_SOON:       "badge badge-due-soon",
  OVERDUE:        "badge badge-overdue",
  PARTIALLY_PAID: "badge badge-partial",
  PAID:           "badge badge-paid",
  WRITTEN_OFF:    "badge badge-written",
};

const STATUS_LABEL: Record<CreditStatus, string> = {
  OUTSTANDING: "Outstanding", DUE_SOON: "Due soon", OVERDUE: "Overdue",
  PARTIALLY_PAID: "Partial", PAID: "Paid", WRITTEN_OFF: "Written off",
};

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      university:   { select: { name: true, shortName: true, city: true, state: true } },
      subscription: true,
      credits: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { student: { select: { fullName: true, matricNumber: true } } },
      },
    },
  });

  if (!vendor) notFound();

  // Aggregate totals
  const agg = await prisma.credit.aggregate({
    where: { vendorId: vendor.id },
    _sum:   { amount: true, amountRepaid: true },
    _count: { _all: true },
  });
  const totalAmount   = Number(agg._sum.amount ?? 0);
  const totalRepaid   = Number(agg._sum.amountRepaid ?? 0);
  const totalCredits  = agg._count._all;

  const overdueCount  = await prisma.credit.count({ where: { vendorId: vendor.id, status: "OVERDUE" } });
  const paidCount     = await prisma.credit.count({ where: { vendorId: vendor.id, status: "PAID" } });
  const studentCount  = await prisma.credit.findMany({
    where: { vendorId: vendor.id }, select: { studentId: true }, distinct: ["studentId"],
  }).then((r) => r.length);

  const recoveryRate = totalCredits > 0 ? Math.round((paidCount / totalCredits) * 100) : 0;

  const sub = vendor.subscription;
  const statusColor =
    vendor.status === "ACTIVE"    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    vendor.status === "SUSPENDED" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
                                    "text-vodium-cream/40 bg-white/[0.05] border-white/[0.08]";

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/vendors"
          className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-vodium-cream/40 hover:text-vodium-cream hover:border-white/[0.18] transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="font-serif text-vodium-gold text-lg leading-none">
                {vendor.businessName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-serif text-2xl text-vodium-cream leading-tight">{vendor.businessName}</h1>
              <p className="text-vodium-cream/40 text-sm mt-0.5">{vendor.ownerName}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusColor}`}>
              {vendor.status}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <VendorStatusActions vendorId={vendor.id} currentStatus={vendor.status} businessName={vendor.businessName} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total tracked",   value: formatNaira(totalAmount),   icon: <CreditCard size={14} />,   color: "text-vodium-gold" },
          { label: "Recovered",       value: formatNaira(totalRepaid),    icon: <CheckCircle2 size={14} />, color: "text-emerald-400" },
          { label: "Students",        value: String(studentCount),        icon: <User size={14} />,         color: "text-sky-400" },
          { label: "Recovery rate",   value: `${recoveryRate}%`,         icon: <TrendingUp size={14} />,   color: "text-vodium-gold" },
        ].map((k) => (
          <div key={k.label} className="bg-vodium-charcoal border border-white/[0.06] rounded-xl p-4">
            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
            <p className={`font-serif text-2xl ${k.color} leading-none`}>{k.value}</p>
            <p className="text-[11px] text-vodium-cream/35 mt-1.5 uppercase tracking-wider">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Contact & business info */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-vodium-cream flex items-center gap-2">
            <Store size={14} className="text-vodium-gold" /> Business info
          </h2>
          <div className="space-y-4">
            <InfoRow icon={<User size={13} />}      label="Owner"        value={vendor.ownerName} />
            <InfoRow icon={<Phone size={13} />}     label="Phone"        value={vendor.phone} />
            <InfoRow icon={<Mail size={13} />}      label="Email"        value={vendor.email} />
            <InfoRow icon={<BadgeCheck size={13} />} label="Type"        value={vendor.vendorType.replace(/_/g, " ")} />
            <InfoRow icon={<MapPin size={13} />}    label="Campus"       value={vendor.campusLocation ?? "—"} />
            <InfoRow
              icon={<Building2 size={13} />}
              label="University"
              value={`${vendor.university.shortName ?? vendor.university.name} — ${vendor.university.city}, ${vendor.university.state}`}
            />
            <InfoRow
              icon={<Calendar size={13} />}
              label="Joined"
              value={new Date(vendor.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            />
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-vodium-cream flex items-center gap-2">
            <TrendingUp size={14} className="text-vodium-gold" /> Subscription
          </h2>
          {sub ? (
            <div className="space-y-4">
              <InfoRow label="Plan"    value={sub.plan.replace(/_/g, " ")} />
              <InfoRow label="Status"  value={sub.status} />
              <InfoRow label="MRR"     value={sub.status === "ACTIVE" ? formatNaira(Number(sub.monthlyAmount)) + "/mo" : "Trial (free)"} />
              {sub.trialEndsAt && (
                <InfoRow
                  label="Trial ends"
                  value={new Date(sub.trialEndsAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                />
              )}
              {sub.currentPeriodEnd && (
                <InfoRow
                  label="Period end"
                  value={new Date(sub.currentPeriodEnd).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                />
              )}
            </div>
          ) : (
            <p className="text-vodium-cream/30 text-sm">No subscription record</p>
          )}

          <div className="pt-2 border-t border-white/[0.06]">
            <h3 className="text-xs text-vodium-cream/40 uppercase tracking-wider mb-3">Credit summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-serif text-lg text-vodium-gold">{totalCredits}</p>
                <p className="text-[10px] text-vodium-cream/30 mt-0.5">Total</p>
              </div>
              <div>
                <p className={`font-serif text-lg ${overdueCount > 0 ? "text-rose-400" : "text-vodium-cream/40"}`}>{overdueCount}</p>
                <p className="text-[10px] text-vodium-cream/30 mt-0.5">Overdue</p>
              </div>
              <div>
                <p className="font-serif text-lg text-emerald-400">{paidCount}</p>
                <p className="text-[10px] text-vodium-cream/30 mt-0.5">Paid</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent credits */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-vodium-cream flex items-center gap-2">
            <CreditCard size={14} className="text-vodium-gold" /> Recent credits
          </h2>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle size={12} /> {overdueCount} overdue
            </span>
          )}
        </div>

        {vendor.credits.length === 0 ? (
          <div className="px-6 py-12 text-center text-vodium-cream/25 text-sm">No credits recorded yet</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {vendor.credits.map((c) => (
              <div key={c.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-vodium-cream font-medium truncate">{c.student.fullName}</p>
                  <p className="text-xs text-vodium-cream/35 mt-0.5">
                    {c.description ?? "No description"} · Due {new Date(c.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                  <div className="text-right">
                    <p className="font-serif text-sm text-vodium-gold">{formatNaira(Number(c.amount))}</p>
                    {Number(c.amountRepaid) > 0 && (
                      <p className="text-[10px] text-emerald-400 mt-0.5">{formatNaira(Number(c.amountRepaid))} paid</p>
                    )}
                  </div>
                  <span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-vodium-cream/30 mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[10px] text-vodium-cream/30 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-vodium-cream mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}
