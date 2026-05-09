"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut,
  MessageCircle, Menu, X, Plus, Bell
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/customers", icon: Users,           label: "Customers" },
  { href: "/dashboard/credits",   icon: CreditCard,      label: "Credits" },
  { href: "/dashboard/settings",  icon: Settings,        label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-vodium-cream flex">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col bg-vodium-black border-r border-white/[0.06] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-base">V</span>
            </div>
            <div>
              <p className="font-serif text-xs tracking-[0.2em] text-vodium-gold leading-none">VODIUM</p>
              <p className="text-[10px] text-vodium-cream/30 tracking-wide mt-0.5">LEDGER</p>
            </div>
          </Link>
        </div>

        {/* Vendor info */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <p className="text-xs text-vodium-cream/35 uppercase tracking-widest mb-1">Your shop</p>
          <p className="text-vodium-cream font-semibold text-sm truncate">Mama Taiwo&rsquo;s Provisions</p>
          <p className="text-vodium-cream/40 text-xs mt-0.5">UNILAG · Growth plan</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={`sidebar-item ${isActive ? "active" : ""}`}>
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/[0.06] pt-4">
          <a
            href="https://wa.me/2348012345678?text=HELP"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-item"
          >
            <MessageCircle size={18} />
            WhatsApp bot
          </a>
          <button className="sidebar-item w-full text-left">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ─────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-vodium-black flex flex-col border-r border-white/[0.06] md:hidden transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-full bg-vodium-charcoal border border-vodium-gold/40 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-base">V</span>
            </div>
            <span className="font-serif text-xs tracking-[0.2em] text-vodium-gold">VODIUM LEDGER</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="text-vodium-cream/40 hover:text-vodium-cream">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <p className="text-vodium-cream font-semibold text-sm">Mama Taiwo&rsquo;s Provisions</p>
          <p className="text-vodium-cream/40 text-xs mt-0.5">UNILAG · Growth plan</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4 border-t border-white/[0.06] pt-4 space-y-1">
          <button className="sidebar-item w-full text-left">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-border sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-muted-foreground hover:text-vodium-black"
            >
              <Menu size={22} />
            </button>
            <div className="hidden md:block">
              <p className="text-xs text-muted-foreground">
                Welcome back,{" "}
                <span className="font-semibold text-vodium-black">Taiwo</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-vodium-black hover:border-vodium-gold transition-colors">
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>
            <Link
              href="/dashboard/credit/new"
              className="btn-gold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
            >
              <Plus size={16} /> Add credit
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
