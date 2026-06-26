"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Globe2, Loader2, MessageCircle, Search, Store, X } from "lucide-react";

export type AdminOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  plan: string;
  branches: Array<{ id: string; name: string; code: string }>;
  vendors: Array<{ id: string; businessName: string; ownerName: string; phone: string; email: string }>;
  domains: Array<{ host: string; status: string }>;
  whatsAppChannels: Array<{ displayName: string; status: string }>;
  counts: { credits: number; bnplOrders: number; students: number };
};

type BranchDraft = {
  name: string;
  code: string;
};

export function AdminOrganizationsClient({ organizations }: { organizations: AdminOrganizationRow[] }) {
  const [search, setSearch] = useState("");
  const [openOrgId, setOpenOrgId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((org) => {
      const owner = org.vendors[0];
      return Boolean(
        org.name.toLowerCase().includes(q) ||
        org.type.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q) ||
        owner?.businessName.toLowerCase().includes(q) ||
        owner?.ownerName.toLowerCase().includes(q) ||
        owner?.phone.includes(q)
      );
    });
  }, [organizations, search]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-vodium-cream/30" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search organizations, owners, stores, phone..."
            className="w-full bg-black/25 border border-white/[0.07] rounded-lg pl-9 pr-9 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-8 text-center text-vodium-cream/40">
          No organization matches your search.
        </div>
      ) : filtered.map((org) => {
        const owner = org.vendors[0];
        const isOpen = openOrgId === org.id;
        return (
          <section key={org.id} className="rounded-xl border border-white/[0.06] bg-vodium-charcoal p-5">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Building2 size={16} className="text-vodium-gold" />
                  <h2 className="font-semibold text-vodium-cream truncate">{org.name}</h2>
                  <span className="text-[10px] uppercase tracking-wider rounded-md border border-white/10 px-2 py-0.5 text-vodium-cream/45">{org.type}</span>
                  <span className="text-[10px] uppercase tracking-wider rounded-md border border-vodium-gold/20 bg-vodium-gold/10 px-2 py-0.5 text-vodium-gold">{org.status}</span>
                </div>
                <p className="text-xs text-vodium-cream/35 mt-1">{org.slug} · {org.plan}</p>
                {owner && (
                  <p className="text-sm text-vodium-cream/55 mt-3">
                    Owner: {owner.ownerName} · {owner.businessName} · {owner.phone}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {owner && (
                  <Link href={`/admin/vendors/${owner.id}`} className="px-3 py-2 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-gold hover:border-vodium-gold/30">
                    Owner vendor
                  </Link>
                )}
                {org.type === "SOLO_VENDOR" && owner && (
                  <button
                    onClick={() => setOpenOrgId(isOpen ? null : org.id)}
                    className="px-3 py-2 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold inline-flex items-center gap-2"
                  >
                    Promote <ChevronDown size={13} />
                  </button>
                )}
              </div>
            </div>

            {isOpen && owner && (
              <PromotePanel org={org} ownerVendorId={owner.id} onDone={() => setOpenOrgId(null)} />
            )}

            <div className="grid md:grid-cols-3 gap-4 mt-5">
              <InfoBlock
                icon={<Store size={15} />}
                title="Branches"
                lines={org.branches.map((branch) => `${branch.name} (${branch.code})`)}
              />
              <InfoBlock
                icon={<Globe2 size={15} />}
                title="Domains"
                lines={org.domains.map((domain) => `${domain.host} · ${domain.status}`)}
              />
              <InfoBlock
                icon={<MessageCircle size={15} />}
                title="WhatsApp"
                lines={org.whatsAppChannels.map((channel) => `${channel.displayName} · ${channel.status}`)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <MiniStat label="Customers" value={String(org.counts.students)} />
              <MiniStat label="Credits" value={String(org.counts.credits)} />
              <MiniStat label="BNPL" value={String(org.counts.bnplOrders)} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

function PromotePanel({
  org,
  ownerVendorId,
  onDone,
}: {
  org: AdminOrganizationRow;
  ownerVendorId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(org.name);
  const [trialDays, setTrialDays] = useState(30);
  const [branches, setBranches] = useState<BranchDraft[]>([
    { name: "Main Branch", code: "MAIN" },
    { name: "Second Branch", code: "BR2" },
    { name: "Third Branch", code: "BR3" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateBranch(index: number, patch: Partial<BranchDraft>) {
    setBranches((current) => current.map((branch, i) => i === index ? { ...branch, ...patch } : branch));
  }

  async function promote() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerVendorId,
        name,
        type: "SUPERMARKET",
        trialDays,
        branches: branches.filter((branch) => branch.name.trim()).map((branch) => ({
          name: branch.name.trim(),
          code: branch.code.trim().toUpperCase(),
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Could not promote organization.");
      return;
    }

    onDone();
    window.location.reload();
  }

  return (
    <div className="mt-5 rounded-xl border border-vodium-gold/20 bg-vodium-gold/[0.04] p-4 space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs text-vodium-cream/40">Supermarket name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} className="w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream focus:outline-none focus:border-vodium-gold/40" />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-vodium-cream/40">Trial days</span>
          <input type="number" min={1} max={180} value={trialDays} onChange={(event) => setTrialDays(Number(event.target.value))} className="w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream focus:outline-none focus:border-vodium-gold/40" />
        </label>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        {branches.map((branch, index) => (
          <div key={index} className="grid grid-cols-5 gap-2">
            <input value={branch.name} onChange={(event) => updateBranch(index, { name: event.target.value })} className="col-span-3 bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream focus:outline-none focus:border-vodium-gold/40" />
            <input value={branch.code} onChange={(event) => updateBranch(index, { code: event.target.value })} className="col-span-2 bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream uppercase focus:outline-none focus:border-vodium-gold/40" />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button onClick={() => setBranches((current) => [...current, { name: `Branch ${current.length + 1}`, code: `BR${current.length + 1}` }])} className="px-3 py-2 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-gold hover:border-vodium-gold/30">
          Add branch
        </button>
        <button disabled={saving || !name.trim()} onClick={promote} className="px-4 py-2 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 size={13} className="animate-spin" />}
          Promote and email vendor
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/20 border border-white/[0.05] px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wider text-vodium-cream/35">{label}</p>
      <p className="font-serif text-lg text-vodium-cream mt-1">{value}</p>
    </div>
  );
}

function InfoBlock({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="rounded-lg bg-black/20 border border-white/[0.05] p-3">
      <div className="flex items-center gap-2 text-vodium-gold mb-2">
        {icon}
        <p className="text-xs uppercase tracking-wider">{title}</p>
      </div>
      {lines.length === 0 ? (
        <p className="text-xs text-vodium-cream/30">None yet</p>
      ) : (
        <div className="space-y-1">
          {lines.slice(0, 5).map((line) => (
            <p key={line} className="text-xs text-vodium-cream/55 truncate">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
