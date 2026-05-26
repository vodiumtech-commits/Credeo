/**
 * POST /api/user/nps-dismiss
 *
 * Records an NPS response (or a plain dismissal) by setting a httpOnly cookie
 * with the current timestamp.  The client never writes to localStorage.
 *
 * Body (JSON): { score?: number; comment?: string }
 *
 * Response: { ok: true }
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const NPS_COOKIE       = "vodium_nps_dismissed";
const COOLDOWN_DAYS    = 30;
const COOLDOWN_SECONDS = COOLDOWN_DAYS * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  let body: { score?: unknown; comment?: unknown } = {};
  try { body = await req.json(); } catch { /* dismiss-only, no body required */ }

  // Optional: log the score+comment for PostHog or similar analytics later.
  if (typeof body.score === "number" && body.score >= 0 && body.score <= 10) {
    console.info("[NPS]", {
      score:   body.score,
      comment: typeof body.comment === "string" ? body.comment.slice(0, 300) : undefined,
    });
  }

  // Set a httpOnly cookie so the client can't tamper with the dismiss state.
  const jar = await cookies();
  jar.set(NPS_COOKIE, String(Date.now()), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   COOLDOWN_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
