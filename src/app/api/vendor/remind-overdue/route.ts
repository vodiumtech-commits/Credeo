import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import { messages } from "@/lib/whatsapp/messages";

// POST /api/vendor/remind-overdue
// Vendor-triggered: sends a WhatsApp reminder to every student with an OVERDUE credit.
export async function POST() {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const overdue = await prisma.credit.findMany({
    where: {
      vendorId: vendor.id,
      status: "OVERDUE",
      student: { NOT: { phone: { startsWith: "pending:" } } },
    },
    include: { student: true },
  });

  if (overdue.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No overdue credits with reachable customers." });
  }

  // Deduplicate by customer — one message per customer even if they have multiple overdue credits
  const byStudent = new Map<string, { student: typeof overdue[number]["student"]; totalOwed: number }>();
  for (const credit of overdue) {
    const existing = byStudent.get(credit.studentId);
    const owed = Number(credit.amount) - Number(credit.amountRepaid);
    if (existing) {
      existing.totalOwed += owed;
    } else {
      byStudent.set(credit.studentId, { student: credit.student, totalOwed: owed });
    }
  }

  let sent = 0;
  let failed = 0;

  for (const { student, totalOwed } of byStudent.values()) {
    const body = messages.reminderToCustomer(
      student.fullName,
      vendor.businessName,
      totalOwed,
      "as soon as possible (overdue)"
    );
    try {
      await sendWhatsAppMessage(student.phone, body);
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: byStudent.size });
}
