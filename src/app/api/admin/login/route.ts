import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { rateLimit } from "@/lib/redis";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // 5 attempts per IP per 15 minutes
  const { ok } = await rateLimit(`admin:login:${ip}`, 5, 900);
  if (!ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret || parsed.data.password !== secret) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  cookies().set("vodium_admin", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return NextResponse.json({ ok: true });
}
