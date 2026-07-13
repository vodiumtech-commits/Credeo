"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, Copy, FileText, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { formatNaira } from "@/lib/utils";

export type InvoiceBranch = { id: string; name: string; code: string };

export type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  branchName: string;
  status: string;
  total: number;
  outstanding: number;
  dueDate: string;
  sent: boolean;
  publicPath: string;
};

type ItemDraft = { name: string; quantity: string; unitPrice: string };

// Plain text inputs (no spinner counters) — sanitize as the vendor types.
const digitsOnly = (v: string) => v.replace(/\D/g, "");
function decimalOnly(v: string) {
  const cleaned = v.replace(/[^0-9.]/g, "");
  const [head, ...rest] = cleaned.split(".");
  return rest.length ? `${head}.${rest.join("")}` : head;
}
function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const OPEN = ["DRAFT", "SENT", "PARTIALLY_PAID", "OVERDUE"];

export function InvoicesClient({
  invoices, branches, canWrite, canSeeAllBranches, defaultBranchId,
}: {
  invoices: InvoiceRow[];
  branches: InvoiceBranch[];
  canWrite: boolean;
  canSeeAllBranches: boolean;
  defaultBranchId: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [payFor, setPayFor] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Invoices</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">Digital invoices</h1>
          <p className="text-sm text-vodium-cream/45 mt-1">Create an invoice and send it to your customer on WhatsApp.</p>
        </div>
        {canWrite && (
          <button onClick={() => setShowForm((v) => !v)} className="btn-gold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 shrink-0">
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Close" : "New invoice"}
          </button>
        )}
      </div>

      {showForm && canWrite && (
        <NewInvoiceForm
          branches={branches}
          canSeeAllBranches={canSeeAllBranches}
          defaultBranchId={defaultBranchId}
          onClose={() => setShowForm(false)}
        />
      )}

      <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <FileText size={16} className="text-vodium-gold" />
          <h2 className="text-sm font-semibold text-vodium-cream">All invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-vodium-cream/35">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-vodium-cream/35">No invoices yet.</td></tr>
              ) : invoices.map((inv) => (
                <Fragment key={inv.id}>
                  <tr className="text-vodium-cream/70">
                    <td className="px-5 py-3 text-vodium-cream">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3">{inv.customerName}</td>
                    <td className="px-5 py-3"><StatusPill status={inv.status} /></td>
                    <td className="px-5 py-3">{formatNaira(inv.outstanding)}</td>
                    <td className="px-5 py-3 text-vodium-gold">{formatNaira(inv.total)}</td>
                    <td className="px-5 py-3">{new Date(inv.dueDate).toLocaleDateString("en-NG")}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {canWrite && OPEN.includes(inv.status) && (
                        <div className="inline-flex items-center gap-3">
                          <SendButton invoice={inv} />
                          <button onClick={() => setPayFor(payFor === inv.id ? null : inv.id)} className="text-xs text-vodium-gold hover:underline">
                            {payFor === inv.id ? "Cancel" : "Record payment"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {payFor === inv.id && (
                    <tr>
                      <td colSpan={7} className="px-5 py-3 bg-black/20">
                        <PayForm invoice={inv} onClose={() => setPayFor(null)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SendButton({ invoice }: { invoice: InvoiceRow }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setBusy(true); setMsg(null);
    const res = await fetch(`/api/invoices/${invoice.id}/send`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(data.error ?? "Could not send."); return; }
    window.location.reload();
  }

  async function copyLink() {
    const url = `${window.location.origin}${invoice.publicPath}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt("Copy:", url); }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button onClick={send} disabled={busy} className="text-xs text-emerald-300 hover:underline inline-flex items-center gap-1 disabled:opacity-50">
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        {invoice.sent ? "Resend" : "Send"}
      </button>
      <button onClick={copyLink} className="text-xs text-vodium-cream/50 hover:text-vodium-gold inline-flex items-center gap-1">
        {copied ? <Check size={12} /> : <Copy size={12} />} Link
      </button>
      {msg && <span className="text-xs text-rose-300">{msg}</span>}
    </span>
  );
}

function PayForm({ invoice, onClose }: { invoice: InvoiceRow; onClose: () => void }) {
  const [amount, setAmount] = useState(String(invoice.outstanding));
  const [method, setMethod] = useState("CASH");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    const value = toNumber(amount);
    if (value <= 0) return setError("Enter an amount greater than zero.");
    setBusy(true);
    const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: value, method }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not record the payment.");
    onClose();
    window.location.reload();
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
      <Field label={`Amount (balance ${formatNaira(invoice.outstanding)})`}>
        <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(decimalOnly(e.target.value))} className={inputClass} />
      </Field>
      <Field label="Method">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
          {["CASH", "BANK_TRANSFER", "POS", "USSD", "MOBILE_MONEY", "OTHER"].map((m) => (
            <option key={m} value={m}>{m.replace("_", " ")}</option>
          ))}
        </select>
      </Field>
      <button disabled={busy} onClick={submit} className="px-4 py-2 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2 h-9">
        {busy && <Loader2 size={13} className="animate-spin" />} Record
      </button>
      {error && <p className="text-sm text-rose-300 self-center">{error}</p>}
    </div>
  );
}

function NewInvoiceForm({
  branches, canSeeAllBranches, defaultBranchId, onClose,
}: {
  branches: InvoiceBranch[];
  canSeeAllBranches: boolean;
  defaultBranchId: string | null;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId ?? branches[0]?.id ?? "");
  const [dueDate, setDueDate] = useState(defaultDue());
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ name: "", quantity: "1", unitPrice: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((s, i) => s + toNumber(i.quantity) * toNumber(i.unitPrice), 0), [items]);
  const discountValue = toNumber(discount);
  const total = Math.max(0, subtotal - discountValue);

  function update(i: number, patch: Partial<ItemDraft>) {
    setItems((cur) => cur.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function submit() {
    setError(null);
    const clean = items
      .map((i) => ({
        name: i.name.trim(),
        quantity: Math.max(1, Math.round(toNumber(i.quantity)) || 1),
        unitPrice: toNumber(i.unitPrice),
      }))
      .filter((i) => i.name && i.unitPrice > 0);
    if (clean.length === 0) return setError("Add at least one item with a price.");
    if (!customerName.trim() || !customerPhone.trim()) return setError("Enter the customer's name and phone.");
    if (total <= 0) return setError("Invoice total must be greater than zero.");

    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        branchId: branchId || undefined,
        dueDate: new Date(dueDate).toISOString(),
        discountAmount: discountValue,
        notes: notes.trim() || undefined,
        items: clean,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not create the invoice.");
    onClose();
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-vodium-gold/20 bg-vodium-gold/[0.04] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-vodium-cream">New invoice</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Customer name"><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} /></Field>
        <Field label="Customer phone"><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="0803… or +234…" className={inputClass} /></Field>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {canSeeAllBranches && branches.length > 0 && (
          <Field label="Branch">
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputClass}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
            </select>
          </Field>
        )}
        <Field label="Due date"><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} /></Field>
        <Field label="Discount (₦)"><input type="text" inputMode="decimal" value={discount} onChange={(e) => setDiscount(decimalOnly(e.target.value))} placeholder="0" className={inputClass} /></Field>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-vodium-cream/40">Items</p>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input value={item.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Item or service" className={`col-span-6 ${inputClass}`} />
            <input type="text" inputMode="numeric" value={item.quantity} onChange={(e) => update(i, { quantity: digitsOnly(e.target.value).slice(0, 3) })} placeholder="Qty" className={`col-span-2 ${inputClass}`} />
            <input type="text" inputMode="decimal" value={item.unitPrice} onChange={(e) => update(i, { unitPrice: decimalOnly(e.target.value) })} placeholder="Unit ₦" className={`col-span-3 ${inputClass}`} />
            <button onClick={() => setItems((c) => c.filter((_, idx) => idx !== i))} disabled={items.length === 1}
                    className="col-span-1 flex items-center justify-center text-vodium-cream/40 hover:text-rose-300 disabled:opacity-30">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button onClick={() => setItems((c) => [...c, { name: "", quantity: "1", unitPrice: "" }])} className="text-xs text-vodium-gold hover:underline inline-flex items-center gap-1">
          <Plus size={12} /> Add item
        </button>
      </div>

      <Field label="Note to customer (optional)">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </Field>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-vodium-cream/45"><span>Subtotal</span><span>{formatNaira(subtotal)}</span></div>
        {discountValue > 0 && <div className="flex justify-between text-vodium-cream/45"><span>Discount</span><span>− {formatNaira(discountValue)}</span></div>}
        <div className="flex justify-between font-semibold"><span className="text-vodium-cream">Total</span><span className="text-vodium-gold">{formatNaira(total)}</span></div>
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-cream">Cancel</button>
        <button disabled={saving} onClick={submit} className="px-4 py-2 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 size={13} className="animate-spin" />} Create invoice
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "PAID" ? "bg-emerald-300/15 text-emerald-300"
      : status === "OVERDUE" ? "bg-rose-300/15 text-rose-300"
      : status === "PARTIALLY_PAID" ? "bg-amber-300/15 text-amber-200"
      : status === "CANCELLED" ? "bg-white/10 text-vodium-cream/50"
      : "bg-vodium-gold/15 text-vodium-gold";
  return <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${tone}`}>{status.replace("_", " ")}</span>;
}

const inputClass =
  "w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 block flex-1">
      <span className="text-xs text-vodium-cream/40">{label}</span>
      {children}
    </label>
  );
}

function defaultDue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}
