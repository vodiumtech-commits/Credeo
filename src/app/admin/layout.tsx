"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Store, BarChart3, Shield,
  LogOut, Menu, X, Bell, ChevronRight
} from "lucide-react";

const NAV = [
  { href: "/admin",           icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/vendors",   icon: Store,           label: "Vendors" },
  { href: "/admin/analytics", icon: BarChart3,       label: "Analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col bg-vodium-black border-r border-white/[0.06] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-base">V</span>
            </div>
            <div>
              <p className="font-serif text-[11px] tracking-[0.2em] text-vodium-gold leading-none">VODIUM</p>
              <p className="text-[9px] text-vodium-cream/25 tracking-wider mt-0.5">ADMIN CONSOLE</p>
            </div>
          </div>
        </div>

        {/* Admin badge */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-vodium-gold/20 border border-vodium-gold/30 flex items-center justify-center">
              <Shield size={13} className="text-vodium-gold" />
            </div>
            <div>
              <p className="text-vodium-cream text-xs font-semibold">Victor Kalejaiye</p>
              <p className="text-vodium-cream/35 text-[10px]">CEO · Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={`sidebar-item ${isActive ? "active" : ""}`}>
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 border-t border-white/[0.06] pt-4 space-y-0.5">
          <Link href="/dashboard" className="sidebar-item text-xs">
            <ChevronRight size={16} /> Vendor view
          </Link>
          <Link href="/" className="sidebar-item text-xs">
            <ChevronRight size={16} /> Public site
          </Link>
          <button onClick={handleSignOut} className="sidebar-item w-full text-left text-xs">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ─────────────────────────────── */}
      {open && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setOpen(false)} />}

      {/* ── Mobile sidebar ─────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-vodium-black flex flex-col border-r border-white/[0.06] md:hidden transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/[0.06]">
          <span className="font-serif text-xs tracking-[0.2em] text-vodium-gold">VODIUM ADMIN</span>
          <button onClick={() => setOpen(false)} className="text-vodium-cream/40 hover:text-vodium-cream">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} className={`sidebar-item ${isActive ? "active" : ""}`}>
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-vodium-black/90 border-b border-white/[0.06] sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="md:hidden text-vodium-cream/50 hover:text-vodium-cream">
              <Menu size={20} />
            </button>
            <div className="hidden md:block">
              <p className="text-xs text-vodium-cream/35">
                Admin Console &mdash; Today is{" "}
                <span className="text-vodium-cream/60">
                  {new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-vodium-cream/40 hover:text-vodium-gold hover:border-vodium-gold/30 transition-colors">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-vodium-gold rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-vodium-gold/20 border border-vodium-gold/30 flex items-center justify-center">
              <span className="text-vodium-gold text-xs font-bold">VK</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 text-vodium-cream">
          {children}
        </main>
      </div>
    </div>
  );
}
