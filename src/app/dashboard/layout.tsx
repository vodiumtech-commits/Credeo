"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut,
  MessageCircle, Menu, X, Plus, Bell, Store, ChevronRight,
} from "lucide-react";
import { NpsWidget } from "@/components/ui/nps-widget";
import { NavProgress } from "@/components/ui/nav-progress";

type VendorInfo = {
  businessName: string;
  ownerName: string;
  campusLocation: string | null;
  university: { shortName: string | null } | null;
  subscription: { plan: string; status: string } | null;
};

const NAV_ITEMS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/credits",   icon: CreditCard,      label: "Credits" },
  { href: "/dashboard/customers", icon: Users,           label: "Customers" },
  { href: "/dashboard/settings",  icon: Settings,        label: "Settings" },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "Overview",
  "/dashboard/credits":    "Credits",
  "/dashboard/customers":  "Customers",
  "/dashboard/settings":   "Settings",
  "/dashboard/credit/new": "New Credit",
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Campus Pro",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/vendor/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setVendor(data));
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  }

  const businessName = vendor?.businessName ?? "My Shop";
  const campus = vendor?.university?.shortName ?? "Campus";
  const plan = vendor?.subscription?.plan ?? "STARTER";
  const planLabel = PLAN_LABELS[plan] ?? plan;

  // Derive current page title
  const currentTitle =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([key]) => key !== "/dashboard" && pathname.startsWith(key))?.[1] ??
    "Dashboard";

  function SidebarContent({ onClose }: { onClose?: () => void }) {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center group-hover:border-vodium-gold/60 transition-colors">
              <span className="font-serif text-vodium-gold text-lg leading-none">V</span>
            </div>
            <div>
              <p className="font-serif text-[11px] tracking-[0.25em] text-vodium-gold leading-none">VODIUM</p>
              <p className="text-[9px] text-vodium-cream/25 tracking-[0.2em] mt-1 uppercase">Ledger</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative",
                  isActive
                    ? "text-vodium-gold bg-vodium-gold/10 border-l-2 border-vodium-gold pl-[10px]"
                    : "text-vodium-cream/45 hover:text-vodium-cream hover:bg-white/[0.04] border-l-2 border-transparent pl-[10px]",
                ].join(" ")}
              >
                <Icon size={17} className="flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* WhatsApp bot shortcut */}
        <div className="px-3 pt-3">
          <a
            href="https://wa.me/2348012345678?text=HELP"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-vodium-cream/35 hover:text-vodium-cream hover:bg-white/[0.04] transition-all duration-150 border-l-2 border-transparent pl-[10px]"
          >
            <MessageCircle size={17} className="flex-shrink-0" />
            WhatsApp Bot
          </a>
        </div>

        {/* Vendor block + sign out */}
        <div className="px-3 pb-4 pt-3 space-y-2">
          {/* Vendor info card */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-vodium-charcoal border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                <Store size={13} className="text-vodium-gold/70" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-vodium-cream truncate leading-tight">{businessName}</p>
                <p className="text-[10px] text-vodium-cream/35 mt-0.5 truncate">{campus}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-vodium-gold/10 text-vodium-gold border border-vodium-gold/20">
              {planLabel} plan
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-vodium-cream/35 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all duration-150 border-l-2 border-transparent pl-[10px]"
          >
            <LogOut size={17} className="flex-shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      {/* Desktop sidebar — fixed 240px */}
      <aside className="hidden md:flex w-60 flex-col bg-vodium-black border-r border-white/[0.06] fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-vodium-black flex flex-col border-r border-white/[0.06] md:hidden transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile drawer header with close */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center">
              <span className="font-serif text-vodium-gold text-base leading-none">V</span>
            </div>
            <div>
              <p className="font-serif text-[11px] tracking-[0.25em] text-vodium-gold leading-none">VODIUM</p>
              <p className="text-[9px] text-vodium-cream/25 tracking-[0.2em] mt-1 uppercase">Ledger</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-vodium-cream/40 hover:text-vodium-cream hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main area */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Sticky dark header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/[0.06] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-vodium-cream/50 hover:text-vodium-cream hover:bg-white/[0.06] transition-colors"
            >
              <Menu size={20} />
            </button>
            {/* Page title */}
            <h2 className="font-serif text-base text-vodium-cream/90 tracking-tight">{currentTitle}</h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center text-vodium-cream/40 hover:text-vodium-cream hover:border-vodium-gold/30 transition-colors">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
            {/* Add credit CTA */}
            <Link
              href="/dashboard/credit/new"
              className="btn-gold px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add credit</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <NpsWidget />
      <NavProgress />
    </div>
  );
}
