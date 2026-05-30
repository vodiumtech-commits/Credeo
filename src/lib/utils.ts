import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Naira currency. */
export function formatNaira(amount: number | string): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "₦0";
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/**
 * Normalise a phone number to E.164.
 * Accepts Nigerian numbers (0-prefix or +234) and US numbers (+1 or 10 digits).
 * The client always sends a prefixed number (e.g. "+2348012345678" or "+14155551234"),
 * so this function primarily validates and standardises format.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  // Already prefixed with + — trust the client-supplied dial code
  if (input.trimStart().startsWith("+")) {
    // Nigeria: +234 + 10 digits = 13 total digits
    if (digits.startsWith("234") && digits.length === 13) return `+${digits}`;
    // US: +1 + 10 digits = 11 total digits
    if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
    // Other valid E.164 (10–15 digit range)
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  // Nigerian: 0-prefix 11 digits
  if (digits.length === 11 && digits.startsWith("0")) return `+234${digits.slice(1)}`;
  // Nigerian: bare 10 digits (no country code, no 0-prefix)
  if (digits.length === 10 && !digits.startsWith("1")) return `+234${digits}`;
  // Nigerian: 234 + 10
  if (digits.length === 13 && digits.startsWith("234")) return `+${digits}`;

  // US: 1 + 10 digits
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // US: bare 10 digits (assume +1 only when explicitly toggled — fallback handled here)
  if (digits.length === 10 && digits.startsWith("1")) return `+1${digits.slice(1)}`;

  return null;
}

/** @deprecated Use normalisePhone instead */
export function normalisePhoneNG(input: string): string | null {
  return normalisePhone(input);
}
