import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";
import { markOverdueCredits, sendOverdueReminders } from "@/lib/credit-lifecycle";

// POST /api/vendor/remind-overdue
// Vendor-triggered: sends a WhatsApp reminder to every student with an OVERDUE credit.
export async function POST() {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  await markOverdueCredits({ vendorId: vendor.id });
  const result = await sendOverdueReminders({ vendorId: vendor.id, force: true });

  if (result.total === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No overdue credits with reachable customers." });
  }

  return NextResponse.json({ ok: true, sent: result.sent, failed: result.failed, total: result.total });
}
