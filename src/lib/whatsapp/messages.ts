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

export type InvoiceItemEntry = {
  name: string;
  quantity: number;
  unitPrice: number;
};

function invoiceItemLines(items: InvoiceItemEntry[]): string {
  return items
    .map((i, idx) => `${idx + 1}. *${i.name}* ×${i.quantity} : ${formatNaira(i.quantity * i.unitPrice)}`)
    .join("\n");
}

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

  addCreditAskReminders: (customerName: string) =>
    `Last thing — should I send *${customerName}* polite reminders about this credit?\n\n` +
    `• *Yes* : I'll remind them respectfully before it's due\n` +
    `• *No* : I stay silent and you follow up yourself`,

  noReminderPromise: () =>
    `I won't message them about this one — you'll follow up yourself. It still counts in *LIST* and their Vodium score.`,

  addCreditConfirmed: (
    customerName: string,
    amount: number,
    dueDateText: string,
    reminderText: string,
  ) =>
    `✅ Saved.\n\n` +
    `*${customerName}* owes you *${formatNaira(amount)}*, due ${dueDateText}.\n\n` +
    `${reminderText}\n\n` +
    `Reply *ADD* for another, or *LIST* to see everyone who owes you.`,

  invalidAmount: () =>
    `That doesn't look like a valid amount. Please send just the number.\n\nExample: *2500*`,

  invalidDueDate: () =>
    `Please reply with a number of days (e.g. *7*), *END* for end of month, or a date like *15-06-2026*.`,

  invalidPhone: () =>
    `That doesn't look like a valid phone number. Please send a valid Nigerian number.\n\nExample: *08012345678*`,

  noVendorAccount: () =>
    `You don't have a shop set up yet. Reply *START* to get started.`,

  // ── INVOICE flow ───────────────────────────────────────────────────────
  invoiceAskCustomer: () =>
    `Let's create an invoice. 🧾 Who is it for? Send the customer's full name.\n\n` +
    `Example: *Chidi Okeke*`,

  invoiceAskPhone: (customerName: string) =>
    `What is *${customerName}'s* WhatsApp number?\n\n` +
    `The invoice will be sent to them there.\n\n` +
    `Example: *08012345678*`,

  invoiceAskItems: (customerName: string) =>
    `Now add the items for *${customerName}*, one per message:\n\n` +
    `• *Rice, 2, 1500* : item, quantity, unit price\n` +
    `• *Delivery, 500* : item, price (quantity 1)\n\n` +
    `Send *DONE* when you've added everything.`,

  invoiceItemAdded: (items: InvoiceItemEntry[]) => {
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return (
      `✓ Added.\n\n` +
      `${invoiceItemLines(items)}\n` +
      `*Total so far: ${formatNaira(total)}*\n\n` +
      `Add another item, or send *DONE* to continue.`
    );
  },

  invoiceInvalidItem: () =>
    `I couldn't read that item. Send it like:\n\n` +
    `*Rice, 2, 1500* : item, quantity, unit price\n\n` +
    `Or send *DONE* if you've finished.`,

  invoiceNeedItem: () =>
    `Add at least one item first.\n\nExample: *Rice, 2, 1500*`,

  invoiceAskDue: (customerName: string) =>
    `When should *${customerName}* pay? Reply with:\n` +
    `• *7* : in 7 days\n` +
    `• *END* : end of month\n` +
    `• *15-06-2026* : a specific date`,

  invoiceConfirm: (customerName: string, items: InvoiceItemEntry[], total: number, dueText: string) =>
    `🧾 *Invoice for ${customerName}*\n\n` +
    `${invoiceItemLines(items)}\n\n` +
    `*Total: ${formatNaira(total)}*\n` +
    `Due ${dueText}.\n\n` +
    `Send *SEND* to create it and deliver it to *${customerName}* on WhatsApp, or *CANCEL* to discard.`,

  invoiceConfirmHint: () =>
    `Reply *SEND* to send the invoice, or *CANCEL* to discard it.`,

  invoiceSent: (customerName: string, invoiceNumber: string, total: number) =>
    `✅ Invoice *${invoiceNumber}* for *${formatNaira(total)}* is on its way to *${customerName}* on WhatsApp.\n\n` +
    `If it's not paid by the due date, I'll send them a polite reminder. You can track it under *Invoices* on your dashboard.`,

  invoiceSendFailed: (invoiceNumber: string, link: string) =>
    `⚠️ I created invoice *${invoiceNumber}* but couldn't deliver it on WhatsApp.\n\n` +
    `Share this link with the customer instead:\n${link}`,

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

  // ── Customer payment claims (vendor must confirm before anything changes) ──
  claimNoCredit: () =>
    `You have no outstanding credit recorded on Vodium. 🎉\n\n` +
    `If you think this is a mistake, please contact your vendor directly.`,

  claimAckToCustomer: (vendorNames: string[]) => {
    const who =
      vendorNames.length === 1
        ? `*${vendorNames[0]}*`
        : vendorNames.map((v) => `*${v}*`).join(", ");
    return (
      `Thanks for letting me know! 🙏\n\n` +
      `I've told ${who} that you've paid. They'll confirm once they receive it — ` +
      `your Vodium score improves the moment they do.`
    );
  },

  claimToVendor: (customerName: string, amount: number) =>
    `💰 *${customerName}* says they've paid you *${formatNaira(amount)}*.\n\n` +
    `Tap *Confirm received* once you have the money — their credit is marked paid ` +
    `and their score updates only after you confirm.`,

  claimConfirmedToCustomer: (vendorBusinessName: string, amount: number) =>
    `✅ *${vendorBusinessName}* confirmed your payment of *${formatNaira(amount)}*.\n\n` +
    `Your Vodium score just improved. Thank you for paying on time! 🎉`,

  claimDisputedToCustomer: (vendorBusinessName: string, amount: number) =>
    `*${vendorBusinessName}* hasn't received your payment of *${formatNaira(amount)}* yet.\n\n` +
    `If you've already paid, please reach out to them directly so they can confirm.`,

  claimDisputeNoted: (customerName: string) =>
    `Noted. I've let *${customerName}* know you haven't received it. The credit stays open.`,

  confirmNotFound: () =>
    `That credit is already settled or no longer open. Reply *LIST* to see what's outstanding.`,

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
    `• *INVOICE* : create & send an invoice\n` +
    `• *PAID [name]* : mark a credit paid\n` +
    `• *LIST* : see who owes you\n` +
    `• *SCORE [name]* : check a customer's reliability\n` +
    `• *DASHBOARD* : get a link to your full dashboard\n` +
    `• *SUPPORT* : talk to a human`,


  unknown: () =>
    `Sorry, I didn't catch that. Reply *HELP* to see what I can do.`,

  cancelled: () =>
    `No problem. I've cancelled that flow.\n\nReply *ADD* to record a credit, or *HELP* to see all commands.`,
};
