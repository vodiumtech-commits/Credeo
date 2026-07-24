/**
 * GET /api/cron/daily — once-a-day housekeeping.
 *
 * Split out from /api/cron/reminders when that moved to a 5-minute schedule:
 * the reminder pipeline is time-critical (a 30-minute credit needs its nudge
 * within a 10-minute window), while score decay is explicitly per-day and must
 * not be attempted 288 times a day.
 *
 * Protected by CRON_SECRET, exactly like the other cron routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { applyDailyDefaultDecay } from "@/lib/credit-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") {
    console.error("[cron/daily] CRON_SECRET not set — refusing to run in production");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const defaultDecay = await applyDailyDefaultDecay({ now });

  console.log(`[cron/daily] decayed=${defaultDecay.decayed} eligible=${defaultDecay.eligible}`);
  return NextResponse.json({ ok: true, defaultDecay, at: now.toISOString() });
}
