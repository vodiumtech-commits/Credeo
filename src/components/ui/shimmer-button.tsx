"use client";
import { cn } from "@/lib/utils";

export function ShimmerButton({ children, className, onClick, type = "button" }: { children: React.ReactNode; className?: string; onClick?: () => void; type?: "button" | "submit" | "reset" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center h-12 overflow-hidden rounded-xl px-8 font-semibold text-sm transition-all focus:outline-none",
        "bg-vodium-gold text-vodium-black",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:-translate-x-full hover:before:animate-[shimmer_1s_ease_1]",
        "hover:shadow-[0_0_30px_rgba(201,169,97,0.4)] hover:brightness-105",
        "active:scale-[0.98]",
        className
      )}
    >
      {children}
    </button>
  );
}
