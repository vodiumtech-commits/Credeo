import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CAN_EDIT = ["SUPER_ADMIN", "MARKETING"];

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  stipend: z.number().min(0).max(10_000_000).nullable().optional(),
  campus: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

// POST /api/admin/ambassadors/[id] — update a rep. The code is immutable so
// links already in the wild keep resolving.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_EDIT.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const existing = await prisma.ambassador.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Ambassador not found" }, { status: 404 });

    const ambassador = await prisma.ambassador.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true, ambassador });
  } catch (err) {
    console.error("[admin/ambassadors/:id]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
