import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/me — returns current admin identity (role, name, email)
export async function GET() {
  try {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.id === "__super__") {
      return NextResponse.json({
        id:   "__super__",
        name: "Super Admin",
        email: null,
        role: "SUPER_ADMIN",
      });
    }

    const admin = await prisma.adminUser.findUnique({
      where:  { id: session.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    return NextResponse.json(admin);
  } catch (err) {
    console.error("[admin/me]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
