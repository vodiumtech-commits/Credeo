import { NextRequest, NextResponse } from "next/server";
import { getSessionPhone } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getCustomerScorePreview } from "@/lib/customer-verify";

// GET /api/customers/score-preview?phone=...&name=...
// Returns a customer's GENERAL (cross-vendor) reliability so a vendor can be
// warned before issuing credit. Vendor-authenticated; read-only.
export async function GET(req: NextRequest) {
  const sessionPhone = getSessionPhone();
  if (!sessionPhone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({ where: { phone: sessionPhone }, select: { id: true } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const name = searchParams.get("name");
  if (!phone && !name) return NextResponse.json({ preview: null });

  const preview = await getCustomerScorePreview({ phone, name });
  return NextResponse.json({ preview });
}
