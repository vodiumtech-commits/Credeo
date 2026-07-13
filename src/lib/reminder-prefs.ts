/**
 * Vodium Ledger — merchant reminder preferences.
 *
 * Merchants decide whether we message their customers at all. Reminders are
 * opt-OUT (on by default), and a merchant can independently disable:
 *   - pre-due reminders  ("your payment is due soon")
 *   - overdue reminders  ("your payment is late")
 *
 * Returns a resolver with a per-run cache so a cron pass makes one query per
 * organization instead of one per credit.
 */

import { prisma } from "@/lib/prisma";

export type ReminderKind = "preDue" | "overdue";

export function createReminderPrefResolver() {
  const cache = new Map<string, { preDue: boolean; overdue: boolean }>();

  return async function remindersAllowed(
    organizationId: string | null | undefined,
    kind: ReminderKind
  ): Promise<boolean> {
    // Legacy vendors with no organization keep the default (reminders on).
    if (!organizationId) return true;

    let prefs = cache.get(organizationId);
    if (!prefs) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { preDueRemindersEnabled: true, overdueRemindersEnabled: true },
      });
      prefs = {
        preDue: org?.preDueRemindersEnabled ?? true,
        overdue: org?.overdueRemindersEnabled ?? true,
      };
      cache.set(organizationId, prefs);
    }

    return kind === "preDue" ? prefs.preDue : prefs.overdue;
  };
}
