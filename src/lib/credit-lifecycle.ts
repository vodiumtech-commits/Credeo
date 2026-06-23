import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import { messages } from "@/lib/whatsapp/messages";

const DEFAULT_SCORE_DELTA = -80;
const OVERDUE_REMINDER_INTERVAL_MS = 3 * 86_400_000;

type LifecycleScope = {
  vendorId?: string;
  now?: Date;
};

export async function markOverdueCredits(scope: LifecycleScope = {}) {
  const now = scope.now ?? new Date();
  const credits = await prisma.credit.findMany({
    where: {
      ...(scope.vendorId ? { vendorId: scope.vendorId } : {}),
      status: { in: ["OUTSTANDING", "DUE_SOON", "PARTIALLY_PAID"] },
      dueDate: { lt: now },
    },
    include: {
      student: true,
    },
  });

  let marked = 0;
  let penalized = 0;

  for (const credit of credits) {
    const amountOwed = Number(credit.amount) - Number(credit.amountRepaid);
    if (amountOwed <= 0) continue;

    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.credit.updateMany({
        where: {
          id: credit.id,
          status: { in: ["OUTSTANDING", "DUE_SOON", "PARTIALLY_PAID"] },
          dueDate: { lt: now },
        },
        data: { status: "OVERDUE" },
      });
      if (updateResult.count === 0) return;

      marked++;

      const defaultEvent = await tx.creditScoreEvent.findFirst({
        where: { creditId: credit.id, eventType: "DEFAULTED" },
        select: { id: true },
      });

      if (!defaultEvent) {
        await tx.creditScoreEvent.create({
          data: {
            studentId: credit.studentId,
            vendorId: credit.vendorId,
            creditId: credit.id,
            eventType: "DEFAULTED",
            amount: amountOwed,
            scoreDelta: DEFAULT_SCORE_DELTA,
            occurredAt: now,
          },
        });

        await tx.student.update({
          where: { id: credit.studentId },
          data: {
            vodiumScore: Math.max(0, (credit.student.vodiumScore ?? 500) + DEFAULT_SCORE_DELTA),
            scoreUpdatedAt: now,
          },
        });
        penalized++;
      }
    });
  }

  return { marked, penalized };
}

export async function sendOverdueReminders(scope: LifecycleScope & { force?: boolean } = {}) {
  const now = scope.now ?? new Date();
  const cutoff = new Date(now.getTime() - OVERDUE_REMINDER_INTERVAL_MS);

  const overdue = await prisma.credit.findMany({
    where: {
      ...(scope.vendorId ? { vendorId: scope.vendorId } : {}),
      status: "OVERDUE",
      dueDate: { lt: now },
      ...(scope.force
        ? {}
        : { OR: [{ overdueReminderSentAt: null }, { overdueReminderSentAt: { lte: cutoff } }] }),
      student: { NOT: { phone: { startsWith: "pending:" } } },
    },
    include: { student: true, vendor: true },
    orderBy: { dueDate: "asc" },
  });

  let sent = 0;
  let failed = 0;
  const vendorSentCount: Record<string, number> = {};
  const grouped = new Map<string, {
    creditIds: string[];
    student: typeof overdue[number]["student"];
    vendor: typeof overdue[number]["vendor"];
    totalOwed: number;
    oldestDueDate: Date;
  }>();

  for (const credit of overdue) {
    const amountOwed = Number(credit.amount) - Number(credit.amountRepaid);
    if (amountOwed <= 0) continue;

    const key = `${credit.vendorId}:${credit.studentId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.creditIds.push(credit.id);
      existing.totalOwed += amountOwed;
      if (credit.dueDate < existing.oldestDueDate) existing.oldestDueDate = credit.dueDate;
    } else {
      grouped.set(key, {
        creditIds: [credit.id],
        student: credit.student,
        vendor: credit.vendor,
        totalOwed: amountOwed,
        oldestDueDate: credit.dueDate,
      });
    }
  }

  for (const item of grouped.values()) {
    const daysOverdue = Math.max(
      1,
      Math.ceil((now.getTime() - item.oldestDueDate.getTime()) / 86_400_000)
    );
    const dueText = `overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`;

    try {
      await sendWhatsAppMessage(
        item.student.phone,
        messages.reminderToCustomer(
          item.student.fullName,
          item.vendor.businessName,
          item.totalOwed,
          dueText
        )
      );

      await prisma.credit.updateMany({
        where: { id: { in: item.creditIds } },
        data: { overdueReminderSentAt: now },
      });

      vendorSentCount[item.vendor.id] = (vendorSentCount[item.vendor.id] ?? 0) + 1;
      sent++;
    } catch (err) {
      console.error(`[overdue-reminders] failed for customer ${item.student.id}:`, err);
      failed++;
    }
  }

  return { sent, failed, total: grouped.size, vendorSentCount };
}
