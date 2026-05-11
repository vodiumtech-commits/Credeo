/**
 * Vodium Ledger — WhatsApp conversation state machine.
 *
 * Pure functions only. No I/O, no DB calls, no Twilio.
 * The route handler owns all side-effect execution.
 */

import { messages } from "./messages";
import type { WhatsAppState } from "@prisma/client";

// ─── public types ─────────────────────────────────────────────────────────────

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
  context: Record<string, unknown>;
  vendorId?: string;
}

export interface StepResult {
  reply: string;
  nextState: WhatsAppState;
  contextPatch?: Record<string, unknown>;
  sideEffects?: SideEffect[];
}

export type SideEffect =
  | { type: "CREATE_VENDOR";  data: { name: string; businessName: string; universityShortName: string; phone: string } }
  | { type: "CREATE_CREDIT";  data: { vendorId: string; studentName: string; matric?: string; amount: number; dueInDays: number } }
  | { type: "MARK_PAID";      data: { vendorId: string; studentName: string } }
  | { type: "FETCH_LIST";     data: { vendorId: string } }
  | { type: "FETCH_SCORE";    data: { studentQuery: string } };

// ─── intent detection ─────────────────────────────────────────────────────────

export function detectIntent(body: string): Intent {
  const t = body.trim().toUpperCase();
  if (t === "START" || t === "BEGIN" || t === "HI" || t === "HELLO") return "START";
  if (t === "ADD" || t === "NEW" || t === "CREDIT")                   return "ADD";
  if (t.startsWith("PAID"))                                            return "PAID";
  if (t === "LIST" || t === "OWE" || t === "OWING" || t === "WHO")   return "LIST";
  if (t.startsWith("SCORE"))                                           return "SCORE";
  if (t === "HELP" || t === "?" || t === "MENU" || t === "COMMANDS")  return "HELP";
  if (t === "DASHBOARD" || t === "WEB" || t === "PORTAL")             return "DASHBOARD";
  if (t === "SUPPORT" || t === "AGENT" || t === "HUMAN")              return "SUPPORT";
  return "FREE_TEXT";
}

// ─── main step function ───────────────────────────────────────────────────────

export function step(session: SessionContext, msg: IncomingMessage): StepResult {
  const body = msg.body.trim();
  const intent = detectIntent(body);

  // ── mid-flow states (sticky — always take priority over intent) ──────────

  switch (session.state) {
    case "ONBOARDING_NAME":
      return {
        reply: messages.onboardingAskBusiness(body),
        nextState: "ONBOARDING_BUSINESS",
        contextPatch: { ownerName: body },
      };

    case "ONBOARDING_BUSINESS":
      return {
        reply: messages.onboardingAskUniversity(),
        nextState: "ONBOARDING_UNIVERSITY",
        contextPatch: { businessName: body },
      };

    case "ONBOARDING_UNIVERSITY": {
      const businessName = String(session.context.businessName ?? "your shop");
      return {
        reply: messages.onboardingDone(businessName),
        nextState: "IDLE",
        contextPatch: { universityShortName: body.toUpperCase() },
        sideEffects: [
          {
            type: "CREATE_VENDOR",
            data: {
              name: String(session.context.ownerName ?? "Vendor"),
              businessName,
              universityShortName: body.toUpperCase(),
              phone: msg.fromPhone,
            },
          },
        ],
      };
    }

    case "ADDING_CREDIT_STUDENT":
      return {
        reply: messages.addCreditAskAmount(body),
        nextState: "ADDING_CREDIT_AMOUNT",
        contextPatch: { creditStudentName: body },
      };

    case "ADDING_CREDIT_AMOUNT": {
      const amount = parseAmount(body);
      if (!amount) {
        return { reply: messages.invalidAmount(), nextState: "ADDING_CREDIT_AMOUNT" };
      }
      return {
        reply: messages.addCreditAskDue(String(session.context.creditStudentName ?? "Student"), amount),
        nextState: "ADDING_CREDIT_DUE",
        contextPatch: { creditAmount: amount },
      };
    }

    case "ADDING_CREDIT_DUE": {
      const dueInDays = parseDueDays(body);
      if (!dueInDays) {
        return { reply: messages.invalidDueDate(), nextState: "ADDING_CREDIT_DUE" };
      }
      const studentName = String(session.context.creditStudentName ?? "Student");
      const amount = Number(session.context.creditAmount ?? 0);
      return {
        reply: messages.addCreditConfirmed(studentName, amount, `in ${dueInDays} day${dueInDays === 1 ? "" : "s"}`),
        nextState: "IDLE",
        contextPatch: { creditStudentName: null, creditAmount: null },
        sideEffects: [
          {
            type: "CREATE_CREDIT",
            data: { vendorId: session.vendorId!, studentName, amount, dueInDays },
          },
        ],
      };
    }

    case "MARKING_PAID": {
      // vendor typed student name after we asked "who paid?"
      return {
        reply: "Checking…",
        nextState: "IDLE",
        sideEffects: [
          { type: "MARK_PAID", data: { vendorId: session.vendorId!, studentName: body } },
        ],
      };
    }

    case "LOOKING_UP_SCORE":
      return {
        reply: "Looking up score…",
        nextState: "IDLE",
        sideEffects: [{ type: "FETCH_SCORE", data: { studentQuery: body } }],
      };
  }

  // ── IDLE / fresh intent dispatch ─────────────────────────────────────────

  switch (intent) {
    case "START":
      if (session.vendorId) {
        // already registered — handled by route (passes businessName in context)
        return { reply: messages.welcome(), nextState: "IDLE" };
      }
      return { reply: messages.onboardingAskName(), nextState: "ONBOARDING_NAME" };

    case "ADD":
      if (!session.vendorId) return { reply: messages.noVendorAccount(), nextState: "IDLE" };
      return { reply: messages.addCreditAskStudent(), nextState: "ADDING_CREDIT_STUDENT" };

    case "PAID": {
      if (!session.vendorId) return { reply: messages.noVendorAccount(), nextState: "IDLE" };
      const nameAfterPaid = body.replace(/^PAID\s*/i, "").trim();
      if (nameAfterPaid) {
        return {
          reply: "Checking…",
          nextState: "IDLE",
          sideEffects: [
            { type: "MARK_PAID", data: { vendorId: session.vendorId, studentName: nameAfterPaid } },
          ],
        };
      }
      return { reply: messages.paidAsk(), nextState: "MARKING_PAID" };
    }

    case "LIST":
      if (!session.vendorId) return { reply: messages.noVendorAccount(), nextState: "IDLE" };
      return {
        reply: "Fetching…",
        nextState: "IDLE",
        sideEffects: [{ type: "FETCH_LIST", data: { vendorId: session.vendorId } }],
      };

    case "SCORE": {
      const queryAfterScore = body.replace(/^SCORE\s*/i, "").trim();
      if (queryAfterScore) {
        return {
          reply: "Looking up score…",
          nextState: "IDLE",
          sideEffects: [{ type: "FETCH_SCORE", data: { studentQuery: queryAfterScore } }],
        };
      }
      return { reply: messages.scoreLookupAsk(), nextState: "LOOKING_UP_SCORE" };
    }

    case "HELP":
      return { reply: messages.help(), nextState: "IDLE" };

    case "DASHBOARD":
      return {
        reply: `Open your dashboard here:\n${process.env.NEXT_PUBLIC_APP_URL ?? "https://credeo.vercel.app"}/dashboard`,
        nextState: "IDLE",
      };

    case "SUPPORT":
      return {
        reply: `For support, send an email to *support@credeo.app* or reply here and a human will be in touch within 24 hours.`,
        nextState: "IDLE",
      };

    default:
      // First touch from an unknown number
      if (session.state === "IDLE" && !session.vendorId) {
        return { reply: messages.welcome(), nextState: "IDLE" };
      }
      return { reply: messages.unknown(), nextState: "IDLE" };
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
}

export function parseDueDays(input: string): number | null {
  const cleaned = input.trim().toUpperCase();
  if (cleaned === "END") {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
  }
  const dateMatch = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const target = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const days = Math.ceil((target.getTime() - Date.now()) / 86_400_000);
    return days > 0 ? days : null;
  }
  const n = parseInt(cleaned, 10);
  return isNaN(n) || n <= 0 || n > 730 ? null : n;
}
