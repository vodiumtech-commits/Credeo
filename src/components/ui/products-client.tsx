"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Package, Plus, Trash2, X } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";

export type ProductBranch = { id: string; name: string; code: string };
export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  imageUrl: string | null;
  active: boolean;
  bnplEligible: boolean;
  branchId: string | null;
  branchName: string | null;
};

export function ProductsClient({
  products,
  branches,
  canWrite,
  canSeeAllBranches,
  storeUrl,
}: {
  products: ProductRow[];
  branches: ProductBranch[];
  canWrite: boolean;
  canSeeAllBranches: boolean;
  storeUrl: string;
}) {
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);

  async function remove(p: ProductRow) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
    else alert((await res.json().catch(() => ({}))).error ?? "Could not delete.");
  }

  async function toggleActive(p: ProductRow) {
    const res = await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    if (res.ok) window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Catalog</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">Products</h1>
          <p className="text-sm text-vodium-cream/45 mt-1">Items customers can buy on BNPL from your store page.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={storeUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg text-sm border border-white/10 text-vodium-cream/70 hover:text-vodium-gold inline-flex items-center gap-2">
            <ExternalLink size={15} /> View store
          </a>
          {canWrite && (
            <button onClick={() => { setCreating(true); setEditing(null); }} className="btn-gold px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2">
              <Plus size={15} /> Add product
            </button>
          )}
        </div>
      </div>

      {(creating || editing) && canWrite && (
        <ProductForm
          product={editing}
          branches={branches}
          canSeeAllBranches={canSeeAllBranches}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {products.length === 0 ? (
          <p className="text-sm text-vodium-cream/35">No products yet. Add your first item.</p>
        ) : products.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 bg-black/30 flex items-center justify-center"><Package size={28} className="text-vodium-cream/20" /></div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-vodium-cream font-medium truncate">{p.name}</p>
                  <p className="text-vodium-gold text-sm mt-0.5">{formatNaira(p.price)}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider rounded-md border px-2 py-0.5 ${p.active ? "text-emerald-300 border-emerald-300/20 bg-emerald-300/10" : "text-vodium-cream/40 border-white/10"}`}>
                  {p.active ? "Live" : "Hidden"}
                </span>
              </div>
              <p className="text-xs text-vodium-cream/35 mt-1 truncate">{p.branchName ?? "All branches"}{p.sku ? ` · ${p.sku}` : ""}</p>
              {canWrite && (
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <button onClick={() => { setEditing(p); setCreating(false); }} className="text-vodium-gold hover:underline">Edit</button>
                  <button onClick={() => toggleActive(p)} className="text-vodium-cream/60 hover:text-vodium-cream">{p.active ? "Hide" : "Show"}</button>
                  <button onClick={() => remove(p)} className="text-rose-300 hover:underline inline-flex items-center gap-1 ml-auto"><Trash2 size={12} /> Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({
  product,
  branches,
  canSeeAllBranches,
  onClose,
}: {
  product: ProductRow | null;
  branches: ProductBranch[];
  canSeeAllBranches: boolean;
  onClose: () => void;
}) {
  const isEdit = Boolean(product);
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [description, setDescription] = useState(product?.description ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [branchId, setBranchId] = useState(product?.branchId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim()) return setError("Enter a product name.");
    if (price <= 0) return setError("Enter a price greater than zero.");
    setSaving(true);
    const body = {
      name: name.trim(),
      price,
      description: description.trim() || undefined,
      sku: sku.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      branchId: branchId || undefined,
    };
    const res = await fetch(isEdit ? `/api/products/${product!.id}` : "/api/products", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not save the product.");
    onClose();
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-vodium-gold/20 bg-vodium-gold/[0.04] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-vodium-cream">{isEdit ? "Edit product" : "New product"}</h3>
        <button onClick={onClose} className="text-vodium-cream/40 hover:text-vodium-cream"><X size={16} /></button>
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" className={inputClass} />
        <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Price (₦)" className={inputClass} />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className={inputClass} />
      <ImageUpload value={imageUrl || null} onChange={(url) => setImageUrl(url ?? "")} label="Product image" shape="wide" />
      <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU (optional)" className={`md:w-64 ${inputClass}`} />
      {canSeeAllBranches && branches.length > 0 && (
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={`${inputClass} md:w-64`}>
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
        </select>
      )}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-cream">Cancel</button>
        <button disabled={saving} onClick={submit} className="px-4 py-1.5 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 size={12} className="animate-spin" />} {isEdit ? "Save" : "Add product"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40";
