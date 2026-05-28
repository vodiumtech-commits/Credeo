// Cookie name constants shared between session.ts (Node runtime) and middleware.ts (Edge runtime).
// This file must have ZERO imports so it is safe to use in both runtimes.

export const VENDOR_COOKIE     = "vodium_sid";
export const ADMIN_COOKIE      = "vodium_asid";
export const VENDOR_COOKIE_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
export const ADMIN_COOKIE_AGE  = 60 * 60 * 8;        // 8 hours in seconds
