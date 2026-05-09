/**
 * Vodium Ledger — WhatsApp message templates.
 * Keep copy short, Nigerian-English, respectful, no slang that excludes older vendors.
 */

import { formatNaira } from "@/lib/utils";

export const messages = {
  welcome: () =>
    `👋 Welcome to Vodium Ledger.\n\n` +
    `I help you track who owes you money and recover it faster.\n\n` +
    `Reply with:\n` +
    `• *START* — set up your shop\n` +
    `• *ADD* — record a new credit\n` +
    `• *PAID* — mark a credit as paid\n` +
    `• *LIST* — see who owes you\n` +
    `• *SCORE* — check a student's reliability`,

  onboardingAskName: () =>
    `Great. What's your full name?`,

  onboardingAskBusiness: (name: string) =>
    `Thanks ${name}. What's the name of your shop or business?`,

  onboardingAskUniversity: () =>
    `Which campus is your shop on? (e.g. UNILAG, OAU, UI, Covenant)`,

  onboardingDone: (businessName: string) =>
    `✅ ${businessName} is set up.\n\n` +
    `Try recording your first credit. Reply *ADD*.`,

  addCreditAskStudent: () =>
    `Who took the credit? Reply with their full name (and matric number if you know it).\n\n` +
    `Example: *John Okafor 18/0123*`,

  addCreditAskAmount: (studentName: string) =>
    `How much does ${studentName} owe? Just send the number.\n\n` +
    `Example: *2500*`,

  addCreditAskDue: (studentName: string, amount: number) =>
    `${formatNaira(amount)} for ${studentName}.\n\n` +
    `When should they pay back?\n` +
    `Reply with:\n` +
    `• *7* (in 7 days)\n` +
    `• *END* (end of month)\n` +
    `• A date like *15-06-2026*`,

  addCreditConfirmed: (
    studentName: string,
    amount: number,
    dueDateText: string
  ) =>
    `✅ Saved.\n\n` +
    `${studentName} owes you ${formatNaira(amount)}, due ${dueDateText}.\n\n` +
    `I'll send a polite reminder 2 days before the due date.\n\n` +
    `Reply *ADD* for another credit, or *LIST* to see everyone who owes.`,

  reminderToStudent: (
    studentName: string,
    vendorBusinessName: string,
    amount: number,
    dueDateText: string
  ) =>
    `Hi ${studentName} 👋\n\n` +
    `Friendly reminder from ${vendorBusinessName}: you have ${formatNaira(
      amount
    )} due ${dueDateText}.\n\n` +
    `Paying on time builds your Vodium credit score — it'll help you access better products in future.\n\n` +
    `Reply *PAID* once you've settled.`,

  paidConfirmed: (studentName: string, amount: number) =>
    `✅ Marked ${studentName}'s ${formatNaira(amount)} as paid.\n\n` +
    `Their Vodium score has gone up. Reply *LIST* to see your remaining credits.`,

  listEmpty: () =>
    `🎉 No outstanding credits. You're all settled.`,

  listHeader: (count: number, total: number) =>
    `You have ${count} outstanding credit${count === 1 ? "" : "s"}.\n` +
    `Total owed to you: ${formatNaira(total)}\n\n`,

  scoreLookupAsk: () =>
    `Which student? Reply with their full name or matric number.`,

  scoreReply: (
    studentName: string,
    score: number,
    summary: string
  ) =>
    `📊 ${studentName} — Vodium score: *${score}/1000*\n\n` +
    `${summary}\n\n` +
    `_A score above 650 means this student has a good repayment history across campus vendors._`,

  unknown: () =>
    `Sorry, I didn't catch that. Reply *HELP* to see what I can do.`,

  help: () =>
    `Vodium Ledger commands:\n\n` +
    `• *ADD* — record a new credit\n` +
    `• *PAID [name]* — mark a credit paid\n` +
    `• *LIST* — see who owes you\n` +
    `• *SCORE [name]* — check a student's reliability\n` +
    `• *DASHBOARD* — get a link to your full dashboard\n` +
    `• *SUPPORT* — talk to a human`,
};
