import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyDailyDefaultDecay, markOverdueCredits } from "@/lib/credit-lifecycle";
import { markOverdueInvoices, sendOverdueInvoiceReminders } from "@/lib/invoice-lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // 0. Credit lifecycle: mark new defaults and apply the daily default-score
  // decay. Guaranteed to run daily via this Vercel cron; idempotent if the
  // reminders cron already ran it today.
  const overdue = await markOverdueCredits({ now });
  const defaultDecay = await applyDailyDefaultDecay({ now });
  const overdueInvoices = await markOverdueInvoices({ now });
  const invoiceReminders = await sendOverdueInvoiceReminders({ now });

  // 1. Expire trials that have passed their end date
  const expiredTrials = await prisma.vendorSubscription.updateMany({
    where: {
      status: "TRIAL",
      trialEndsAt: { lt: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  // 2. Mark active subscriptions as PAST_DUE if currentPeriodEnd is passed
  // Note: Usually Paystack webhooks handle this, but this is a safety net
  // for when webhooks are missed or delayed.
  const overdueSubs = await prisma.vendorSubscription.updateMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: { lt: now },
    },
    data: {
      status: "PAST_DUE",
    },
  });

  // 3. Create notifications for expired trials
  const expiredSubs = await prisma.vendorSubscription.findMany({
    where: {
      status: "EXPIRED",
      updatedAt: { gte: new Date(now.getTime() - 24 * 3600 * 1000) }, // Only if expired in last 24h
    },
    select: { vendorId: true },
  });

  for (const sub of expiredSubs) {
    // Check if notification already exists for today to avoid spam
    const existing = await prisma.notification.findFirst({
      where: {
        vendorId: sub.vendorId,
        title: "Subscription Expired",
        createdAt: { gte: new Date(now.getTime() - 24 * 3600 * 1000) },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          vendorId: sub.vendorId,
          title: "Subscription Expired",
          message: "Your free trial has ended. Upgrade your plan to continue adding credits and managing students.",
          type: "WARNING",
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    expiredTrials: expiredTrials.count,
    overdueSubs: overdueSubs.count,
    notificationsSent: expiredSubs.length,
    overdue,
    defaultDecay,
    invoices: { marked: overdueInvoices.marked, reminders: invoiceReminders },
  });
}
