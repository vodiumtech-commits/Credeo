/**
 * GET /api/cron/reminders
 *
 * Called daily by Vercel Cron (see vercel.json).
 * Finds every credit due within 2 days that hasn't been reminded yet,
 * sends a WhatsApp message to the student, and stamps reminderSentAt.
 *
 * Protected by CRON_SECRET (Vercel injects this automatically).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import { messages } from "@/lib/whatsapp/messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Auth: Vercel passes Authorization: Bearer <CRON_SECRET>
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "production") {
    console.error("[cron/reminders] CRON_SECRET not set — refusing to run in production");
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now     = new Date();
  const in2Days = new Date(now.getTime() + 2 * 86_400_000);

  // Find all outstanding credits due within the next 2 days, not yet reminded.
  const credits = await prisma.credit.findMany({
    where: {
      status:        { in: ["OUTSTANDING", "DUE_SOON"] },
      dueDate:       { gte: now, lte: in2Days },
      reminderSentAt: null,
      student: {
        // Only send to students with a real phone number (not a pending: placeholder)
        NOT: { phone: { startsWith: "pending:" } },
      },
    },
    include: {
      student: true,
      vendor:  true,
    },
  });

  let sent = 0;
  let failed = 0;
  const vendorSentCount: Record<string, number> = {};

  for (const credit of credits) {
    const student  = credit.student;
    const vendor   = credit.vendor;
    const diffMs   = credit.dueDate.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60_000);
    
    let dueTxt = "";
    if (diffMins < 0) {
      dueTxt = "as soon as possible (overdue)";
    } else if (diffMins < 60) {
      dueTxt = `in ${diffMins} minute${diffMins === 1 ? "" : "s"}`;
    } else if (diffMins < 1440) {
      const hours = Math.round(diffMins / 60);
      dueTxt = `in ${hours} hour${hours === 1 ? "" : "s"}`;
    } else {
      const days = Math.round(diffMins / 1440);
      dueTxt = days === 1 ? "tomorrow" : `in ${days} days`;
    }

    const body = messages.reminderToCustomer(
      student.fullName,
      vendor.businessName,
      Number(credit.amount) - Number(credit.amountRepaid),
      dueTxt
    );

    try {
      await sendWhatsAppMessage(student.phone, body);

      // Stamp the credit so we don't remind again.
      await prisma.credit.update({
        where: { id: credit.id },
        data:  { reminderSentAt: now, status: "DUE_SOON" },
      });

      vendorSentCount[credit.vendorId] = (vendorSentCount[credit.vendorId] || 0) + 1;
      sent++;
    } catch (err) {
      console.error(`[cron/reminders] failed for credit ${credit.id}:`, err);
      failed++;
    }
  }

  // Notify vendors about the sent reminders
  for (const [vendorId, count] of Object.entries(vendorSentCount)) {
    await prisma.notification.create({
      data: {
        vendorId,
        title: "Reminders Sent",
        message: `We automatically sent WhatsApp reminders to ${count} customers owing you today.`,
        type: "INFO",
      },
    });
  }

  console.log(`[cron/reminders] sent=${sent} failed=${failed} total=${credits.length}`);
  return NextResponse.json({ ok: true, sent, failed, total: credits.length });
}
