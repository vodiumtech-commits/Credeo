import { notFound } from "next/navigation";
import { CheckCircle2, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyInvoiceToken } from "@/lib/bnpl-token";
import { formatNaira } from "@/lib/utils";
import { InvoiceDownloadButton } from "@/components/ui/invoice-download";

export const dynamic = "force-dynamic";

/** Ink-friendly A4 rendering when the customer saves the invoice as a PDF. */
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm; }
  html, body { background: #fff !important; }
  .no-print { display: none !important; }
  #invoice-root { background: #fff !important; padding: 0 !important; min-height: auto !important; display: block !important; }
  #invoice-sheet { background: #fff !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
  #invoice-sheet .sheet-head { background: #fafafa !important; }
  /* Dark theme text -> readable ink, but keep brand-coloured accents. */
  #invoice-sheet *:not(.print-accent) { color: #1f2937 !important; }
  #invoice-sheet .muted, #invoice-sheet .muted * { color: #6b7280 !important; }
  #invoice-sheet hr, #invoice-sheet .border-t, #invoice-sheet .border-b { border-color: #e5e7eb !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Awaiting payment",
  PARTIALLY_PAID: "Partly paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

/** Public, unauthenticated invoice view opened from the customer's WhatsApp link. */
export default async function PublicInvoicePage({ params }: { params: { token: string } }) {
  const invoiceId = verifyInvoiceToken(params.token);
  if (!invoiceId) notFound();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, student: true, organization: true, branch: true },
  });
  if (!invoice) notFound();

  const brand = invoice.organization.brandColor || "#C9A961";
  const storeName = invoice.organization.name;
  const total = Number(invoice.total);
  const paid = Number(invoice.amountPaid);
  const outstanding = Math.max(0, total - paid);
  const isPaid = invoice.status === "PAID";

  return (
    <div id="invoice-root" className="min-h-dvh bg-[#0A0A0A] text-vodium-cream px-5 py-10 flex justify-center">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="w-full max-w-lg">
        {/* Store header */}
        <div className="flex items-center gap-3 justify-center mb-6 no-print">
          {invoice.organization.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invoice.organization.logoUrl} alt={storeName} className="w-10 h-10 rounded-xl object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-serif text-lg"
                 style={{ backgroundColor: `${brand}1a`, color: brand }}>
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-serif tracking-[0.14em] text-sm" style={{ color: brand }}>{storeName.toUpperCase()}</span>
        </div>

        <div id="invoice-sheet" className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden">
          {/* Head */}
          <div className="sheet-head p-6 border-b border-white/[0.06]" style={{ background: `linear-gradient(140deg, ${brand}14, transparent)` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="print-accent text-xs uppercase tracking-[0.2em] inline-flex items-center gap-1.5" style={{ color: brand }}>
                  <FileText size={13} /> Invoice
                </p>
                <p className="text-sm font-semibold mt-2">{storeName}</p>
                <h1 className="print-accent font-serif text-2xl mt-1" style={{ color: brand }}>{formatNaira(total)}</h1>
                <p className="muted text-xs text-vodium-cream/40 mt-1">{invoice.invoiceNumber}</p>
              </div>
              <span
                className="print-accent text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0"
                style={
                  isPaid
                    ? { backgroundColor: "rgba(52,211,153,.15)", color: "#6ee7b7" }
                    : { backgroundColor: `${brand}22`, color: brand }
                }
              >
                {STATUS_LABEL[invoice.status] ?? invoice.status}
              </span>
            </div>
            <p className="text-sm text-vodium-cream/55 mt-4">
              Billed to <strong className="text-vodium-cream">{invoice.student.fullName}</strong>
            </p>
            <p className="muted text-xs text-vodium-cream/40 mt-0.5">
              Due {invoice.dueDate.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              {invoice.branch ? ` · ${invoice.branch.name}` : ""}
            </p>
          </div>

          {/* Items */}
          <div className="p-6 space-y-3">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-vodium-cream">{item.name}</p>
                  <p className="text-xs text-vodium-cream/35">
                    {item.quantity} × {formatNaira(Number(item.unitPrice))}
                  </p>
                </div>
                <p className="text-vodium-cream/80 shrink-0">{formatNaira(Number(item.totalPrice))}</p>
              </div>
            ))}

            <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-1.5 text-sm">
              <Line label="Subtotal" value={formatNaira(Number(invoice.subtotal))} />
              {Number(invoice.discountAmount) > 0 && (
                <Line label="Discount" value={`− ${formatNaira(Number(invoice.discountAmount))}`} />
              )}
              <div className="flex justify-between font-semibold pt-1.5">
                <span>Total</span>
                <span className="print-accent" style={{ color: brand }}>{formatNaira(total)}</span>
              </div>
              {paid > 0 && (
                <>
                  <Line label="Paid" value={`− ${formatNaira(paid)}`} />
                  <div className="flex justify-between font-semibold">
                    <span>Balance due</span>
                    <span className="print-accent" style={{ color: brand }}>{formatNaira(outstanding)}</span>
                  </div>
                </>
              )}
            </div>

            {invoice.notes && (
              <p className="text-xs text-vodium-cream/45 pt-3 border-t border-white/[0.06] leading-relaxed">
                {invoice.notes}
              </p>
            )}

            {isPaid ? (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3 flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <p className="text-sm text-emerald-200">This invoice has been paid in full. Thank you!</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <p className="text-sm text-vodium-cream/70">
                  Please settle <strong className="text-vodium-cream">{formatNaira(outstanding)}</strong> by the due date.
                </p>
                <p className="text-xs text-vodium-cream/40 mt-1">
                  Pay {storeName} directly — they&apos;ll mark this invoice as paid once received.
                </p>
              </div>
            )}
          </div>
        </div>

        <InvoiceDownloadButton brand={brand} />

        <p className="muted text-center text-[11px] text-vodium-cream/25 mt-5">Powered by Vodium Ledger</p>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-vodium-cream/55">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
