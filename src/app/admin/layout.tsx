"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Bell,
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

  // Current page label for breadcrumb
  const currentNav = NAV.find(
    (n) => n.href === pathname || (n.href !== "/admin" && pathname.startsWith(n.href))
  );
  const breadcrumb = currentNav?.label ?? "Overview";

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col bg-[#080808] border-r border-white/[0.05] fixed inset-y-0 left-0 z-30 w-14 xl:w-[220px] transition-all duration-300">
        {/* Logo / monogram */}
        <div className="h-16 flex items-center justify-center xl:justify-start xl:px-5 border-b border-white/[0.05] flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-vodium-gold text-base leading-none">V</span>
          </div>
          <div className="hidden xl:block ml-3 overflow-hidden">
            <p className="font-serif text-[11px] tracking-[0.2em] text-vodium-gold leading-none whitespace-nowrap">
              VODIUM
            </p>
            <p className="text-[9px] text-vodium-cream/25 tracking-wider mt-0.5 whitespace-nowrap">
              ADMIN CONSOLE
            </p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col items-center xl:items-stretch gap-0.5 px-2 py-4">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`
                  group relative flex items-center justify-center xl:justify-start
                  h-10 xl:h-9 w-10 xl:w-auto xl:px-3 rounded-lg
                  transition-all duration-150 gap-3
                  ${isActive
                    ? "bg-vodium-gold/[0.07] text-vodium-gold border-l-0 xl:border-l-2 xl:border-vodium-gold xl:rounded-l-none xl:pl-[10px]"
                    : "text-vodium-cream/40 hover:text-vodium-cream/70 hover:bg-white/[0.04]"
                  }
                `}
              >
                <Icon
                  size={17}
                  className={`flex-shrink-0 transition-colors ${isActive ? "text-vodium-gold" : ""}`}
                />
                <span className="hidden xl:block text-sm font-medium whitespace-nowrap">
                  {label}
                </span>
                {/* Tooltip on icon-only rail (non-xl) */}
                <span className="xl:hidden absolute left-full ml-3 px-2 py-1 bg-vodium-charcoal border border-white/[0.08] rounded-md text-xs text-vodium-cream/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer already provided by flex-1 above */}

        {/* Bottom: admin indicator + sign out */}
        <div className="flex flex-col items-center xl:items-stretch gap-0.5 px-2 pb-4 border-t border-white/[0.05] pt-4">
          {/* Admin indicator */}
          <div
            className="group relative flex items-center justify-center xl:justify-start h-10 xl:h-auto xl:px-3 xl:py-2.5 rounded-lg"
            title="Super Admin"
          >
            <div className="w-7 h-7 rounded-full bg-vodium-gold/15 border border-vodium-gold/25 flex items-center justify-center flex-shrink-0">
              <Shield size={13} className="text-vodium-gold" />
            </div>
            <div className="hidden xl:block ml-2.5 overflow-hidden">
              <p className="text-vodium-cream text-xs font-semibold leading-none whitespace-nowrap">
                Victor Kalejaiye
              </p>
              <p className="text-vodium-cream/35 text-[10px] mt-0.5 whitespace-nowrap">
                CEO · Super Admin
              </p>
            </div>
            {/* Tooltip */}
            <span className="xl:hidden absolute left-full ml-3 px-2 py-1 bg-vodium-charcoal border border-white/[0.08] rounded-md text-xs text-vodium-cream/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              Super Admin
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="group relative flex items-center justify-center xl:justify-start h-10 xl:h-9 w-10 xl:w-auto xl:px-3 rounded-lg text-vodium-cream/35 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all duration-150 gap-3"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className="hidden xl:block text-sm font-medium whitespace-nowrap">
              Sign out
            </span>
            {/* Tooltip */}
            <span className="xl:hidden absolute left-full ml-3 px-2 py-1 bg-vodium-charcoal border border-white/[0.08] rounded-md text-xs text-vodium-cream/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer sidebar ────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#080808]
          flex flex-col border-r border-white/[0.05] md:hidden
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-base leading-none">V</span>
            </div>
            <div>
              <p className="font-serif text-[11px] tracking-[0.2em] text-vodium-gold leading-none">
                VODIUM
              </p>
              <p className="text-[9px] text-vodium-cream/25 tracking-wider mt-0.5">
                ADMIN CONSOLE
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-vodium-cream/40 hover:text-vodium-cream transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive
                    ? "bg-vodium-gold/[0.07] text-vodium-gold border-l-2 border-vodium-gold rounded-l-none pl-[10px]"
                    : "text-vodium-cream/50 hover:text-vodium-cream/80 hover:bg-white/[0.04]"
                  }
                `}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile bottom */}
        <div className="px-3 pb-5 border-t border-white/[0.05] pt-4 space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="w-7 h-7 rounded-full bg-vodium-gold/15 border border-vodium-gold/25 flex items-center justify-center">
              <Shield size={13} className="text-vodium-gold" />
            </div>
            <div>
              <p className="text-vodium-cream text-xs font-semibold">Victor Kalejaiye</p>
              <p className="text-vodium-cream/35 text-[10px]">CEO · Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left text-sm text-vodium-cream/40 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-14 xl:ml-[220px] flex flex-col min-h-screen transition-all duration-300">
        {/* Sticky top bar */}
        <header className="bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/[0.05] sticky top-0 z-20 px-5 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden text-vodium-cream/50 hover:text-vodium-cream transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs text-vodium-cream/35">
              <span>Admin Console</span>
              <span className="text-vodium-cream/20">›</span>
              <span className="text-vodium-cream/60 font-medium">{breadcrumb}</span>
            </div>

            {/* Mobile breadcrumb */}
            <div className="md:hidden">
              <p className="text-sm font-medium text-vodium-cream/80">{breadcrumb}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date — desktop only */}
            <p className="hidden lg:block text-[11px] text-vodium-cream/30">
              {new Date().toLocaleDateString("en-NG", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            {/* Bell */}
            <button className="relative w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-vodium-cream/40 hover:text-vodium-gold hover:border-vodium-gold/30 transition-colors">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-vodium-gold rounded-full" />
            </button>

            {/* Admin avatar initials */}
            <div className="w-8 h-8 rounded-full bg-vodium-gold/20 border border-vodium-gold/30 flex items-center justify-center">
              <span className="text-vodium-gold text-xs font-bold">VK</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 text-vodium-cream">
          {children}
        </main>
      </div>
    </div>
  );
}
