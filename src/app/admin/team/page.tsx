"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Trash2, Mail, RefreshCw, Loader2, CheckCircle2, Clock, Shield, X } from "lucide-react";

type AdminRole = "SUPER_ADMIN" | "CFO" | "CUSTOMER_CARE" | "ANALYTICS" | "MARKETING";

interface AdminMember {
  id:            string;
  name:          string;
  email:         string;
  role:          AdminRole;
  activatedAt:   string | null;
  lastLoginAt:   string | null;
  createdAt:     string;
  inviteToken:   string | null;
  tokenExpiresAt: string | null;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN:   "Super Admin",
  CFO:           "CFO",
  CUSTOMER_CARE: "Customer Care",
  ANALYTICS:     "Analytics",
  MARKETING:     "Marketing",
};

const ROLE_COLORS: Record<AdminRole, string> = {
  SUPER_ADMIN:   "text-vodium-gold   bg-vodium-gold/10   border-vodium-gold/20",
  CFO:           "text-emerald-400   bg-emerald-500/10   border-emerald-500/20",
  CUSTOMER_CARE: "text-sky-400       bg-sky-500/10       border-sky-500/20",
  ANALYTICS:     "text-purple-400    bg-purple-500/10    border-purple-500/20",
  MARKETING:     "text-pink-400      bg-pink-500/10      border-pink-500/20",
};

const ROLE_DESC: Record<AdminRole, string> = {
  SUPER_ADMIN:   "Full access : vendors, finance, team",
  CFO:           "Finance & revenue metrics",
  CUSTOMER_CARE: "Vendor support & outreach",
  ANALYTICS:     "Platform insights & trends",
  MARKETING:     "Ambassadors & growth tracking",
};

export default function AdminTeamPage() {
  const [team,        setTeam]        = useState<AdminMember[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showInvite,  setShowInvite]  = useState(false);
  const [inviteName,  setInviteName]  = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState<AdminRole>("CFO");
  const [inviting,    setInviting]    = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteOk,    setInviteOk]    = useState(false);
  const [removing,    setRemoving]    = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) setTeam(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true); setInviteError(null);
    try {
      const res  = await fetch("/api/admin/team", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite");
      setInviteOk(true);
      setInviteName(""); setInviteEmail(""); setInviteRole("CFO");
      await loadTeam();
      setTimeout(() => { setInviteOk(false); setShowInvite(false); }, 2500);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} from the admin team?`)) return;
    setRemoving(id);
    try {
      await fetch(`/api/admin/team?id=${id}`, { method: "DELETE" });
      await loadTeam();
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-vodium-gold text-xs tracking-[0.35em] uppercase mb-1.5">Admin Console</p>
          <h1 className="font-serif text-2xl md:text-3xl text-vodium-cream">Team Management</h1>
          <p className="text-vodium-cream/40 text-sm mt-1">
            {team.length} member{team.length !== 1 ? "s" : ""} · Super Admin access required
          </p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteOk(false); setInviteError(null); }}
          className="btn-gold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 flex-shrink-0"
        >
          <UserPlus size={15} /> Invite member
        </button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(ROLE_LABELS) as AdminRole[]).map((r) => {
          const held = team.filter((m) => m.role === r).length;
          return (
            <div key={r} className={`border rounded-xl p-4 ${ROLE_COLORS[r]}`}>
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="text-xs font-bold uppercase tracking-wider">{ROLE_LABELS[r]}</p>
                {/* Who actually holds this role — an empty critical role is worth seeing */}
                <span className="text-sm font-serif tabular-nums opacity-80">{held}</span>
              </div>
              <p className="text-xs opacity-60 leading-relaxed">{ROLE_DESC[r]}</p>
            </div>
          );
        })}
      </div>

      {/* Team table */}
      <div className="bg-vodium-charcoal border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Users size={14} className="text-vodium-gold" />
          <h2 className="text-sm font-semibold text-vodium-cream">Admin members</h2>
          <button onClick={loadTeam} className="ml-auto text-vodium-cream/30 hover:text-vodium-cream/70 transition-colors">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="text-vodium-gold animate-spin" />
          </div>
        ) : team.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Users size={32} className="text-vodium-cream/15 mx-auto mb-3" />
            <p className="text-vodium-cream/30 text-sm">No team members yet. Invite your first admin.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {team.map((m) => {
              const isActive  = !!m.activatedAt;
              const isPending = !m.activatedAt && !!m.inviteToken;
              const isExpired = !m.activatedAt && m.tokenExpiresAt && new Date(m.tokenExpiresAt) < new Date();

              return (
                <div key={m.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${ROLE_COLORS[m.role]}`}>
                    <span className="font-bold text-sm">{m.name.charAt(0).toUpperCase()}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-vodium-cream">{m.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ROLE_COLORS[m.role]}`}>
                        {ROLE_LABELS[m.role]}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      )}
                      {isPending && !isExpired && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                          <Clock size={10} /> Invite pending
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400">
                          <Clock size={10} /> Invite expired
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-vodium-cream/35 mt-0.5">{m.email}</p>
                    {m.lastLoginAt && (
                      <p className="text-[10px] text-vodium-cream/25 mt-0.5">
                        Last login {new Date(m.lastLoginAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`mailto:${m.email}`}
                      className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-vodium-cream/30 hover:text-sky-400 hover:border-sky-400/30 transition-colors"
                      title="Send email"
                    >
                      <Mail size={13} />
                    </a>
                    <button
                      onClick={() => handleRemove(m.id, m.name)}
                      disabled={removing === m.id}
                      className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-vodium-cream/30 hover:text-rose-400 hover:border-rose-400/30 transition-colors disabled:opacity-40"
                      title="Remove from team"
                    >
                      {removing === m.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}
        >
          <div className="w-full max-w-md bg-vodium-charcoal border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center">
                  <UserPlus size={16} className="text-vodium-gold" />
                </div>
                <p className="font-serif text-vodium-cream">Invite admin member</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-vodium-cream/30 hover:text-vodium-cream/70 transition-colors">
                <X size={17} />
              </button>
            </div>

            {inviteOk ? (
              <div className="px-6 py-10 text-center">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-3" />
                <p className="font-serif text-vodium-cream text-lg mb-1">Invitation sent!</p>
                <p className="text-vodium-cream/40 text-sm">An email with the activation link was sent.</p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs text-vodium-cream/50 mb-1.5 uppercase tracking-wider">Full name</label>
                  <input type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Chidi Okonkwo" required
                    className="input-dark w-full" />
                </div>
                <div>
                  <label className="block text-xs text-vodium-cream/50 mb-1.5 uppercase tracking-wider">Email address</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="chidi@company.com" required
                    className="input-dark w-full" />
                </div>
                <div>
                  <label className="block text-xs text-vodium-cream/50 mb-1.5 uppercase tracking-wider">Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as AdminRole)}
                    className="input-dark w-full appearance-none">
                    {(Object.entries(ROLE_LABELS) as [AdminRole, string][]).map(([v, l]) => (
                      <option key={v} value={v} className="bg-vodium-charcoal">{l} : {ROLE_DESC[v]}</option>
                    ))}
                  </select>
                </div>

                {inviteError && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
                    {inviteError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowInvite(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-white/[0.08] text-vodium-cream/50 hover:text-vodium-cream/80 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={inviting}
                    className="flex-1 btn-gold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {inviting ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Mail size={13} /> Send invite</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Super admin note */}
      <div className="bg-vodium-gold/[0.04] border border-vodium-gold/10 rounded-xl px-5 py-4 flex items-start gap-3">
        <Shield size={15} className="text-vodium-gold flex-shrink-0 mt-0.5" />
        <p className="text-xs text-vodium-cream/40 leading-relaxed">
          The <strong className="text-vodium-cream/70">Super Admin</strong> account (accessed via the master password) is not listed here and cannot be deleted. Staff admin accounts created here use email + password login.
        </p>
      </div>
    </div>
  );
}
