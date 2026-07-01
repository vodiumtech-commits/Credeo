"use client";

import { useState } from "react";
import { Building2, Check, Copy, Globe2, Loader2, MessageCircle, Palette, Plus, Trash2, Users, X } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

type Branch = {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string;
};

type Channel = {
  id: string;
  displayName: string;
  phoneNumber: string | null;
  phoneNumberId: string | null;
  status: string;
};
type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branchId: string | null;
  branchName: string | null;
  isSelf: boolean;
  pending: boolean;
};

type Branding = { name: string; brandColor: string | null; logoUrl: string | null };

const STAFF_ROLES = ["HQ_ADMIN", "BRANCH_MANAGER", "BRANCH_STAFF", "FINANCE", "AUDITOR"];

export function OrgSettingsClient({
  organizationName,
  subdomain,
  branding,
  branches,
  channels,
  members,
}: {
  organizationName: string;
  subdomain: string;
  branding: Branding;
  branches: Branch[];
  channels: Channel[];
  members: Member[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Settings</p>
        <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream mt-1">{organizationName}</h1>
        <p className="text-sm text-vodium-cream/45 mt-1">Manage branding, branches, staff, white-label domains and WhatsApp channels.</p>
      </div>

      <BrandingSection branding={branding} />
      <StoreAddressSection subdomain={subdomain} />
      <BranchesSection branches={branches} />
      <StaffSection members={members} branches={branches} />
      <ChannelsSection channels={channels} />
    </div>
  );
}

/* ───────────────────────────── Branding ───────────────────────────── */

function BrandingSection({ branding }: { branding: Branding }) {
  const [name, setName] = useState(branding.name);
  const [brandColor, setBrandColor] = useState(branding.brandColor ?? "#C9A961");
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validColor = /^#[0-9a-fA-F]{6}$/.test(brandColor);

  async function save() {
    setError(null);
    if (!validColor) return setError("Brand colour must be a hex value like #C9A961.");
    setSaving(true);
    const res = await fetch("/api/tenant/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), brandColor, logoUrl: logoUrl.trim() || null }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not save branding.");
    window.location.reload();
  }

  return (
    <Section icon={<Palette size={16} className="text-vodium-gold" />} title="Branding">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="space-y-1 block">
            <span className="text-xs text-vodium-cream/40">Display name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className="space-y-1 block">
            <span className="text-xs text-vodium-cream/40">Brand colour (hex)</span>
            <div className="flex gap-2">
              <input
                type="color"
                value={validColor ? brandColor : "#C9A961"}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-9 w-12 rounded-lg bg-black/25 border border-white/[0.08] cursor-pointer"
              />
              <input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className={`${inputClass} uppercase`} />
            </div>
          </label>
          <ImageUpload value={logoUrl || null} onChange={(url) => setLogoUrl(url ?? "")} label="Logo" />

        </div>

        {/* Live preview */}
        <div className="rounded-lg border border-white/[0.06] bg-black/20 p-4 flex flex-col items-center justify-center gap-3">
          <p className="text-[10px] uppercase tracking-wider text-vodium-cream/30 self-start">Preview</p>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-serif text-lg"
                style={{ backgroundColor: `${validColor ? brandColor : "#C9A961"}1a`, color: validColor ? brandColor : "#C9A961", border: `1px solid ${validColor ? brandColor : "#C9A961"}40` }}
              >
                {(name.trim()[0] ?? "V").toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-serif text-vodium-cream">{name || "Your store"}</p>
              <p className="text-xs" style={{ color: validColor ? brandColor : "#C9A961" }}>Buy Now, Pay Later</p>
            </div>
          </div>
          <button
            className="mt-1 w-full py-2 rounded-lg text-xs font-bold text-vodium-black"
            style={{ backgroundColor: validColor ? brandColor : "#C9A961" }}
            disabled
          >
            Sample button
          </button>
        </div>
      </div>

      <p className="text-xs text-vodium-cream/35">Used on customer receipt &amp; consent pages and your enterprise dashboard.</p>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end">
        <button disabled={saving} onClick={save} className="px-4 py-2 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 size={12} className="animate-spin" />} Save branding
        </button>
      </div>
    </Section>
  );
}

/* ───────────────────────────── Staff ───────────────────────────── */

function StaffSection({ members, branches }: { members: Member[]; branches: Branch[] }) {
  const [showForm, setShowForm] = useState(false);

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/tenant/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) window.location.reload();
    else alert((await res.json().catch(() => ({}))).error ?? "Could not update member.");
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remove ${name} from this organization?`)) return;
    const res = await fetch(`/api/tenant/members/${id}`, { method: "DELETE" });
    if (res.ok) window.location.reload();
    else alert((await res.json().catch(() => ({}))).error ?? "Could not remove member.");
  }

  return (
    <Section
      icon={<Users size={16} className="text-vodium-gold" />}
      title="Staff & roles"
      action={
        <button onClick={() => setShowForm((v) => !v)} className="text-xs text-vodium-gold hover:underline inline-flex items-center gap-1">
          {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? "Close" : "Invite staff"}
        </button>
      }
    >
      {showForm && <InviteForm branches={branches} onClose={() => setShowForm(false)} />}
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="rounded-lg bg-black/20 border border-white/[0.05] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-vodium-cream truncate">
                {member.name}
                {member.pending && <span className="ml-2 text-[10px] uppercase tracking-wider rounded-md border border-amber-300/20 bg-amber-300/10 text-amber-300 px-2 py-0.5">Pending</span>}
              </p>
              <p className="text-xs text-vodium-cream/35 truncate">{member.email} · {member.phone}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {member.role === "OWNER" ? (
                <span className="text-[10px] uppercase tracking-wider rounded-md border border-vodium-gold/20 bg-vodium-gold/10 text-vodium-gold px-2 py-0.5">Owner</span>
              ) : (
                <>
                  <select
                    value={member.role}
                    onChange={(e) => patch(member.id, { role: e.target.value })}
                    className="bg-black/25 border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-vodium-cream focus:outline-none focus:border-vodium-gold/40"
                  >
                    {STAFF_ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                  </select>
                  <select
                    value={member.branchId ?? ""}
                    onChange={(e) => patch(member.id, { branchId: e.target.value || null })}
                    className="bg-black/25 border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-vodium-cream focus:outline-none focus:border-vodium-gold/40 max-w-[9rem]"
                  >
                    <option value="">No branch</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {!member.isSelf && (
                    <button onClick={() => remove(member.id, member.name)} className="text-vodium-cream/40 hover:text-rose-300 p-1">
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function InviteForm({ branches, onClose }: { branches: Branch[]; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("BRANCH_STAFF");
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim() || !email.trim() || !phone.trim()) return setError("Name, email and phone are required.");
    setSaving(true);
    const res = await fetch("/api/tenant/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), role, branchId: branchId || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not invite the staff member.");
    onClose();
    window.location.reload();
  }

  return (
    <div className="space-y-2 rounded-lg border border-vodium-gold/20 bg-vodium-gold/[0.04] p-3">
      <div className="grid md:grid-cols-3 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={inputClass} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (0803...)" className={inputClass} />
      </div>
      <div className="grid md:grid-cols-2 gap-2">
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
          {STAFF_ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
        </select>
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputClass}>
          <option value="">No branch</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
        </select>
      </div>
      <p className="text-xs text-vodium-cream/35">They&apos;ll get an email to set a password and activate their account.</p>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-cream">Cancel</button>
        <button disabled={saving} onClick={submit} className="px-3 py-1.5 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 size={12} className="animate-spin" />} Send invite
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Branches ───────────────────────────── */

function BranchesSection({ branches }: { branches: Branch[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Section
      icon={<Building2 size={16} className="text-vodium-gold" />}
      title="Branches"
      action={
        <button onClick={() => { setShowForm((v) => !v); setEditing(null); }} className="text-xs text-vodium-gold hover:underline inline-flex items-center gap-1">
          {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? "Close" : "Add branch"}
        </button>
      }
    >
      {showForm && <BranchForm onClose={() => setShowForm(false)} />}
      <div className="space-y-2">
        {branches.length === 0 ? (
          <p className="text-sm text-vodium-cream/35">No branches yet.</p>
        ) : branches.map((branch) => (
          <div key={branch.id} className="rounded-lg bg-black/20 border border-white/[0.05] p-3">
            {editing === branch.id ? (
              <BranchForm branch={branch} onClose={() => setEditing(null)} />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-vodium-cream">{branch.name} <span className="text-vodium-cream/35">· {branch.code}</span></p>
                  <p className="text-xs text-vodium-cream/35 truncate">
                    {[branch.address, branch.city, branch.state].filter(Boolean).join(", ") || "No address"}
                    {branch.phone ? ` · ${branch.phone}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={branch.status} />
                  <button onClick={() => setEditing(branch.id)} className="text-xs text-vodium-gold hover:underline">Edit</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function BranchForm({ branch, onClose }: { branch?: Branch; onClose: () => void }) {
  const isEdit = Boolean(branch);
  const [name, setName] = useState(branch?.name ?? "");
  const [code, setCode] = useState(branch?.code ?? "");
  const [phone, setPhone] = useState(branch?.phone ?? "");
  const [address, setAddress] = useState(branch?.address ?? "");
  const [city, setCity] = useState(branch?.city ?? "");
  const [state, setState] = useState(branch?.state ?? "");
  const [status, setStatus] = useState(branch?.status ?? "ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!name.trim() || (!isEdit && !code.trim())) return setError("Name and code are required.");
    setSaving(true);
    const url = isEdit ? `/api/tenant/branches/${branch!.id}` : "/api/tenant/branches";
    const body = isEdit
      ? { name, phone, address, city, state, status }
      : { name, code, phone: phone || undefined, address: address || undefined, city: city || undefined, state: state || undefined };
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not save the branch.");
    onClose();
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Branch name" className={inputClass} />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" disabled={isEdit} className={`${inputClass} uppercase disabled:opacity-50`} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className={inputClass} />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={inputClass} />
        <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className={inputClass} />
      </div>
      {isEdit && (
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} md:w-48`}>
          {["ACTIVE", "INACTIVE", "SUSPENDED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      )}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-cream">Cancel</button>
        <button disabled={saving} onClick={submit} className="px-3 py-1.5 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 size={12} className="animate-spin" />} {isEdit ? "Save" : "Add branch"}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Store address ───────────────────────────── */

function StoreAddressSection({ subdomain }: { subdomain: string }) {
  const [copied, setCopied] = useState(false);

  async function copySubdomain() {
    const url = `https://${subdomain}`;
    try { await navigator.clipboard.writeText(url); } catch { window.prompt("Copy:", url); }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Section icon={<Globe2 size={16} className="text-vodium-gold" />} title="Your store address">
      <div className="rounded-lg border border-vodium-gold/20 bg-vodium-gold/[0.04] p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-vodium-cream/35">Your branded address</p>
          <p className="text-sm text-vodium-cream truncate mt-0.5">{subdomain}</p>
          <p className="text-[11px] text-vodium-cream/35 mt-0.5">Live now — share this link with your customers. No setup required.</p>
        </div>
        <button onClick={copySubdomain} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-vodium-cream/70 hover:text-vodium-gold shrink-0 inline-flex items-center gap-1.5">
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </Section>
  );
}

/* ───────────────────────────── WhatsApp ───────────────────────────── */

function ChannelsSection({ channels }: { channels: Channel[] }) {
  const [showForm, setShowForm] = useState(false);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/whatsapp/channels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) window.location.reload();
  }

  return (
    <Section
      icon={<MessageCircle size={16} className="text-vodium-gold" />}
      title="WhatsApp channels"
      action={
        <button onClick={() => setShowForm((v) => !v)} className="text-xs text-vodium-gold hover:underline inline-flex items-center gap-1">
          {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? "Close" : "Add channel"}
        </button>
      }
    >
      {showForm && <ChannelForm onClose={() => setShowForm(false)} />}
      <p className="text-xs text-vodium-cream/35">Connect your store&apos;s own WhatsApp number. Paste the access token (stored encrypted) and we&apos;ll auto-connect the webhook — no manual webhook setup.</p>
      <div className="space-y-3">
        {channels.length === 0 ? (
          <p className="text-sm text-vodium-cream/35">No WhatsApp channel connected yet.</p>
        ) : channels.map((channel) => (
          <ChannelRow key={channel.id} channel={channel} onStatus={setStatus} />
        ))}
      </div>
    </Section>
  );
}

function ChannelRow({ channel, onStatus }: { channel: Channel; onStatus: (id: string, status: string) => void }) {
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const digits = (channel.phoneNumber ?? "").replace(/[^0-9]/g, "");
  const waLink = digits ? `https://wa.me/${digits}` : null;
  const qrSrc = waLink ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(waLink)}` : null;

  async function copy() {
    if (!waLink) return;
    try { await navigator.clipboard.writeText(waLink); } catch { window.prompt("Copy:", waLink); }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  async function sendTest() {
    setTestMsg(null);
    if (!testTo.trim()) return setTestMsg("Enter a phone number to test.");
    setTesting(true);
    const res = await fetch(`/api/whatsapp/channels/${channel.id}/test`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toPhone: testTo.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setTesting(false);
    setTestMsg(res.ok ? "✓ Test message sent." : (data.error ?? "Test failed."));
  }

  return (
    <div className="rounded-lg bg-black/20 border border-white/[0.05] p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-vodium-cream truncate">{channel.displayName}</p>
          <p className="text-xs text-vodium-cream/35 truncate">{channel.phoneNumber ?? "No number"}{channel.phoneNumberId ? ` · id ${channel.phoneNumberId}` : ""}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={channel.status} />
          {channel.status !== "ACTIVE" && <button onClick={() => onStatus(channel.id, "ACTIVE")} className="text-xs text-emerald-300 hover:underline">Activate</button>}
          {channel.status !== "DISABLED" && <button onClick={() => onStatus(channel.id, "DISABLED")} className="text-xs text-rose-300 hover:underline">Disable</button>}
        </div>
      </div>

      {waLink && (
        <div className="flex flex-col sm:flex-row gap-3 border-t border-white/[0.05] pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qrSrc && <img src={qrSrc} alt="WhatsApp QR" className="w-24 h-24 rounded-lg bg-white p-1 shrink-0" />}
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-vodium-cream/35">Customer chat link & QR</p>
            <div className="flex gap-2">
              <input readOnly value={waLink} className={`${inputClass} text-xs`} />
              <button onClick={copy} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-vodium-cream/70 hover:text-vodium-gold shrink-0 inline-flex items-center gap-1.5">
                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex gap-2">
              <input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Your phone — send a test" className={`${inputClass} text-xs`} />
              <button onClick={sendTest} disabled={testing} className="px-3 py-1.5 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5">
                {testing && <Loader2 size={12} className="animate-spin" />} Test
              </button>
            </div>
            {testMsg && <p className={`text-xs ${testMsg.startsWith("✓") ? "text-emerald-300" : "text-rose-300"}`}>{testMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelForm({ onClose }: { onClose: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [accessTokenRef, setAccessTokenRef] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!displayName.trim()) return setError("Enter a channel name.");
    setSaving(true);
    const res = await fetch("/api/whatsapp/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        phoneNumberId: phoneNumberId.trim() || undefined,
        businessAccountId: businessAccountId.trim() || undefined,
        accessTokenRef: accessTokenRef.trim() || undefined,
        accessToken: accessToken.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Could not add the channel.");
    onClose();
    window.location.reload();
  }

  return (
    <div className="space-y-2 rounded-lg border border-vodium-gold/20 bg-vodium-gold/[0.04] p-3">
      <div className="grid md:grid-cols-2 gap-2">
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className={inputClass} />
        <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone number" className={inputClass} />
        <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="Phone number ID" className={inputClass} />
        <input value={businessAccountId} onChange={(e) => setBusinessAccountId(e.target.value)} placeholder="Business account ID" className={inputClass} />
      </div>
      <input value={accessTokenRef} onChange={(e) => setAccessTokenRef(e.target.value)} placeholder="Access token reference (env var key)" className={inputClass} />
      <input type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="…or paste access token (stored encrypted)" className={inputClass} autoComplete="off" />
      <p className="text-[11px] text-vodium-cream/30">Pasted tokens are encrypted at rest with AES-256-GCM. Requires SECRET_ENCRYPTION_KEY; otherwise use an env var reference.</p>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-vodium-cream/60 hover:text-vodium-cream">Cancel</button>
        <button disabled={saving} onClick={submit} className="px-3 py-1.5 rounded-lg bg-vodium-gold text-vodium-black text-xs font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 size={12} className="animate-spin" />} Add channel
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────── Shared ───────────────────────────── */

const inputClass =
  "w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40";

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-vodium-charcoal overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{icon}<h2 className="text-sm font-semibold text-vodium-cream">{title}</h2></div>
        {action}
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "ACTIVE" || status === "VERIFIED"
      ? "text-emerald-300 border-emerald-300/20 bg-emerald-300/10"
      : status === "DISABLED" || status === "SUSPENDED"
        ? "text-rose-300 border-rose-300/20 bg-rose-300/10"
        : "text-vodium-cream/50 border-white/10 bg-white/[0.04]";
  return <span className={`text-[10px] uppercase tracking-wider rounded-md border px-2 py-0.5 ${tone}`}>{status}</span>;
}
