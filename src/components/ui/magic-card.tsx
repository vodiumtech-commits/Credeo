"use client";
import { useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export function MagicCard({ children, className, gradientColor = "rgba(201,169,97,0.15)" }: { children: React.ReactNode; className?: string; gradientColor?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn("relative overflow-hidden rounded-2xl border border-white/[0.06] bg-vodium-charcoal", className)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 rounded-2xl"
        style={{
          opacity,
          background: `radial-gradient(350px circle at ${pos.x}px ${pos.y}px, ${gradientColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
