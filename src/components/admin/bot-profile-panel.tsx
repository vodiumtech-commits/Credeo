"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Loader2, Check, AlertTriangle, ImageUp } from "lucide-react";

interface LiveProfile {
  about?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
}

/**
 * Super-admin control for the WhatsApp bot's public identity — the logo
 * customers see and the profile text. One "Apply" applies Vodium's branding;
 * paste a PNG/JPEG URL to set the logo.
 */
export function BotProfilePanel() {
  const [profile, setProfile] = useState<LiveProfile | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/whatsapp-profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile ?? null))
      .catch(() => {});
  }, []);

  async function apply() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/whatsapp-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update the profile");
      const notes = (data.skipped ?? []) as string[];
      setMsg({
        ok: true,
        text: data.photoSet
          ? "Logo and profile updated on WhatsApp."
          : notes[0] ?? "Profile text updated. Set the logo below or in WhatsApp Manager.",
      });
      fetch("/api/admin/whatsapp-profile").then((r) => r.json()).then((d) => setProfile(d.profile ?? null));
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-5 md:p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle size={16} className="text-vodium-gold" />
        <h3 className="text-sm font-semibold text-vodium-cream">WhatsApp bot profile</h3>
      </div>
      <p className="text-xs text-vodium-cream/40 mb-5">
        The logo and details customers see when they open the bot chat.
      </p>

      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/[0.08] bg-black/30 flex items-center justify-center shrink-0">
          {profile?.profile_picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profile_picture_url} alt="Bot logo" className="w-full h-full object-cover" />
          ) : (
            <ImageUp size={18} className="text-vodium-cream/25" />
          )}
        </div>
        <div className="min-w-0 text-xs">
          <p className="text-vodium-cream/70 truncate">{profile?.about ?? "No profile set yet"}</p>
          <p className="text-vodium-cream/35 truncate">{profile?.email ?? "—"}</p>
        </div>
      </div>

      <label className="block text-xs text-vodium-cream/45 mb-1.5">Logo URL (PNG or JPEG, square)</label>
      <input
        value={logoUrl}
        onChange={(e) => setLogoUrl(e.target.value)}
        placeholder="https://vodiumledger.com/logo.png"
        className="w-full bg-black/25 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-vodium-cream placeholder:text-vodium-cream/25 focus:outline-none focus:border-vodium-gold/40 mb-3"
      />

      {msg && (
        <div className={`flex items-start gap-2 rounded-lg px-3 py-2 mb-3 text-xs ${msg.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-rose-500/10 border border-rose-500/20 text-rose-300"}`}>
          {msg.ok ? <Check size={13} className="mt-0.5 shrink-0" /> : <AlertTriangle size={13} className="mt-0.5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <button
        onClick={apply}
        disabled={busy}
        className="btn-gold inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs disabled:opacity-50"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
        {logoUrl.trim() ? "Apply logo & branding" : "Apply Vodium branding"}
      </button>
    </div>
  );
}
