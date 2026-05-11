/**
 * Vodium Ledger — WhatsApp message templates.
 * Keep copy short, Nigerian-English, respectful, no slang that excludes older vendors.
 */

import { formatNaira } from "@/lib/utils";

export type CreditEntry = {
  studentName: string;
  amount: number;
  daysUntilDue: number; // negative = overdue
};

export const messages = {
  // ── Welcome & onboarding ───────────────────────────────────────────────
  welcome: () =>
    `👋 Welcome to *Vodium Ledger*.\n\n` +
    `I help campus vendors track who owes them money and recover it faster.\n\n` +
    `Reply:\n` +
    `• *START* — set up your shop\n` +
    `• *HELP* — see all commands`,

  alreadyRegistered: (businessName: string) =>
    `Welcome back! 👋 *${businessName}* is already set up.\n\n` +
    `Reply *HELP* to see what I can do.`,

  onboardingAskName: () =>
    `Let's get your shop set up. What's your full name?`,

  onboardingAskBusiness: (name: string) =>
    `Nice to meet you, *${name}*. What's the name of your shop or business?`,

  onboardingAskUniversity: () =>
    `Which campus is your shop on?\n\n` +
    `Reply with the short code — e.g. *UNILAG*, *OAU*, *UI*, *COVENANT*, *FUTA*, *LASU*, *UNIBEN*, *ABU*, *UNN*, *UNILORIN*.`,

  onboardingDone: (businessName: string) =>
    `✅ *${businessName}* is set up on Vodium Ledger!\n\n` +
    `You have a 60-day free trial. Let's record your first credit.\n\n` +
    `Reply *ADD* to add a credit, or *HELP* for all commands.`,

  // ── ADD credit flow ────────────────────────────────────────────────────
  addCreditAskStudent: () =>
    `Who took the credit? Send their full name (and matric number if you know it).\n\n` +
    `Example: *Chidi Okeke 18/0234*`,

  addCreditAskAmount: (studentName: string) =>
    `How much does *${studentName}* owe? Send just the number.\n\n` +
    `Example: *2500*`,

  addCreditAskDue: (studentName: string, amount: number) =>
    `${formatNaira(amount)} for *${studentName}*. ✓\n\n` +
    `When should they pay back? Reply with:\n` +
    `• *7* — in 7 days\n` +
    `• *END* — end of month\n` +
    `• *15-06-2026* — a specific date`,

  addCreditConfirmed: (studentName: string, amount: number, dueDateText: string) =>
    `✅ Saved.\n\n` +
    `*${studentName}* owes you *${formatNaira(amount)}*, due ${dueDateText}.\n\n` +
    `I'll send them a polite reminder 2 days before the due date.\n\n` +
    `Reply *ADD* for another, or *LIST* to see everyone who owes you.`,

  invalidAmount: () =>
    `That doesn't look like a valid amount. Please send just the number.\n\nExample: *2500*`,

  invalidDueDate: () =>
    `Please reply with a number of days (e.g. *7*), *END* for end of month, or a date like *15-06-2026*.`,

  noVendorAccount: () =>
    `You don't have a shop set up yet. Reply *START* to get started.`,

  // ── LIST ───────────────────────────────────────────────────────────────
  listEmpty: () =>
    `🎉 No outstanding credits — you're all settled up!`,

  listFull: (credits: CreditEntry[]) => {
    const total = credits.reduce((s, c) => s + c.amount, 0);
    const header =
      `📋 *${credits.length} outstanding credit${credits.length === 1 ? "" : "s"}* — ` +
      `${formatNaira(total)} total owed to you:\n\n`;

    const rows = credits
      .map((c, i) => {
        let due: string;
        let flag = "";
        if (c.daysUntilDue < 0) {
          due = `overdue by ${Math.abs(c.daysUntilDue)} day${Math.abs(c.daysUntilDue) === 1 ? "" : "s"}`;
          flag = " 🔴";
        } else if (c.daysUntilDue === 0) {
          due = "due TODAY";
          flag = " ⚠️";
        } else if (c.daysUntilDue <= 3) {
          due = `due in ${c.daysUntilDue} day${c.daysUntilDue === 1 ? "" : "s"}`;
          flag = " ⚠️";
        } else {
          due = `due in ${c.daysUntilDue} days`;
        }
        return `${i + 1}. *${c.studentName}* — ${formatNaira(c.amount)} (${due}${flag})`;
      })
      .join("\n");

    const footer =
      `\n\nReply *PAID [name]* to mark as paid.\n` +
      `Reply *SCORE [name]* to check their reliability.`;

    return header + rows + footer;
  },

  // ── PAID flow ──────────────────────────────────────────────────────────
  paidAsk: () =>
    `Who paid? Send their full name.\n\nExample: *Chidi Okeke*`,

  paidConfirmed: (studentName: string, amount: number) =>
    `✅ Marked *${studentName}'s* ${formatNaira(amount)} as *paid*.\n\n` +
    `Their Vodium score has improved. Reply *LIST* to see remaining credits.`,

  paidNotFound: (studentName: string) =>
    `❌ No outstanding credit found for *${studentName}*.\n\n` +
    `Check the spelling and try again, or reply *LIST* to see all credits.`,

  // ── SCORE lookup ───────────────────────────────────────────────────────
  scoreLookupAsk: () =>
    `Which student? Send their full name or matric number.`,

  scoreReply: (studentName: string, score: number, summary: string) => {
    const band =
      score >= 750 ? "🟢 Excellent"
      : score >= 650 ? "🟡 Good"
      : score >= 500 ? "🟡 Building"
      : score >= 350 ? "🟠 Risky"
      : "🔴 High risk";

    return (
      `📊 *${studentName}* — Vodium Score: *${score}/1000*\n` +
      `${band}\n\n` +
      `${summary}\n\n` +
      `_Scores above 650 indicate good repayment history across campus vendors._`
    );
  },

  scoreNotFound: (query: string) =>
    `❌ No student found matching *"${query}"*.\n\n` +
    `Check the spelling or try their matric number.`,

  scoreNoHistory: (studentName: string) =>
    `📊 *${studentName}* — Vodium Score: *500/1000*\n` +
    `🔵 New — no credit history yet.\n\n` +
    `This student has no recorded credits on Vodium.`,

  // ── Proactive reminders (sent to students) ─────────────────────────────
  reminderToStudent: (
    studentName: string,
    vendorBusinessName: string,
    amount: number,
    dueDateText: string
  ) =>
    `Hi *${studentName}* 👋\n\n` +
    `Friendly reminder from *${vendorBusinessName}*: you have *${formatNaira(amount)}* due ${dueDateText}.\n\n` +
    `Paying on time builds your Vodium credit score — it'll help you access better products in future.\n\n` +
    `Reply *PAID* once you've settled.`,

  // ── HELP & misc ────────────────────────────────────────────────────────
  help: () =>
    `*Vodium Ledger commands:*\n\n` +
    `• *ADD* — record a new credit\n` +
    `• *PAID [name]* — mark a credit paid\n` +
    `• *LIST* — see who owes you\n` +
    `• *SCORE [name]* — check a student's reliability\n` +
    `• *DASHBOARD* — get a link to your full dashboard\n` +
    `• *SUPPORT* — talk to a human`,

  unknown: () =>
    `Sorry, I didn't catch that. Reply *HELP* to see what I can do.`,
};
