import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { getVendorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/utils";
import type { CreditStatus } from "@prisma/client";

const STATUS_BADGE: Record<CreditStatus, string> = {
  OUTSTANDING:    "badge badge-outstanding",
  DUE_SOON:       "badge badge-due-soon",
  OVERDUE:        "badge badge-overdue",
  PARTIALLY_PAID: "badge badge-outstanding",
  PAID:           "badge badge-paid",
  WRITTEN_OFF:    "badge badge-inactive",
};

const STATUS_LABEL: Record<CreditStatus, string> = {
  OUTSTANDING:    "Outstanding",
  DUE_SOON:       "Due soon",
  OVERDUE:        "Overdue",
  PARTIALLY_PAID: "Partial",
  PAID:           "Paid",
  WRITTEN_OFF:    "Written off",
};

export default async function CreditsPage() {
  const vendor = await getVendorSession();
  if (!vendor) redirect("/login");

  const credits = await prisma.credit.findMany({
    where: { vendorId: vendor.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  const outstanding = credits
    .filter((c) => ["OUTSTANDING", "DUE_SOON"].includes(c.status))
    .reduce((s, c) => s + Number(c.amount) - Number(c.amountRepaid), 0);
  const overdue = credits
    .filter((c) => c.status === "OVERDUE")
    .reduce((s, c) => s + Number(c.amount) - Number(c.amountRepaid), 0);
  const paid = credits
    .filter((c) => c.status === "PAID")
    .reduce((s, c) => s + Number(c.amount), 0);
  const total = credits.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-black">Credits</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{credits.length} total credit records</p>
        </div>
        <Link href="/dashboard/credit/new" className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <Plus size={15} /> New credit
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Outstanding",    value: formatNaira(outstanding), color: "border-l-warning" },
          { label: "Overdue",        value: formatNaira(overdue),     color: "border-l-danger" },
          { label: "Recovered",      value: formatNaira(paid),        color: "border-l-success" },
          { label: "Total extended", value: formatNaira(total),       color: "border-l-vodium-gold" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border border-border border-l-4 ${s.color} pl-5 pr-4 py-4`}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-serif text-xl text-vodium-black mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-6 py-3 bg-muted/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
          <span className="col-span-3">Student</span>
          <span className="col-span-3">Description</span>
          <span className="col-span-2 text-right">Amount</span>
          <span className="col-span-2 text-right">Repaid</span>
          <span className="col-span-1 text-center">Due</span>
          <span className="col-span-1 text-center">Status</span>
        </div>

        {credits.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-muted-foreground mb-4">No credits recorded yet.</p>
            <Link href="/dashboard/credit/new" className="btn-gold px-6 py-3 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus size={15} /> Record your first credit
            </Link>
          </div>
        ) : (
          credits.map((c) => (
            <div key={c.id} className="md:grid grid-cols-12 items-center px-6 py-4 border-t border-border table-row gap-2">
              <div className="col-span-3">
                <p className="font-medium text-sm text-vodium-black">{c.student.fullName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.student.matricNumber ?? "—"}</p>
              </div>
              <div className="col-span-3">
                <p className="text-sm text-muted-foreground truncate">{c.description ?? "—"}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className="font-semibold text-sm text-vodium-black">{formatNaira(Number(c.amount))}</p>
              </div>
              <div className="col-span-2 text-right">
                <p className={`text-sm font-medium ${Number(c.amountRepaid) > 0 ? "text-success" : "text-muted-foreground"}`}>
                  {formatNaira(Number(c.amountRepaid))}
                </p>
              </div>
              <div className="col-span-1 text-center">
                <p className="text-xs text-muted-foreground">
                  {new Date(c.dueDate).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="col-span-1 flex justify-center">
                <span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span>
              </div>
            </div>
          ))
        )}

        {credits.length > 0 && (
          <div className="px-6 py-4 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>Showing {credits.length} credit{credits.length !== 1 ? "s" : ""}</span>
            <Link href="/dashboard/credit/new" className="text-vodium-gold hover:underline flex items-center gap-1">
              Add new <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
