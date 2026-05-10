import { cn } from "@/lib/utils";

export function GlowBadge({ children, color = "gold", className }: { children: React.ReactNode; color?: "gold" | "green" | "red" | "amber" | "blue"; className?: string }) {
  const colors = {
    gold:  "bg-vodium-gold/10 text-vodium-gold border-vodium-gold/25 shadow-[0_0_12px_rgba(201,169,97,0.15)]",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    red:   "bg-rose-500/10 text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    blue:  "bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", colors[color], className)}>
      {children}
    </span>
  );
}
