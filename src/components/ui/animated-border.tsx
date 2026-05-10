"use client";
import { cn } from "@/lib/utils";

export function AnimatedBorder({ children, className, containerClassName }: { children: React.ReactNode; className?: string; containerClassName?: string }) {
  return (
    <div className={cn("relative group/border", containerClassName)}>
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-vodium-gold/0 via-vodium-gold/60 to-vodium-gold/0 opacity-0 group-hover/border:opacity-100 transition-opacity duration-500 blur-[0.5px]" />
      <div className={cn("relative rounded-2xl bg-vodium-charcoal border border-white/[0.06]", className)}>
        {children}
      </div>
    </div>
  );
}
