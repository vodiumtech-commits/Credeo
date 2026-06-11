"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CreditCard, Settings, LogOut,
  MessageCircle, Menu, X, Plus, Bell, ChevronRight, Zap,
} from "lucide-react";
import { NpsWidget } from "@/components/ui/nps-widget";
import { NavProgress } from "@/components/ui/nav-progress";
import { NotificationBell } from "@/components/ui/notification-bell";

type VendorInfo = {
  businessName: string;
  ownerName: string;
  campusLocation: string | null;
  university: { shortName: string | null } | null;
  subscription: { plan: string; status: string } | null;
};

const NAV_ITEMS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Overview",  emoji: "◈" },
  { href: "/dashboard/credits",   icon: CreditCard,      label: "Credits",   emoji: "◉" },
  { href: "/dashboard/customers", icon: Users,           label: "Customers", emoji: "◎" },
  { href: "/dashboard/settings",  icon: Settings,        label: "Settings",  emoji: "◌" },
];

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "Overview",
  "/dashboard/credits":    "Credits",
  "/dashboard/customers":  "Customers",
  "/dashboard/settings":   "Settings",
  "/dashboard/credit/new": "New Credit",
};

const PLAN_COLORS: Record<string, string> = {
  STARTER:    "text-vodium-cream/60 bg-white/[0.05] border-white/[0.10]",
  GROWTH:     "text-vodium-gold bg-vodium-gold/10 border-vodium-gold/25",
  CAMPUS_PRO: "text-purple-400 bg-purple-400/10 border-purple-400/25",
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter", GROWTH: "Growth", CAMPUS_PRO: "Pro",
};

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendor, setVendor]           = useState<VendorInfo | null>(null);
  const pathname = usePathname();
  const router   = useRouter();

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
  const campus       = vendor?.university?.shortName ?? vendor?.campusLocation ?? "Campus";
  const plan         = vendor?.subscription?.plan ?? "STARTER";
  const planLabel    = PLAN_LABELS[plan] ?? plan;
  const planColor    = PLAN_COLORS[plan] ?? PLAN_COLORS.STARTER;
  const sub          = vendor?.subscription;
  const trialEndsAt  = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : null;
  const isTrial      = sub?.status === "TRIAL" || !sub;
  const isExpired    = sub?.status === "EXPIRED" || (isTrial && trialEndsAt && trialEndsAt < new Date());
  const daysLeft     = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000)) : null;

  const currentTitle =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES).find(([key]) => key !== "/dashboard" && pathname.startsWith(key))?.[1] ??
    "Dashboard";

  // Breadcrumb path
  const breadcrumbParts = pathname
    .split("/")
    .filter(Boolean)
    .map((part, i, arr) => ({
      label: PAGE_TITLES["/" + arr.slice(0, i + 1).join("/")] ?? part.charAt(0).toUpperCase() + part.slice(1),
      href:  "/" + arr.slice(0, i + 1).join("/"),
      last:  i === arr.length - 1,
    }));

  function SidebarContent({ onClose }: { onClose?: () => void }) {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.05] flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-2xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center group-hover:border-vodium-gold/60 transition-all duration-200 shadow-[0_0_12px_rgba(201,169,97,0.08)]">
              <span className="font-serif text-vodium-gold text-lg leading-none">V</span>
            </div>
            <div>
              <p className="font-serif text-[11px] tracking-[0.28em] text-vodium-gold leading-none">VODIUM</p>
              <p className="text-[9px] text-vodium-cream/20 tracking-[0.22em] mt-1.5 uppercase font-medium">Ledger</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold tracking-[0.18em] text-vodium-cream/20 uppercase px-3 mb-3">Navigation</p>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={[
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-vodium-gold/[0.08] text-vodium-gold border border-vodium-gold/15 shadow-[0_1px_8px_rgba(201,169,97,0.06)]"
                    : "text-vodium-cream/40 hover:text-vodium-cream/80 hover:bg-white/[0.04] border border-transparent",
                ].join(" ")}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-vodium-gold/70 flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* WhatsApp shortcut */}
        <div className="px-3 pb-2">
          <div className="h-px bg-white/[0.05] mb-3" />
          <a
            href="/whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-vodium-cream/30 hover:text-vodium-cream/70 hover:bg-white/[0.03] border border-transparent transition-all duration-150"
          >
            <MessageCircle size={16} className="flex-shrink-0 text-emerald-500/50" />
            <span className="flex-1">WhatsApp bot</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 flex-shrink-0 animate-pulse" />
          </a>
        </div>

        {/* Vendor block */}
        <div className="px-3 pb-4 pt-2 space-y-2">
          <div className="h-px bg-white/[0.05] mb-3" />

          {/* Subscription banner */}
          {isExpired ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-500/[0.05] border border-rose-500/20 px-3 py-2.5 mb-2 shadow-[0_2px_10px_rgba(244,63,94,0.05)]">
              <X size={13} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-rose-400 leading-tight">Trial expired</p>
                <Link href="/dashboard/upgrade" className="text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors mt-0.5 block font-medium underline underline-offset-2">
                  Renew subscription →
                </Link>
              </div>
            </div>
          ) : isTrial ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-vodium-gold/[0.05] border border-vodium-gold/15 px-3 py-2.5 mb-2">
              <Zap size={13} className="text-vodium-gold flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-vodium-gold leading-tight">
                  {daysLeft !== null ? `${daysLeft} days left in trial` : "60-day free trial"}
                </p>
                <Link href="/dashboard/upgrade" className="text-[10px] text-vodium-gold/50 hover:text-vodium-gold transition-colors mt-0.5 block">
                  Upgrade plan →
                </Link>
              </div>
            </div>
          ) : null}

          {/* Vendor info */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-vodium-gold/10 border border-vodium-gold/20 flex items-center justify-center flex-shrink-0">
                <span className="font-serif text-vodium-gold text-sm font-bold leading-none">{initial(businessName)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-vodium-cream truncate leading-tight">{businessName}</p>
                <p className="text-[10px] text-vodium-cream/30 mt-0.5 truncate">{campus}</p>
              </div>
            </div>
            <div className="mt-2.5">
              <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-lg border ${planColor}`}>
                {planLabel} plan
              </span>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-vodium-cream/25 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all duration-150 border border-transparent"
          >
            <LogOut size={15} className="flex-shrink-0" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-[#080808] border-r border-white/[0.05] fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#080808] flex flex-col border-r border-white/[0.05] md:hidden transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] flex-shrink-0">
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
            className="w-8 h-8 rounded-xl flex items-center justify-center text-vodium-cream/40 hover:text-vodium-cream hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-white/[0.05] px-5 h-14 flex items-center justify-between">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-vodium-cream/50 hover:text-vodium-cream hover:bg-white/[0.06] transition-colors"
            >
              <Menu size={18} />
            </button>
            {/* Desktop breadcrumb */}
            <nav className="hidden md:flex items-center gap-1.5 text-[11px]">
              {breadcrumbParts.map((part, i) => (
                <span key={part.href} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={11} className="text-vodium-cream/20" />}
                  {part.last ? (
                    <span className="text-vodium-cream/80 font-medium">{part.label}</span>
                  ) : (
                    <Link href={part.href} className="text-vodium-cream/30 hover:text-vodium-gold transition-colors">{part.label}</Link>
                  )}
                </span>
              ))}
            </nav>
            {/* Mobile title */}
            <span className="md:hidden text-sm font-semibold text-vodium-cream/80">{currentTitle}</span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Plan badge — desktop only */}
            <span className={`hidden lg:inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border ${planColor}`}>
              {planLabel}
            </span>
            {/* Notification bell */}
            <NotificationBell />
            {/* Add credit */}
            <Link
              href="/dashboard/credit/new"
              className="btn-gold px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 h-8"
            >
              <Plus size={13} />
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
