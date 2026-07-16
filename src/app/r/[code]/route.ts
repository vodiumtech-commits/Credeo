import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REFERRAL_COOKIE, REFERRAL_COOKIE_AGE } from "@/lib/referral";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /r/<code> — a campus ambassador's referral link.
 *
 * Counts the visit, drops the attribution cookie, and sends the vendor to the
 * sign-up form. An unknown code just forwards to /register with no cookie, so a
 * mistyped link never dead-ends a real vendor.
 */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code.trim().toUpperCase();
  const target = new URL("/register", req.nextUrl.origin);

  const ambassador = await prisma.ambassador
    .findUnique({ where: { code }, select: { id: true, status: true } })
    .catch(() => null);

  if (!ambassador || ambassador.status !== "ACTIVE") {
    return NextResponse.redirect(target);
  }

  // Count the click. Never let a stats write break the vendor's journey.
  await prisma.ambassador
    .update({ where: { id: ambassador.id }, data: { clicks: { increment: 1 } } })
    .catch((err) => console.error("[referral] click count failed:", err));

  const res = NextResponse.redirect(target);
  res.cookies.set(REFERRAL_COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFERRAL_COOKIE_AGE,
    path: "/",
  });
  return res;
}
