import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/support/vendors — vendor list with overdue counts for customer care
export async function GET() {
  try {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["SUPER_ADMIN", "CUSTOMER_CARE"].includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now     = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        community:    { select: { name: true, shortName: true } },
        subscription: { select: { status: true, plan: true } },
        _count:       { select: { credits: true } },
      },
    });

    // For each vendor, get overdue credit count + total outstanding
    const vendorIds = vendors.map((v) => v.id);
    const overdueAgg = await prisma.credit.groupBy({
      by:    ["vendorId"],
      where: { vendorId: { in: vendorIds }, status: "OVERDUE" },
      _count: { _all: true },
      _sum:   { amount: true, amountRepaid: true },
    });
    const overdueMap = new Map(overdueAgg.map((a) => [a.vendorId, a]));

    const enriched = vendors.map((v) => {
      const ov = overdueMap.get(v.id);
      return {
        id:           v.id,
        businessName: v.businessName,
        ownerName:    v.ownerName,
        phone:        v.phone,
        email:        v.email,
        status:       v.status,
        vendorType:   v.vendorType,
        createdAt:    v.createdAt,
        community:    v.community,
        subscription: v.subscription,
        _count:       v._count,
        overdueCount: ov?._count._all ?? 0,
        totalOwed:    ov ? Number(ov._sum.amount ?? 0) - Number(ov._sum.amountRepaid ?? 0) : 0,
      };
    });

    const stats = {
      total:       vendors.length,
      suspended:   vendors.filter((v) => v.status === "SUSPENDED").length,
      withOverdue: overdueAgg.filter((a) => a._count._all > 0).length,
      newThisWeek: vendors.filter((v) => new Date(v.createdAt) >= weekAgo).length,
    };

    return NextResponse.json({ vendors: enriched, stats });
  } catch (err) {
    console.error("[admin/support/vendors]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
