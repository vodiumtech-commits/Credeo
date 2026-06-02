"use client";

import { useState } from "react";
import { NavProgress } from "@/components/ui/nav-progress";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Store, BarChart3, Shield, LogOut,
  Menu, X, Bell, TrendingUp, Headphones, Users,
} from "lucide-react";
import type { AdminRole } from "@/lib/session";

interface Props {
  name:     string;
  email:    string | null;
  role:     AdminRole;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN:   "Super Admin",
  CFO:           "CFO",
  CUSTOMER_CARE: "Customer Care",
  ANALYTICS:     "Analytics",
};

const NAV_BY_ROLE: Record<AdminRole, { href: string; icon: React.ElementType; label: string }[]> = {
  SUPER_ADMIN: [
    { href: "/admin",           icon: LayoutDashboard, label: "Overview"  },
    { href: "/admin/vendors",   icon: Store,           label: "Vendors"   },
    { href: "/admin/finance",   icon: TrendingUp,      label: "Finance"   },
    { href: "/admin/support",   icon: Headphones,      label: "Support"   },
    { href: "/admin/analytics", icon: BarChart3,       label: "Analytics" },
    { href: "/admin/team",      icon: Users,           label: "Team"      },
  ],
  CFO: [
    { href: "/admin",           icon: LayoutDashboard, label: "Overview"  },
    { href: "/admin/finance",   icon: TrendingUp,      label: "Finance"   },
    { href: "/admin/analytics", icon: BarChart3,       label: "Analytics" },
  ],
  CUSTOMER_CARE: [
    { href: "/admin",           icon: LayoutDashboard, label: "Overview"  },
    { href: "/admin/support",   icon: Headphones,      label: "Support"   },
    { href: "/admin/vendors",   icon: Store,           label: "Vendors"   },
  ],
  ANALYTICS: [
    { href: "/admin",           icon: LayoutDashboard, label: "Overview"  },
    { href: "/admin/analytics", icon: BarChart3,       label: "Analytics" },
  ],
};

function initials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export function AdminShell({ name, email: _email, role, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  const NAV = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.SUPER_ADMIN;

  const currentNav = NAV.find(
    (n) => n.href === pathname || (n.href !== "/admin" && pathname.startsWith(n.href))
  );
  const breadcrumb = currentNav?.label ?? "Overview";

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/admin/login");
  }

  const renderNav = (items: typeof NAV, mobile = false) =>
    items.map(({ href, icon: Icon, label }) => {
      const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
      return (
        <Link key={href} href={href} title={label}
          onClick={() => mobile && setOpen(false)}
          className={`
            group relative flex items-center gap-3 transition-all duration-150
            ${mobile
              ? "px-3 py-2.5 rounded-lg text-sm font-medium"
              : "justify-center xl:justify-start h-10 xl:h-9 w-10 xl:w-auto xl:px-3 rounded-lg"}
            ${isActive
              ? mobile
                ? "bg-vodium-gold/[0.07] text-vodium-gold border-l-2 border-vodium-gold rounded-l-none pl-[10px]"
                : "bg-vodium-gold/[0.07] text-vodium-gold xl:border-l-2 xl:border-vodium-gold xl:rounded-l-none xl:pl-[10px]"
              : "text-vodium-cream/40 hover:text-vodium-cream/70 hover:bg-white/[0.04]"}
          `}
        >
          <Icon size={17} className="flex-shrink-0" />
          {mobile
            ? <span>{label}</span>
            : <span className="hidden xl:block text-sm font-medium whitespace-nowrap">{label}</span>
          }
          {!mobile && (
            <span className="xl:hidden absolute left-full ml-3 px-2 py-1 bg-vodium-charcoal border border-white/[0.08] rounded-md text-xs text-vodium-cream/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              {label}
            </span>
          )}
        </Link>
      );
    });

  const avatarText = initials(name);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col bg-[#080808] border-r border-white/[0.05] fixed inset-y-0 left-0 z-30 w-14 xl:w-[220px] transition-all duration-300">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center xl:justify-start xl:px-5 border-b border-white/[0.05] flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-vodium-gold text-base leading-none">V</span>
          </div>
          <div className="hidden xl:block ml-3">
            <p className="font-serif text-[11px] tracking-[0.2em] text-vodium-gold leading-none whitespace-nowrap">VODIUM</p>
            <p className="text-[9px] text-vodium-cream/25 tracking-wider mt-0.5 whitespace-nowrap">ADMIN CONSOLE</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col items-center xl:items-stretch gap-0.5 px-2 py-4">
          {renderNav(NAV)}
        </nav>

        {/* Profile + sign out */}
        <div className="flex flex-col items-center xl:items-stretch gap-0.5 px-2 pb-4 border-t border-white/[0.05] pt-4">
          <div className="group relative flex items-center justify-center xl:justify-start h-10 xl:h-auto xl:px-3 xl:py-2.5 rounded-lg" title={name}>
            <div className="w-7 h-7 rounded-full bg-vodium-gold/15 border border-vodium-gold/25 flex items-center justify-center flex-shrink-0">
              <span className="text-vodium-gold text-[10px] font-bold">{avatarText}</span>
            </div>
            <div className="hidden xl:block ml-2.5 overflow-hidden">
              <p className="text-vodium-cream text-xs font-semibold leading-none whitespace-nowrap truncate max-w-[130px]">{name}</p>
              <p className="text-vodium-cream/35 text-[10px] mt-0.5 whitespace-nowrap">{ROLE_LABELS[role]}</p>
            </div>
            <span className="xl:hidden absolute left-full ml-3 px-2 py-1 bg-vodium-charcoal border border-white/[0.08] rounded-md text-xs text-vodium-cream/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              {name}
            </span>
          </div>

          <button onClick={handleSignOut} title="Sign out"
            className="group relative flex items-center justify-center xl:justify-start h-10 xl:h-9 w-10 xl:w-auto xl:px-3 rounded-lg text-vodium-cream/35 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all gap-3">
            <LogOut size={16} className="flex-shrink-0" />
            <span className="hidden xl:block text-sm font-medium whitespace-nowrap">Sign out</span>
            <span className="xl:hidden absolute left-full ml-3 px-2 py-1 bg-vodium-charcoal border border-white/[0.08] rounded-md text-xs text-vodium-cream/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              Sign out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {open && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setOpen(false)} />}

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#080808] flex flex-col border-r border-white/[0.05] md:hidden transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-base leading-none">V</span>
            </div>
            <div>
              <p className="font-serif text-[11px] tracking-[0.2em] text-vodium-gold leading-none">VODIUM</p>
              <p className="text-[9px] text-vodium-cream/25 tracking-wider mt-0.5">ADMIN CONSOLE</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-vodium-cream/40 hover:text-vodium-cream transition-colors p-1">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">{renderNav(NAV, true)}</nav>
        <div className="px-3 pb-5 border-t border-white/[0.05] pt-4 space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="w-7 h-7 rounded-full bg-vodium-gold/15 border border-vodium-gold/25 flex items-center justify-center">
              <span className="text-vodium-gold text-[10px] font-bold">{avatarText}</span>
            </div>
            <div>
              <p className="text-vodium-cream text-xs font-semibold">{name}</p>
              <p className="text-vodium-cream/35 text-[10px]">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm text-vodium-cream/40 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-14 xl:ml-[220px] flex flex-col min-h-screen transition-all duration-300">
        <header className="bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/[0.05] sticky top-0 z-20 px-5 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="md:hidden text-vodium-cream/50 hover:text-vodium-cream transition-colors">
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs text-vodium-cream/35">
              <span>Admin Console</span>
              <span className="text-vodium-cream/20">›</span>
              <span className="text-vodium-cream/60 font-medium">{breadcrumb}</span>
            </div>
            <p className="md:hidden text-sm font-medium text-vodium-cream/80">{breadcrumb}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden lg:block text-[10px] px-2.5 py-1 rounded-full border border-vodium-gold/20 text-vodium-gold/60">
              {ROLE_LABELS[role]}
            </span>
            <p className="hidden lg:block text-[11px] text-vodium-cream/25">
              {new Date().toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <button className="relative w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-vodium-cream/40 hover:text-vodium-gold hover:border-vodium-gold/30 transition-colors">
              <Bell size={14} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-vodium-gold rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-vodium-gold/20 border border-vodium-gold/30 flex items-center justify-center">
              <span className="text-vodium-gold text-xs font-bold">{avatarText}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 text-vodium-cream">{children}</main>
      </div>
      <NavProgress />
    </div>
  );
}
