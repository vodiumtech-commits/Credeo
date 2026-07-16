"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  CFO: "CFO",
  CUSTOMER_CARE: "Customer Care",
  ANALYTICS: "Analytics",
  MARKETING: "Marketing",
};

type Status = "loading" | "valid" | "invalid" | "expired" | "used";

export default function AdminInvitePage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/invite/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 410) {
            setStatus(data.error?.includes("used") ? "used" : "expired");
          } else {
            setStatus("invalid");
          }
          return;
        }
        setInfo(data);
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Activation failed");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Loading
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-vodium-black flex items-center justify-center">
        <Loader2 size={28} className="text-vodium-gold animate-spin" />
      </div>
    );
  }

  // Invalid / expired / used
  if (status !== "valid") {
    const messages: Record<
      Exclude<Status, "loading" | "valid">,
      { title: string; body: string }
    > = {
      invalid: {
        title: "Invalid link",
        body: "This invitation link is invalid or doesn't exist.",
      },
      expired: {
        title: "Link expired",
        body: "This invitation has expired. Ask Super Admin to resend your invite.",
      },
      used: {
        title: "Already activated",
        body: "This invitation has already been used. Go to the login page.",
      },
    };
    const msg = messages[status];
    return (
      <div className="min-h-screen bg-vodium-black flex items-center justify-center px-6">
        <div className="bg-vodium-charcoal border border-white/[0.08] rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={24} className="text-rose-400" />
          </div>
          <h1 className="font-serif text-xl text-vodium-cream mb-2">
            {msg.title}
          </h1>
          <p className="text-vodium-cream/45 text-sm mb-6">{msg.body}</p>
          <a
            href="/admin/login"
            className="btn-gold px-6 py-2.5 rounded-xl text-sm inline-block"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  // Valid show activation form
  return (
    <div className="min-h-screen bg-vodium-black flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-vodium-charcoal border border-white/[0.08] rounded-2xl p-10 shadow-[0_0_60px_rgba(201,169,97,0.06)]">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-vodium-gold/10 border border-vodium-gold/30 flex items-center justify-center mb-4">
              <Shield size={24} className="text-vodium-gold" />
            </div>
            <p className="text-vodium-gold text-xs tracking-[0.3em] uppercase mb-1.5">
              Admin Console
            </p>
            <h1 className="font-serif text-2xl text-vodium-cream text-center">
              Activate your account
            </h1>
            <p className="text-vodium-cream/40 text-sm mt-1.5 text-center">
              Welcome, {info!.name}
            </p>
          </div>

          {/* Role badge */}
          <div className="bg-vodium-gold/[0.06] border border-vodium-gold/15 rounded-xl px-5 py-4 mb-7 flex items-center gap-3">
            <CheckCircle2
              size={16}
              className="text-vodium-gold flex-shrink-0"
            />
            <div>
              <p className="text-xs text-vodium-cream/50 uppercase tracking-wider">
                Your role
              </p>
              <p className="text-vodium-cream font-semibold text-sm mt-0.5">
                {ROLE_LABELS[info!.role] ?? info!.role}
              </p>
            </div>
            <p className="text-xs text-vodium-cream/30 ml-auto">
              {info!.email}
            </p>
          </div>

          <form onSubmit={handleActivate} className="space-y-4">
            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-vodium-cream/50 mb-2 uppercase tracking-wider">
                Set password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none"
                />
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Minimum 8 characters"
                  className="input-dark pl-10 pr-12 w-full"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-vodium-cream/30 hover:text-vodium-cream/70 transition-colors"
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-medium text-vodium-cream/50 mb-2 uppercase tracking-wider">
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-vodium-cream/30 pointer-events-none"
                />
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setError(null);
                  }}
                  placeholder="Re-enter password"
                  className="input-dark pl-10 w-full"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="btn-gold w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Activating…
                </>
              ) : (
                "Activate account & sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
