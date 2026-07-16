// Cookie name constants and role permissions — shared between session.ts (Node runtime)
// and middleware.ts (Edge runtime). ZERO imports so it is safe in both runtimes.

export const VENDOR_COOKIE     = "vodium_sid";
export const ADMIN_COOKIE      = "vodium_asid";
export const VENDOR_COOKIE_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
export const ADMIN_COOKIE_AGE  = 60 * 60 * 8;        // 8 hours in seconds

// Which roles may access each admin route prefix (most-specific first).
export const ADMIN_ROUTE_ROLES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin/team",      roles: ["SUPER_ADMIN"] },
  { prefix: "/admin/finance",   roles: ["SUPER_ADMIN", "CFO"] },
  { prefix: "/admin/support",   roles: ["SUPER_ADMIN", "CUSTOMER_CARE"] },
  { prefix: "/admin/analytics", roles: ["SUPER_ADMIN", "CFO", "ANALYTICS"] },
  { prefix: "/admin/vendors",   roles: ["SUPER_ADMIN", "CUSTOMER_CARE"] },
  // Super admin has oversight of disputes; customer care attends to them.
  // (The API additionally restricts the resolve action to CUSTOMER_CARE.)
  { prefix: "/admin/disputes",  roles: ["SUPER_ADMIN", "CUSTOMER_CARE"] },
  { prefix: "/api/admin/disputes", roles: ["SUPER_ADMIN", "CUSTOMER_CARE"] },
  { prefix: "/admin/marketing", roles: ["SUPER_ADMIN", "MARKETING"] },
  { prefix: "/api/admin/ambassadors", roles: ["SUPER_ADMIN", "MARKETING"] },
  { prefix: "/admin/organizations", roles: ["SUPER_ADMIN"] },
  { prefix: "/api/admin/organizations", roles: ["SUPER_ADMIN"] },
  { prefix: "/api/admin/team",  roles: ["SUPER_ADMIN"] },
  { prefix: "/api/admin/vendors", roles: ["SUPER_ADMIN", "CUSTOMER_CARE"] },
  { prefix: "/admin",           roles: ["SUPER_ADMIN", "CFO", "CUSTOMER_CARE", "ANALYTICS"] },
  { prefix: "/api/admin",       roles: ["SUPER_ADMIN", "CFO", "CUSTOMER_CARE", "ANALYTICS"] },
];
