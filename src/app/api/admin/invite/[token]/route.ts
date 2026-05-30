import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setAdminSession } from "@/lib/session";
import type { AdminRole } from "@/lib/session";

// GET /api/admin/invite/[token] — verify token is valid
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const admin = await prisma.adminUser.findUnique({
      where:  { inviteToken: params.token },
      select: { name: true, email: true, role: true, tokenExpiresAt: true, activatedAt: true },
    });

    if (!admin) return NextResponse.json({ error: "Invalid invitation link." }, { status: 404 });
    if (admin.activatedAt) return NextResponse.json({ error: "This invitation has already been used." }, { status: 410 });
    if (admin.tokenExpiresAt && new Date() > admin.tokenExpiresAt) {
      return NextResponse.json({ error: "This invitation has expired. Ask Super Admin to resend." }, { status: 410 });
    }

    return NextResponse.json({ name: admin.name, email: admin.email, role: admin.role });
  } catch (err) {
    console.error("[admin/invite GET]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

const activateSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

// POST /api/admin/invite/[token] — activate account (set password) and log in
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const admin = await prisma.adminUser.findUnique({
      where:  { inviteToken: params.token },
    });

    if (!admin)          return NextResponse.json({ error: "Invalid invitation link." }, { status: 404 });
    if (admin.activatedAt) return NextResponse.json({ error: "Already activated." }, { status: 410 });
    if (admin.tokenExpiresAt && new Date() > admin.tokenExpiresAt) {
      return NextResponse.json({ error: "Invitation expired." }, { status: 410 });
    }

    const json   = await req.json();
    const parsed = activateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash,
        activatedAt:   new Date(),
        lastLoginAt:   new Date(),
        inviteToken:   null,
        tokenExpiresAt: null,
      },
    });

    setAdminSession(admin.id, admin.role as AdminRole);
    return NextResponse.json({ ok: true, role: admin.role });
  } catch (err) {
    console.error("[admin/invite POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
