/**
 * Vodium Ledger — WhatsApp message templates.
 * Keep copy short, Nigerian-English, respectful, no slang that excludes older vendors.
 */

import { formatNaira } from "../utils";

export type CreditEntry = {
  customerName: string;
  amount: number;
  daysUntilDue: number; // negative = overdue
};

export const messages = {
  // ── Welcome & onboarding ───────────────────────────────────────────────
  welcome: () =>
    `👋 Welcome to *Vodium Ledger*.\n\n` +
    `I help vendors track who owes them money and recover it faster.\n\n` +
    `Reply:\n` +
    `• *START* : set up your shop\n` +
    `• *HELP* : see all commands`,

  alreadyRegistered: (businessName: string) =>
    `Welcome back! 👋 *${businessName}* is already set up.\n\n` +
    `Reply *HELP* to see what I can do.`,

  onboardingAskName: () => `Let's get your shop set up. What's your full name?`,

  onboardingAskBusiness: (name: string) =>
    `Nice to meet you, *${name}*. What's the name of your shop or business?`,

  onboardingAskUniversity: () =>
    `Which city or community is your shop in?\n\n` +
    `Reply with the short code if it's a known hub (e.g. *UNILAG*, *OAU*) or the community name (e.g. *Lagos*, *Ibadan*).`,

  onboardingDone: (businessName: string) =>
    `✅ *${businessName}* is set up on Vodium Ledger!\n\n` +
    `You have a 60-day free trial. Let's record your first credit.\n\n` +
    `Reply *ADD* to add a credit, or *HELP* for all commands.`,

  // ── ADD credit flow ────────────────────────────────────────────────────
  addCreditAskCustomer: () =>
    `Who took the credit? Send their full name.\n\n` +
    `Example: *Chidi Okeke*`,

  addCreditAskPhone: (customerName: string) =>
    `What is *${customerName}'s* WhatsApp number?\n\n` +
    `We need this to send them a polite reminder. Send the number in any format.\n\n` +
    `Example: *08012345678*`,

  addCreditAskAmount: (customerName: string) =>
    `How much does *${customerName}* owe? Send just the number.\n\n` +
    `Example: *2500*`,

  addCreditAskDue: (customerName: string, amount: number) =>
    `${formatNaira(amount)} for *${customerName}*. ✓\n\n` +
    `When should they pay back? Reply with:\n` +
    `• *30M* : in 30 minutes\n` +
    `• *2H* : in 2 hours\n` +
    `• *7* : in 7 days\n` +
    `• *END* : end of month\n` +
    `• *15-06-2026* : a specific date`,

  addCreditConfirmed: (
    customerName: string,
    amount: number,
    dueDateText: string,
  ) =>
    `✅ Saved.\n\n` +
    `*${customerName}* owes you *${formatNaira(amount)}*, due ${dueDateText}.\n\n` +
    `I'll send them a polite reminder 2 days before the due date.\n\n` +
    `Reply *ADD* for another, or *LIST* to see everyone who owes you.`,

  invalidAmount: () =>
    `That doesn't look like a valid amount. Please send just the number.\n\nExample: *2500*`,

  invalidDueDate: () =>
    `Please reply with a number of days (e.g. *7*), *END* for end of month, or a date like *15-06-2026*.`,

  invalidPhone: () =>
    `That doesn't look like a valid phone number. Please send a valid Nigerian number.\n\nExample: *08012345678*`,

  noVendorAccount: () =>
    `You don't have a shop set up yet. Reply *START* to get started.`,

  // ── LIST ───────────────────────────────────────────────────────────────
  listEmpty: () => `🎉 No outstanding credits, you're all settled up!`,

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
        return `${i + 1}. *${c.customerName}* : ${formatNaira(c.amount)} (${due}${flag})`;
      })
      .join("\n");

    const footer =
      `\n\nReply *PAID [name]* to mark as paid.\n` +
      `Reply *SCORE [name]* to check their reliability.`;

    return header + rows + footer;
  },

  // ── PAID flow ──────────────────────────────────────────────────────────
  paidAsk: () => `Who paid? Send their full name.\n\nExample: *Chidi Okeke*`,

  paidConfirmed: (customerName: string, amount: number) =>
    `✅ Marked *${customerName}'s* ${formatNaira(amount)} as *paid*.\n\n` +
    `Their Vodium score has improved. Reply *LIST* to see remaining credits.`,

  paidNotFound: (customerName: string) =>
    `❌ No outstanding credit found for *${customerName}*.\n\n` +
    `Check the spelling and try again, or reply *LIST* to see all credits.`,

  // ── SCORE lookup ───────────────────────────────────────────────────────
  scoreLookupAsk: () => `Which customer? Send their full name or phone number.`,

  scoreReply: (customerName: string, score: number, summary: string) => {
    const band =
      score >= 750
        ? "🟢 Excellent"
        : score >= 650
          ? "🟡 Good"
          : score >= 500
            ? "🟡 Building"
            : score >= 350
              ? "🟠 Risky"
              : "🔴 High risk";

    return (
      `📊 *${customerName}* : Vodium Score: *${score}/1000*\n` +
      `${band}\n\n` +
      `${summary}\n\n` +
      `_Scores above 650 indicate good repayment history across vendors._`
    );
  },

  scoreNotFound: (query: string) =>
    `❌ No customer found matching *"${query}"*.\n\n` +
    `Check the spelling or try their phone number.`,

  scoreNoHistory: (customerName: string) =>
    `📊 *${customerName}* : Vodium Score: *500/1000*\n` +
    `🔵 New : no credit history yet.\n\n` +
    `This customer has no recorded credits on Vodium.`,

  // ── Proactive reminders (sent to customers) ─────────────────────────────
  reminderToCustomer: (
    customerName: string,
    vendorBusinessName: string,
    amount: number,
    dueDateText: string,
  ) =>
    `Hi *${customerName}* 👋\n\n` +
    `Friendly reminder from *${vendorBusinessName}*: you have *${formatNaira(amount)}* due ${dueDateText}.\n\n` +
    `Paying on time builds your Vodium credit score, it'll help you access better products in future.\n\n` +
    `Reply *PAID* once you've settled.`,

  // ── HELP & misc ────────────────────────────────────────────────────────
  help: () =>
    `*Vodium Ledger commands:*\n\n` +
    `• *ADD* : record a new credit\n` +
    `• *PAID [name]* : mark a credit paid\n` +
    `• *LIST* : see who owes you\n` +
    `• *SCORE [name]* : check a customer's reliability\n` +
    `• *DASHBOARD* : get a link to your full dashboard\n` +
    `• *SUPPORT* : talk to a human`,


  unknown: () =>
    `Sorry, I didn't catch that. Reply *HELP* to see what I can do.`,
};
