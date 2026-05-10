"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, sub, icon, trend, trendUp, delay = 0, className }: {
  label: string; value: string; sub?: string; icon?: React.ReactNode; trend?: string; trendUp?: boolean; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("relative overflow-hidden rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-5", className)}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-vodium-gold/5 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-vodium-cream/40 uppercase tracking-wider leading-tight">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center text-vodium-gold flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      <p className="font-serif text-2xl md:text-3xl text-vodium-gold mb-1">{value}</p>
      {sub && <p className="text-xs text-vodium-cream/35">{sub}</p>}
      {trend && (
        <div className={cn("flex items-center gap-1 mt-3 pt-3 border-t border-white/[0.05] text-xs font-medium", trendUp ? "text-emerald-400" : "text-rose-400")}>
          <span>{trendUp ? "↑" : "↓"}</span>
          <span>{trend}</span>
        </div>
      )}
    </motion.div>
  );
}
