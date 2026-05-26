import { NextResponse } from "next/server";
import { clearVendorSession, clearAdminSession } from "@/lib/session";

export async function POST() {
  clearVendorSession();
  clearAdminSession();
  return NextResponse.json({ ok: true });
}
