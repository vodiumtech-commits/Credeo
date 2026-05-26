/**
 * GET /api/user/nps-status
 *
 * Returns whether the NPS widget should be shown.
 * The dismissed-at timestamp is stored in a httpOnly cookie (not localStorage)
 * so it can't be wiped by client scripts and avoids the third-party-cookie
 * concern of localStorage-in-an-iframe.
 *
 * Response: { show: boolean }
 *   show = false  →  dismissed within the last 30 days (or submitted NPS score)
 *   show = true   →  never dismissed, or dismissed > 30 days ago
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const NPS_COOKIE   = "vodium_nps_dismissed";
const COOLDOWN_MS  = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET() {
  const jar   = await cookies();
  const value = jar.get(NPS_COOKIE)?.value;

  if (value) {
    const ts       = Number(value);
    const elapsed  = Date.now() - ts;
    if (!isNaN(ts) && elapsed < COOLDOWN_MS) {
      return NextResponse.json({ show: false });
    }
  }

  return NextResponse.json({ show: true });
}
