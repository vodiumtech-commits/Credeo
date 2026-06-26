"use client";

import { useState } from "react";
import { Loader2, Plus, TicketPercent, X } from "lucide-react";
import { formatNaira } from "@/lib/utils";

export type CouponBranch = { id: string; name: string; code: string };

export type CouponRow = {
  id: string;
  name: string;
  code: string;
  branchName: string | null;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  active: boolean;
  redemptions: number;
};

export function CouponsClient({
  coupons,
  branches,
  canWrite,
  canSeeAllBranches,
}: {
  coupons: CouponRow[];
  branches: CouponBranch[];
  canWrite: boolean;
  canSeeAllBranches: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Coupons</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">Campaigns</h1>
          <p className="text-sm text-vodium-cream/45 mt-1">Branch-specific and organization-wide customer offers.</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-gold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2 shrink-0"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Close" : "New coupon"}
          </button>
        )}
      </div>

      {showForm && canWrite && (
        <NewCouponForm branches={branches} canSeeAllBranches={canSeeAllBranches} onClose={() => setShowForm(false)} />
      )}

      <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <TicketPercent size={16} className="text-vodium-gold" />
          <h2 className="text-sm font-semibold text-vodium-cream">Coupon campaigns</h2>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 p-5">
          {coupons.length === 0 ? (
            <p className="text-sm text-vodium-cream/35">No coupon campaign yet.</p>
          ) : coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-vodium-cream font-semibold">{coupon.name}</p>
                  <p className="text-xs text-vodium-cream/35 mt-1">{coupon.code} · {coupon.branchName ?? "All branches"}</p>
                </div>
                <span className={coupon.active ? "text-xs text-emerald-300" : "text-xs text-vodium-cream/35"}>
                  {coupon.active ? "Active" : "Paused"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-vodium-cream/35">Value</p>
                  <p className="text-vodium-gold">{coupon.type === "FIXED" ? formatNaira(coupon.value) : `${coupon.value}%`}</p>
                </div>
                <div>
                  <p className="text-xs text-vodium-cream/35">Used</p>
                  <p className="text-vodium-cream">{coupon.redemptions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NewCouponForm({
  branches,
  canSeeAllBranches,
  onClose,
}: {
  branches: CouponBranch[];
  canSeeAllBranches: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [branchId, setBranchId] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [value, setValue] = useState(0);
  const [minimumSpend, setMinimumSpend] = useState(0);
  const [maxRedemptions, setMaxRedemptions] = useState(0);
  const [perCustomerLimit, setPerCustomerLimit] = useState(0);
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim() || !code.trim()) return setError("Enter a campaign name and code.");
    if (value <= 0) return setError("Enter a discount value greater than zero.");
    if (type === "PERCENTAGE" && value > 100) return setError("Percentage coupon cannot exceed 100%.");

    setSaving(true);
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        branchId: branchId || undefined,
        type,
        value,
        minimumSpend: minimumSpend > 0 ? minimumSpend : undefined,
        maxRedemptions: maxRedemptions > 0 ? maxRedemptions : undefined,
        perCustomerLimit: perCustomerLimit > 0 ? perCustomerLimit : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not create the coupon.");
    onClose();
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-vodium-gold/20 bg-vodium-gold/[0.04] p-5 space-y-4">
      <h3 className="text-sm font-semibold text-vodium-cream">New coupon campaign</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Campaign name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Code">
          <input value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} uppercase`} placeholder="FRESHERS10" />
        </Field>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as "FIXED" | "PERCENTAGE")} className={inputClass}>
            <option value="FIXED">Fixed (₦)</option>
            <option value="PERCENTAGE">Percentage (%)</option>
          </select>
        </Field>
        <Field label={type === "FIXED" ? "Value (₦)" : "Value (%)"}>
          <input type="number" min={0} value={value} onChange={(e) => setValue(Number(e.target.value))} className={inputClass} />
        </Field>
        {canSeeAllBranches && branches.length > 0 && (
          <Field label="Branch">
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputClass}>
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Field label="Min spend (₦)">
          <input type="number" min={0} value={minimumSpend} onChange={(e) => setMinimumSpend(Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Max uses">
          <input type="number" min={0} value={maxRedemptions} onChange={(e) => setMaxRedemptions(Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Per customer">
          <input type="number" min={0} value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Ends (optional)">
          <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
        </Field>
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-cream">
          Cancel
        </button>
        <button
          disabled={saving}
          onClick={submit}
          className="px-4 py-2 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Create coupon
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream focus:outline-none focus:border-vodium-gold/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs text-vodium-cream/40">{label}</span>
      {children}
    </label>
  );
}
