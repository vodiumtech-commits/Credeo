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
  | { type: "CREATE_VENDOR";  data: { name: string; businessName: string; communityName: string; phone: string } }
  | { type: "CREATE_CREDIT";  data: { vendorId: string; customerName: string; customerPhone: string; amount: number; dueInMinutes: number } }
  | { type: "MARK_PAID";      data: { vendorId: string; customerName: string } }
  | { type: "FETCH_LIST";     data: { vendorId: string } }
  | { type: "FETCH_SCORE";    data: { customerQuery: string; fromPhone: string } };

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
  const upperBody = body.toUpperCase();

  if (intent === "HELP") {
    return { reply: messages.help(), nextState: "IDLE", contextPatch: clearFlowContext() };
  }

  if (upperBody === "CANCEL" || upperBody === "STOP") {
    return { reply: messages.cancelled(), nextState: "IDLE", contextPatch: clearFlowContext() };
  }

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
        nextState: "ONBOARDING_COMMUNITY",
        contextPatch: { businessName: body },
      };

    case "ONBOARDING_UNIVERSITY":
    case "ONBOARDING_COMMUNITY": {
      const businessName = String(session.context.businessName ?? "your shop");
      // Pass the raw input — parseCommunity() in the route handler normalises it.
      return {
        reply: messages.onboardingDone(businessName),
        nextState: "IDLE",
        contextPatch: { communityName: body },
        sideEffects: [
          {
            type: "CREATE_VENDOR",
            data: {
              name: String(session.context.ownerName ?? "Vendor"),
              businessName,
              communityName: body,
              phone: msg.fromPhone,
            },
          },
        ],
      };
    }

    case "ADDING_CREDIT_STUDENT":
      return {
        reply: messages.addCreditAskPhone(body),
        nextState: "ADDING_CREDIT_PHONE",
        contextPatch: { creditCustomerName: body },
      };

    case "ADDING_CREDIT_PHONE": {
      // Very basic phone validation: at least 7 digits
      const phoneDigits = body.replace(/\D/g, "");
      if (phoneDigits.length < 7) {
        return { reply: messages.invalidPhone(), nextState: "ADDING_CREDIT_PHONE" };
      }
      return {
        reply: messages.addCreditAskAmount(String(session.context.creditCustomerName ?? "Customer")),
        nextState: "ADDING_CREDIT_AMOUNT",
        contextPatch: { creditCustomerPhone: body },
      };
    }

    case "ADDING_CREDIT_AMOUNT": {
      const amount = parseAmount(body);
      if (!amount) {
        return { reply: messages.invalidAmount(), nextState: "ADDING_CREDIT_AMOUNT" };
      }
      return {
        reply: messages.addCreditAskDue(String(session.context.creditCustomerName ?? "Customer"), amount),
        nextState: "ADDING_CREDIT_DUE",
        contextPatch: { creditAmount: amount },
      };
    }

    case "ADDING_CREDIT_DUE": {
      const dueInMinutes = parseDueDuration(body);
      if (!dueInMinutes) {
        return { reply: messages.invalidDueDate(), nextState: "ADDING_CREDIT_DUE" };
      }
      const customerName = String(session.context.creditCustomerName ?? "Customer");
      const customerPhone = String(session.context.creditCustomerPhone ?? "");
      const amount = Number(session.context.creditAmount ?? 0);

      // Friendly text for the reply
      let dueText = "";
      if (dueInMinutes < 60) {
        dueText = `in ${dueInMinutes} minute${dueInMinutes === 1 ? "" : "s"}`;
      } else if (dueInMinutes < 1440) {
        const hours = Math.round(dueInMinutes / 60);
        dueText = `in ${hours} hour${hours === 1 ? "" : "s"}`;
      } else {
        const days = Math.round(dueInMinutes / 1440);
        dueText = `in ${days} day${days === 1 ? "" : "s"}`;
      }

      return {
        reply: messages.addCreditConfirmed(customerName, amount, dueText),
        nextState: "IDLE",
        contextPatch: { creditCustomerName: null, creditCustomerPhone: null, creditAmount: null },
        sideEffects: [
          {
            type: "CREATE_CREDIT",
            data: { vendorId: session.vendorId!, customerName, customerPhone, amount, dueInMinutes },
          },
        ],
      };
    }

    case "MARKING_PAID": {
      // vendor typed customer name after we asked "who paid?"
      return {
        reply: "Checking…",
        nextState: "IDLE",
        sideEffects: [
          { type: "MARK_PAID", data: { vendorId: session.vendorId!, customerName: body } },
        ],
      };
    }

    case "LOOKING_UP_SCORE":
      return {
        reply: "Looking up score…",
        nextState: "IDLE",
        sideEffects: [{ type: "FETCH_SCORE", data: { customerQuery: body, fromPhone: msg.fromPhone } }],
      };
  }

  // ── IDLE / fresh intent dispatch ─────────────────────────────────────────

  switch (intent) {
    case "START":
      if (session.vendorId) {
        const businessName = String(session.context.businessName ?? "your shop");
        return { reply: messages.alreadyRegistered(businessName), nextState: "IDLE" };
      }
      return { reply: messages.onboardingAskName(), nextState: "ONBOARDING_NAME" };

    case "ADD":
      if (!session.vendorId) return { reply: messages.noVendorAccount(), nextState: "IDLE" };
      return { reply: messages.addCreditAskCustomer(), nextState: "ADDING_CREDIT_STUDENT" };

    case "PAID": {
      if (!session.vendorId) return { reply: messages.noVendorAccount(), nextState: "IDLE" };
      const nameAfterPaid = body.replace(/^PAID\s*/i, "").trim();
      if (nameAfterPaid) {
        return {
          reply: "Checking…",
          nextState: "IDLE",
          sideEffects: [
            { type: "MARK_PAID", data: { vendorId: session.vendorId, customerName: nameAfterPaid } },
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
          sideEffects: [{ type: "FETCH_SCORE", data: { customerQuery: queryAfterScore, fromPhone: msg.fromPhone } }],
        };
      }
      return { reply: messages.scoreLookupAsk(), nextState: "LOOKING_UP_SCORE" };
    }


    case "HELP":
      return { reply: messages.help(), nextState: "IDLE" };

    case "DASHBOARD":
      return {
        reply: `Open your dashboard here:\n${process.env.NEXT_PUBLIC_APP_URL ?? "https://vodiumledger.com"}/dashboard`,
        nextState: "IDLE",
      };

    case "SUPPORT":
      return {
        reply: `For support, send an email to *support@vodiumledger.com* or reply here and a human will be in touch within 24 hours.`,
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

export function parseDueDuration(input: string): number | null {
  const cleaned = input.trim().toUpperCase();

  // Handle "END" (end of month)
  if (cleaned === "END") {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const ms = end.getTime() - now.getTime();
    return Math.max(1, Math.ceil(ms / 60_000));
  }

  // Handle "30m", "1h", "2d" etc.
  const unitMatch = cleaned.match(/^(\d+)\s*([MHD])$/);
  if (unitMatch) {
    const val = parseInt(unitMatch[1], 10);
    const unit = unitMatch[2];
    if (unit === "M") return val; // minutes
    if (unit === "H") return val * 60; // hours
    if (unit === "D") return val * 1440; // days
  }

  // Handle "DD-MM-YYYY" dates
  const dateMatch = cleaned.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const target = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const ms = target.getTime() - Date.now();
    return ms > 0 ? Math.ceil(ms / 60_000) : null;
  }

  // Default to days if just a number
  const n = parseInt(cleaned, 10);
  if (!isNaN(n) && n > 0 && n <= 730) {
    return n * 1440;
  }

  return null;
}

function clearFlowContext(): Record<string, null> {
  return {
    ownerName: null,
    businessName: null,
    communityName: null,
    creditCustomerName: null,
    creditCustomerPhone: null,
    creditAmount: null,
  };
}
