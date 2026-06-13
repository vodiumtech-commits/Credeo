"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle, Loader2 } from "lucide-react";

export function BulkRemindButton({ overdueCount }: { overdueCount: number }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(
    null,
  );

  if (overdueCount === 0) return null;

  async function handleClick() {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/vendor/remind-overdue", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setResult({ sent: data.sent, failed: data.failed });
      setState("done");
      setTimeout(() => setState("idle"), 5000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  if (state === "done" && result) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
        <CheckCircle size={13} />
        {result.sent} reminder{result.sent !== 1 ? "s" : ""} sent
        {result.failed > 0 && (
          <span className="text-rose-400">({result.failed} failed)</span>
        )}
      </span>
    );
  }

  if (state === "error") {
    return (
      <span className="text-xs text-rose-400">
        Failed to send reminders try again.
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border border-rose-500/25 text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {state === "loading" ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <MessageCircle size={14} />
      )}
      {state === "loading"
        ? "Sending…"
        : `Remind all overdue (${overdueCount})`}
    </button>
  );
}
