import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { DisputeStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/** Who may open the queue at all. */
const CAN_VIEW = ["SUPER_ADMIN", "CUSTOMER_CARE"];
/** Who may actually attend to a dispute. Super admin has oversight, not action. */
const CAN_ACT = ["CUSTOMER_CARE"];

// GET /api/admin/disputes?status=OPEN — the dispute queue.
export async function GET(req: NextRequest) {
  try {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_VIEW.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status") as DisputeStatus | null;

    const disputes = await prisma.dispute.findMany({
      where: status ? { status } : {},
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        student: { select: { id: true, fullName: true, phone: true, vodiumScore: true } },
        vendor: { select: { id: true, businessName: true, ownerName: true, phone: true } },
        credit: { select: { id: true, amount: true, description: true, dueDate: true, status: true, createdAt: true } },
      },
    });

    const counts = await prisma.dispute.groupBy({ by: ["status"], _count: { _all: true } });
    const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

    return NextResponse.json({
      // The UI hides the action buttons for roles that may only look.
      canAct: CAN_ACT.includes(session.role),
      role: session.role,
      stats: {
        open: byStatus.OPEN ?? 0,
        inReview: byStatus.IN_REVIEW ?? 0,
        upheld: byStatus.UPHELD ?? 0,
        rejected: byStatus.REJECTED ?? 0,
      },
      disputes: disputes.map((d) => ({
        id: d.id,
        status: d.status,
        reason: d.reason,
        resolution: d.resolution,
        handledAt: d.handledAt,
        createdAt: d.createdAt,
        student: { ...d.student, amountOwed: Number(d.credit.amount) },
        vendor: d.vendor,
        credit: { ...d.credit, amount: Number(d.credit.amount) },
      })),
    });
  } catch (err) {
    console.error("[admin/disputes]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
