import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sendAdminInviteEmail } from "@/lib/email/admin-invite";

const INVITE_ROLES = ["CFO", "CUSTOMER_CARE", "ANALYTICS", "MARKETING", "SUPER_ADMIN"] as const;

const inviteSchema = z.object({
  name:  z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase(),
  role:  z.enum(INVITE_ROLES),
});

// GET /api/admin/team — list all admin users
export async function GET() {
  try {
    const session = getAdminSession();
    if (session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const team = await prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true,
        activatedAt: true, lastLoginAt: true, createdAt: true,
        inviteToken: true, tokenExpiresAt: true,
      },
    });

    return NextResponse.json(team);
  } catch (err) {
    console.error("[admin/team GET]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/admin/team — invite a new admin
export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession();
    if (session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json   = await req.json();
    const parsed = inviteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { name, email, role } = parsed.data;

    // Check for existing admin with this email
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An admin account with this email already exists." }, { status: 409 });
    }

    const inviteToken    = crypto.randomBytes(32).toString("hex");
    const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const admin = await prisma.adminUser.create({
      data: {
        name,
        email,
        role,
        inviteToken,
        tokenExpiresAt,
        invitedById: session.id === "__super__" ? null : session.id,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vodiumledger.com";
    const inviteUrl = `${appUrl}/admin/invite/${inviteToken}`;

    await sendAdminInviteEmail({ name, email, role, inviteUrl });

    return NextResponse.json({ ok: true, adminId: admin.id }, { status: 201 });
  } catch (err) {
    console.error("[admin/team POST]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/admin/team?id=xxx — deactivate an admin
export async function DELETE(req: NextRequest) {
  try {
    const session = getAdminSession();
    if (session?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/team DELETE]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
