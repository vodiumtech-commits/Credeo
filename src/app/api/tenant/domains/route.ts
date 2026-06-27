import { NextResponse } from "next/server";

// Custom domains are disabled by design — every store uses its own
// `‹slug›.vodiumledger.com` subdomain, which the wildcard routes automatically.
// These handlers are kept (returning empty / disabled) so any stale client call
// degrades gracefully instead of 404-ing.

export async function GET() {
  return NextResponse.json({ domains: [] });
}

export async function POST() {
  return NextResponse.json(
    { error: "Custom domains are not available. Use your vodiumledger.com store address." },
    { status: 403 }
  );
}
