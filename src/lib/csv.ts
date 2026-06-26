/**
 * Vodium Ledger — minimal CSV helpers for report exports.
 *
 * Values are RFC-4180 quoted: wrap in double quotes and double any inner quotes.
 * Numbers and dates should be pre-formatted by the caller.
 */

import { NextResponse } from "next/server";

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(header: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(","));
  }
  return lines.join("\n");
}

/** Build a downloadable CSV response with the given filename. */
export function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/** Slugify an organization/vendor name for use in an export filename. */
export function exportFilename(name: string, kind: string): string {
  const slug = name.replace(/[^a-z0-9]/gi, "-").toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "vodium"}-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
}
