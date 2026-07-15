/**
 * GET /api/cron/reminders
 *
 * Called frequently by Vercel Cron (see vercel.json).
 * Finds every credit within its reminder window that hasn't been reminded yet,
 * sends a WhatsApp message to the student, and stamps reminderSentAt.
 *
 * Protected by CRON_SECRET (Vercel injects this automatically).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppButtons } from "@/lib/whatsapp/outbound";
import { messages } from "@/lib/whatsapp/messages";
import { reminderLeadMinutesForDue } from "@/lib/whatsapp/state-machine";
import { applyDailyDefaultDecay, markOverdueCredits, sendOverdueReminders } from "@/lib/credit-lifecycle";
import { createReminderPrefResolver } from "@/lib/reminder-prefs";
import { markOverdueInvoices, sendOverdueInvoiceReminders } from "@/lib/invoice-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REMINDER_LOOKAHEAD_MINUTES = 7 * 1440;

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

  const now = new Date();
  const maxLookahead = new Date(now.getTime() + MAX_REMINDER_LOOKAHEAD_MINUTES * 60_000);
  const overdueLifecycle = await markOverdueCredits({ now });
  const defaultDecay = await applyDailyDefaultDecay({ now });
  const overdueReminders = await sendOverdueReminders({ now });

  // Invoices follow the same stream: mark overdue, then remind.
  const overdueInvoices = await markOverdueInvoices({ now });
  const invoiceReminders = await sendOverdueInvoiceReminders({ now });

  // Find possible reminder candidates. Each credit is filtered below using
  // its own adaptive reminder lead time, so hour-based debts are not told
  // about "2 days before" reminders.
  const credits = await prisma.credit.findMany({
    where: {
      status:        { in: ["OUTSTANDING", "DUE_SOON"] },
      dueDate:       { gte: now, lte: maxLookahead },
      reminderSentAt: null,
      remindersEnabled: true, // vendor opted out of messaging this customer otherwise
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

  // Merchants can turn off customer reminders — respect that (cached per org).
  const remindersAllowed = createReminderPrefResolver();
  let skipped = 0;

  for (const credit of credits) {
    const student  = credit.student;
    const vendor   = credit.vendor;

    if (!(await remindersAllowed(vendor.organizationId, "preDue"))) {
      skipped++;
      continue;
    }

    const diffMs   = credit.dueDate.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60_000);
    const originalDueMins = Math.max(
      1,
      Math.ceil((credit.dueDate.getTime() - credit.dateExtended.getTime()) / 60_000)
    );
    const leadMins = reminderLeadMinutesForDue(originalDueMins);

    if (diffMins > leadMins) {
      continue;
    }
    
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
      // "I've paid" raises a claim the vendor must confirm — it never marks the
      // credit paid on its own.
      await sendWhatsAppButtons(student.phone, body, [{ id: "PAID", title: "I've paid ✓" }]);

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
  const combinedVendorSentCount = { ...overdueReminders.vendorSentCount };
  for (const [vendorId, count] of Object.entries(vendorSentCount)) {
    combinedVendorSentCount[vendorId] = (combinedVendorSentCount[vendorId] ?? 0) + count;
  }

  for (const [vendorId, count] of Object.entries(combinedVendorSentCount)) {
    await prisma.notification.create({
      data: {
        vendorId,
        title: "Reminders Sent",
        message: `We automatically sent WhatsApp reminders to ${count} customers owing you today.`,
        type: "INFO",
      },
    });
  }

  const totalSent = sent + overdueReminders.sent;
  const totalFailed = failed + overdueReminders.failed;
  console.log(
    `[cron/reminders] sent=${totalSent} failed=${totalFailed} total=${credits.length + overdueReminders.total}`
  );
  return NextResponse.json({
    ok: true,
    sent: totalSent,
    failed: totalFailed,
    total: credits.length + overdueReminders.total,
    skipped: { preDue: skipped, overdue: overdueReminders.skipped, invoices: invoiceReminders.skipped },
    overdue: overdueLifecycle,
    invoices: { marked: overdueInvoices.marked, reminders: invoiceReminders },
    defaultDecay,
    overdueReminders: {
      sent: overdueReminders.sent,
      failed: overdueReminders.failed,
      total: overdueReminders.total,
    },
  });
}
