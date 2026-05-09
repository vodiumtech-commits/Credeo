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

/** Lightweight Nigerian phone normaliser → E.164 (+234...) */
export function normalisePhoneNG(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  if (digits.length === 13 && digits.startsWith("234")) return `+${digits}`;
  if (digits.length === 14 && digits.startsWith("234")) return `+${digits.slice(0, 13)}`;
  return null;
}
