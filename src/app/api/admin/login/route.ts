import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/redis";
import { setAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { AdminRole } from "@/lib/session";

const schema = z.object({
  password: z.string().min(1).max(256),
  email:    z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok } = await rateLimit(`admin:login:${ip}`, 5, 900, true);
  if (!ok) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  try {
    const json   = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // ── Staff admin login (email provided) ──────────────────────────────────
    if (email) {
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      const dummy = "$2a$12$invalidhashpadding00000000000000000000000000000000000";
      const match = await bcrypt.compare(password, admin?.passwordHash ?? dummy);

      if (!admin || !match || !admin.activatedAt) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data:  { lastLoginAt: new Date() },
      });

      setAdminSession(admin.id, admin.role as AdminRole);
      return NextResponse.json({ ok: true, role: admin.role });
    }

    // ── Super admin password login (no email) ────────────────────────────────
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      console.error("[admin/login] ADMIN_SECRET not set");
      return NextResponse.json({ error: "Admin login not configured" }, { status: 503 });
    }
    // Refuse trivially weak secrets in production to prevent accidental deployment.
    const WEAK_DEFAULTS = ["vodiumledger", "admin", "password", "secret", "changeme", "test"];
    if (process.env.NODE_ENV === "production" && WEAK_DEFAULTS.includes(secret.toLowerCase())) {
      console.error("[admin/login] ADMIN_SECRET is set to a default/weak value — refusing login in production");
      return NextResponse.json({ error: "Admin login is not properly configured for production." }, { status: 503 });
    }

    const incoming = Buffer.from(password, "utf8");
    const expected = Buffer.from(secret, "utf8");
    const maxLen   = Math.max(incoming.length, expected.length);
    const a = Buffer.alloc(maxLen, 0); incoming.copy(a);
    const b = Buffer.alloc(maxLen, 0); expected.copy(b);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const match = require("crypto").timingSafeEqual(a, b) && incoming.length === expected.length;

    if (!match) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    setAdminSession("__super__", "SUPER_ADMIN");
    return NextResponse.json({ ok: true, role: "SUPER_ADMIN" });
  } catch (err) {
    console.error("[admin/login]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
