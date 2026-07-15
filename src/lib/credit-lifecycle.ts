import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import { getOrgChannelCredentials, type ChannelCredentials } from "@/lib/whatsapp/channel-token";
import { createReminderPrefResolver } from "@/lib/reminder-prefs";
import { messages } from "@/lib/whatsapp/messages";

const DEFAULT_SCORE_DELTA = -80;
const OVERDUE_REMINDER_INTERVAL_MS = 3 * 86_400_000;

// Ongoing penalty: a customer who stays in default loses points every day until
// they pay. Floored so default decay alone can't zero out a score.
const DAILY_DEFAULT_DECAY = 5;
const MIN_DEFAULT_SCORE = 300;

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

/**
 * Daily score decay for customers still in default.
 *
 * Every customer with an unpaid OVERDUE credit loses `DAILY_DEFAULT_DECAY`
 * points once per day (floored at `MIN_DEFAULT_SCORE`) until they pay it down.
 * Idempotent per day: a customer who already has a DEFAULTED score event today
 * (either the initial default hit or an earlier decay run) is skipped, so the
 * cron can run multiple times a day without stacking penalties.
 */
export async function applyDailyDefaultDecay(scope: LifecycleScope = {}) {
  const now = scope.now ?? new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const overdue = await prisma.credit.findMany({
    where: {
      status: "OVERDUE",
      ...(scope.vendorId ? { vendorId: scope.vendorId } : {}),
    },
    select: { studentId: true, vendorId: true, amount: true, amountRepaid: true },
  });

  // One representative vendor per still-owing customer (for event attribution).
  const owingStudents = new Map<string, string>();
  for (const credit of overdue) {
    if (Number(credit.amount) - Number(credit.amountRepaid) <= 0) continue;
    if (!owingStudents.has(credit.studentId)) owingStudents.set(credit.studentId, credit.vendorId);
  }

  const studentIds = [...owingStudents.keys()];
  if (studentIds.length === 0) return { decayed: 0, eligible: 0 };

  const decayedToday = await prisma.creditScoreEvent.findMany({
    where: { studentId: { in: studentIds }, eventType: "DEFAULTED", occurredAt: { gte: startOfDay } },
    select: { studentId: true },
  });
  const skip = new Set(decayedToday.map((e) => e.studentId));

  const targets = await prisma.student.findMany({
    where: { id: { in: studentIds.filter((id) => !skip.has(id)) } },
    select: { id: true, vodiumScore: true },
  });

  let decayed = 0;
  for (const student of targets) {
    if (student.vodiumScore <= MIN_DEFAULT_SCORE) continue;
    const newScore = Math.max(MIN_DEFAULT_SCORE, student.vodiumScore - DAILY_DEFAULT_DECAY);
    const delta = newScore - student.vodiumScore;
    if (delta === 0) continue;

    await prisma.$transaction([
      prisma.creditScoreEvent.create({
        data: {
          studentId: student.id,
          vendorId: owingStudents.get(student.id)!,
          eventType: "DEFAULTED",
          scoreDelta: delta,
          occurredAt: now,
        },
      }),
      prisma.student.update({
        where: { id: student.id },
        data: { vodiumScore: newScore, scoreUpdatedAt: now },
      }),
    ]);
    decayed++;
  }

  return { decayed, eligible: studentIds.length };
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
      remindersEnabled: true, // vendor opted out of messaging this customer otherwise
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

  // Resolve outbound credentials once per organization (cached for this run).
  const credsCache = new Map<string, ChannelCredentials | null>();
  async function credsFor(organizationId: string | null): Promise<ChannelCredentials | null> {
    const key = organizationId ?? "__global__";
    if (!credsCache.has(key)) credsCache.set(key, await getOrgChannelCredentials(organizationId));
    return credsCache.get(key) ?? null;
  }

  // Merchants can turn AUTOMATED customer reminders off — respect that. A manual
  // "remind now" (scope.force) is an explicit merchant action and still sends.
  const remindersAllowed = createReminderPrefResolver();
  let skipped = 0;

  for (const item of grouped.values()) {
    if (!scope.force && !(await remindersAllowed(item.vendor.organizationId, "overdue"))) {
      skipped++;
      continue;
    }

    const daysOverdue = Math.max(
      1,
      Math.ceil((now.getTime() - item.oldestDueDate.getTime()) / 86_400_000)
    );
    const dueText = `overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`;

    try {
      const creds = await credsFor(item.vendor.organizationId);
      await sendWhatsAppMessage(
        item.student.phone,
        messages.reminderToCustomer(
          item.student.fullName,
          item.vendor.businessName,
          item.totalOwed,
          dueText
        ),
        creds ?? undefined
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

  return { sent, failed, skipped, total: grouped.size, vendorSentCount };
}
