/**
 * Vodium Ledger — WhatsApp conversation state machine.
 *
 * Pure functions: take (state + incoming message + persisted context)
 * and return (next state + outgoing reply + side-effects to execute).
 *
 * Keep this file business-logic-only. Twilio I/O lives in the route handler.
 */

import { messages } from "./messages";
import type { WhatsAppState } from "@prisma/client";

export type Intent =
  | "START"
  | "ADD"
  | "PAID"
  | "LIST"
  | "SCORE"
  | "HELP"
  | "DASHBOARD"
  | "SUPPORT"
  | "FREE_TEXT";

export interface IncomingMessage {
  body: string;
  fromPhone: string;
}

export interface SessionContext {
  state: WhatsAppState;
  context: Record<string, any>;
  vendorId?: string;
}

export interface StepResult {
  reply: string;
  nextState: WhatsAppState;
  contextPatch?: Record<string, any>;
  sideEffects?: SideEffect[];
}

export type SideEffect =
  | { type: "CREATE_VENDOR"; data: { name: string; businessName: string; universityShortName: string; phone: string } }
  | { type: "CREATE_CREDIT"; data: { vendorId: string; studentName: string; matric?: string; amount: number; dueInDays: number } }
  | { type: "MARK_PAID"; data: { vendorId: string; studentName: string } }
  | { type: "FETCH_LIST"; data: { vendorId: string } }
  | { type: "FETCH_SCORE"; data: { studentQuery: string } };

/** Detect the intent of an incoming message in a state-aware way. */
export function detectIntent(body: string): Intent {
  const cleaned = body.trim().toUpperCase();
  if (cleaned === "START" || cleaned === "BEGIN") return "START";
  if (cleaned === "ADD" || cleaned === "NEW" || cleaned === "CREDIT") return "ADD";
  if (cleaned.startsWith("PAID")) return "PAID";
  if (cleaned === "LIST" || cleaned === "OWE" || cleaned === "OWING") return "LIST";
  if (cleaned.startsWith("SCORE")) return "SCORE";
  if (cleaned === "HELP" || cleaned === "?" || cleaned === "MENU") return "HELP";
  if (cleaned === "DASHBOARD" || cleaned === "WEB") return "DASHBOARD";
  if (cleaned === "SUPPORT") return "SUPPORT";
  return "FREE_TEXT";
}

/** Main step function. Given the session and an incoming message, return the next reply. */
export function step(session: SessionContext, msg: IncomingMessage): StepResult {
  const intent = detectIntent(msg.body);

  // Onboarding flow is sticky — if mid-flow, prioritise it.
  switch (session.state) {
    case "ONBOARDING_NAME":
      return {
        reply: messages.onboardingAskBusiness(msg.body.trim()),
        nextState: "ONBOARDING_BUSINESS",
        contextPatch: { ownerName: msg.body.trim() },
      };

    case "ONBOARDING_BUSINESS":
      return {
        reply: messages.onboardingAskUniversity(),
        nextState: "ONBOARDING_UNIVERSITY",
        contextPatch: { businessName: msg.body.trim() },
      };

    case "ONBOARDING_UNIVERSITY":
      return {
        reply: messages.onboardingDone(session.context.businessName),
        nextState: "IDLE",
        contextPatch: { universityShortName: msg.body.trim().toUpperCase() },
        sideEffects: [
          {
            type: "CREATE_VENDOR",
            data: {
              name: session.context.ownerName,
              businessName: session.context.businessName,
              universityShortName: msg.body.trim().toUpperCase(),
              phone: msg.fromPhone,
            },
          },
        ],
      };

    case "ADDING_CREDIT_STUDENT":
      return {
        reply: messages.addCreditAskAmount(msg.body.trim()),
        nextState: "ADDING_CREDIT_AMOUNT",
        contextPatch: { creditStudentName: msg.body.trim() },
      };

    case "ADDING_CREDIT_AMOUNT": {
      const amount = parseAmount(msg.body);
      if (!amount) {
        return {
          reply: "Please send just the amount as a number, e.g. *2500*.",
          nextState: "ADDING_CREDIT_AMOUNT",
        };
      }
      return {
        reply: messages.addCreditAskDue(session.context.creditStudentName, amount),
        nextState: "ADDING_CREDIT_DUE",
        contextPatch: { creditAmount: amount },
      };
    }

    case "ADDING_CREDIT_DUE": {
      const dueInDays = parseDueDays(msg.body);
      if (!dueInDays) {
        return {
          reply:
            "Please reply with a number of days (e.g. *7*), *END* for end of month, or a date like *15-06-2026*.",
          nextState: "ADDING_CREDIT_DUE",
        };
      }
      const studentName = session.context.creditStudentName;
      const amount = session.context.creditAmount;
      return {
        reply: messages.addCreditConfirmed(studentName, amount, `in ${dueInDays} days`),
        nextState: "IDLE",
        sideEffects: [
          {
            type: "CREATE_CREDIT",
            data: {
              vendorId: session.vendorId!,
              studentName,
              amount,
              dueInDays,
            },
          },
        ],
      };
    }
  }

  // Idle / fresh intent dispatch.
  switch (intent) {
    case "START":
      return {
        reply: messages.onboardingAskName(),
        nextState: "ONBOARDING_NAME",
      };
    case "ADD":
      if (!session.vendorId) {
        return { reply: messages.welcome(), nextState: "IDLE" };
      }
      return {
        reply: messages.addCreditAskStudent(),
        nextState: "ADDING_CREDIT_STUDENT",
      };
    case "HELP":
      return { reply: messages.help(), nextState: "IDLE" };
    case "LIST":
      return {
        reply: "Fetching your outstanding credits…",
        nextState: "IDLE",
        sideEffects: [{ type: "FETCH_LIST", data: { vendorId: session.vendorId! } }],
      };
    case "SCORE":
      return {
        reply: messages.scoreLookupAsk(),
        nextState: "LOOKING_UP_SCORE",
      };
    case "DASHBOARD":
      return {
        reply: `Open your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        nextState: "IDLE",
      };
    default:
      // First-touch: offer the welcome.
      if (session.state === "IDLE" && !session.vendorId) {
        return { reply: messages.welcome(), nextState: "IDLE" };
      }
      return { reply: messages.unknown(), nextState: "IDLE" };
  }
}

// ─── helpers ─────────────────────────────────────────

function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

function parseDueDays(input: string): number | null {
  const cleaned = input.trim().toUpperCase();
  if (cleaned === "END") {
    // days until end of current month
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }
  // "15-06-2026" or "15/06/2026"
  const dateMatch = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const target = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const days = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  }
  // raw number of days
  const n = parseInt(cleaned, 10);
  return isNaN(n) || n <= 0 || n > 365 ? null : n;
}
