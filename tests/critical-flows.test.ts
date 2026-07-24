/**
 * Invariant tests for the money paths.
 *
 * These are deliberately NOT happy-path tests. Every regression that reached
 * real vendors so far passed the happy-path suite: each individual step worked,
 * but a *property of the flow as a whole* had broken — a credit could be
 * abandoned before it was ever written, or a confirmation screen quietly
 * stopped showing the number it was there to confirm.
 *
 * So each test here asserts a property that must hold for EVERY path, not a
 * single scripted journey. If one fails, a vendor is losing work or money.
 */

import test from "node:test";
import assert from "node:assert/strict";

process.env.SESSION_SECRET = "test-session-secret";
process.env.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");

import {
  step,
  isReminderDue,
  reminderLeadMinutesForDue,
  type SessionContext,
  type StepResult,
} from "../src/lib/whatsapp/state-machine";

const VENDOR = "vendor_1";
const FROM = "+2348030000000";

function send(state: string, context: Record<string, unknown>, body: string): StepResult {
  return step({ state, context, vendorId: VENDOR } as SessionContext, { body, fromPhone: FROM });
}

/** Drive a whole conversation, threading state + context exactly as the webhook does. */
function converse(inputs: string[]): { last: StepResult; effects: string[] } {
  let state = "IDLE";
  let context: Record<string, unknown> = {};
  let last!: StepResult;
  const effects: string[] = [];

  for (const body of inputs) {
    last = send(state, context, body);
    state = last.nextState;
    context = { ...context, ...(last.contextPatch ?? {}) };
    for (const e of last.sideEffects ?? []) effects.push(e.type);
  }
  return { last, effects };
}

// ── Invariant 1: a credit must never be silently lost ────────────────────────

test("INVARIANT every ADD path ends by actually creating the credit", () => {
  // The regression this catches: the flow used to end on a question, and a
  // vendor who never answered left NO credit written at all — so no record and
  // no reminders, while the vendor believed the debt was logged.
  const journeys: Array<{ name: string; inputs: string[] }> = [
    { name: "guided, remind",       inputs: ["ADD", "Chidi Okeke", "08012345678", "2500", "7", "REMIND"] },
    { name: "guided, no remind",    inputs: ["ADD", "Chidi Okeke", "08012345678", "2500", "7", "NOREMIND"] },
    { name: "guided, typed yes",    inputs: ["ADD", "Chidi Okeke", "08012345678", "2500", "7", "yes"] },
    { name: "one-shot, remind",     inputs: ["ADD Chidi Okeke 08012345678 2500 7d", "REMIND"] },
    { name: "one-shot, no due",     inputs: ["ADD Ada 08031234567 1500", "REMIND"] },
    { name: "one-shot, no remind",  inputs: ["ADD Ada 08031234567 1500", "NOREMIND"] },
  ];

  for (const j of journeys) {
    const { effects } = converse(j.inputs);
    assert.ok(
      effects.includes("CREATE_CREDIT"),
      `"${j.name}" finished without writing the credit — the vendor's work would be lost`,
    );
  }
});

test("INVARIANT the debtor's number is confirmed before the credit is written", () => {
  // Catches: the one-shot form skipping confirmation, so a mistyped digit
  // logged the debt against a stranger who then received the reminders.
  const paths: Array<{ name: string; inputs: string[]; phone: string }> = [
    { name: "guided",   inputs: ["ADD", "Chidi Okeke", "08012345678", "2500", "7"], phone: "08012345678" },
    { name: "one-shot", inputs: ["ADD Chidi Okeke 08012345678 2500 7d"],            phone: "08012345678" },
  ];

  for (const p of paths) {
    const { last } = converse(p.inputs);
    assert.ok(
      last.reply.includes(p.phone),
      `"${p.name}" reached the save step without showing the number back to the vendor`,
    );
  }
});

// ── Invariant 2: no dead ends ────────────────────────────────────────────────

test("INVARIANT every multi-step flow can always be cancelled", () => {
  // A vendor stuck in a flow with no way out will abandon the product.
  const midFlow: Array<[string, Record<string, unknown>]> = [
    ["ADDING_CREDIT_STUDENT",  {}],
    ["ADDING_CREDIT_PHONE",    { creditCustomerName: "Ada" }],
    ["ADDING_CREDIT_AMOUNT",   { creditCustomerName: "Ada" }],
    ["ADDING_CREDIT_DUE",      { creditCustomerName: "Ada", creditAmount: 100 }],
    ["ADDING_CREDIT_REMINDER", { creditCustomerName: "Ada", creditAmount: 100, creditDueMinutes: 60 }],
    ["VERIFYING_CUSTOMER",     { pvPhone: "+2348012345678", pvHmac: "h", pvExpiresAt: Date.now() + 60_000 }],
    ["MARKING_PAID",           {}],
    ["LOOKING_UP_SCORE",       {}],
    ["IDLE",                   { invStep: "items", invItems: [] }],
    ["IDLE",                   { bankStep: "number", bankName: "GTBank" }],
  ];

  for (const [state, context] of midFlow) {
    const r = send(state, context, "CANCEL");
    assert.equal(r.nextState, "IDLE", `${state} could not be cancelled`);
    assert.ok(r.buttons?.length, `${state} left the vendor with no next action after cancelling`);
  }
});

test("INVARIANT HELP always works, even mid-flow, without corrupting state", () => {
  for (const state of ["ADDING_CREDIT_AMOUNT", "ADDING_CREDIT_REMINDER", "VERIFYING_CUSTOMER", "MARKING_PAID"]) {
    const r = send(state, { creditCustomerName: "Ada" }, "HELP");
    assert.equal(r.nextState, "IDLE");
    assert.ok(r.list || r.buttons?.length, `HELP from ${state} offered no way forward`);
  }
});

test("INVARIANT unparseable input never silently drops a vendor out of a flow", () => {
  // Junk at a step must re-ask, not abandon the half-built credit.
  const cases: Array<[string, Record<string, unknown>]> = [
    ["ADDING_CREDIT_AMOUNT",   { creditCustomerName: "Ada" }],
    ["ADDING_CREDIT_DUE",      { creditCustomerName: "Ada", creditAmount: 100 }],
    ["ADDING_CREDIT_REMINDER", { creditCustomerName: "Ada", creditAmount: 100, creditDueMinutes: 60, creditCustomerPhone: "0801" }],
  ];
  for (const [state, context] of cases) {
    const r = send(state, context, "!!! nonsense !!!");
    assert.equal(r.nextState, state, `${state} dropped the vendor out of the flow on bad input`);
    assert.equal(r.sideEffects, undefined, `${state} wrote data from unparseable input`);
  }
});

// ── Invariant 3: reminders actually fire ─────────────────────────────────────

test("INVARIANT a credit inside its window is always reminder-due", () => {
  // This is the "reminders stopped working" class of complaint, made testable.
  const now = new Date("2026-07-01T12:00:00Z");
  const mins = (n: number) => new Date(now.getTime() + n * 60_000);

  // A 7-day credit gets a 2-day lead: due in 1 day → send; due in 5 days → wait.
  const weekLong = { dateExtended: mins(-7 * 1440), dueDate: mins(1440) };
  assert.equal(isReminderDue(weekLong, now), true, "a credit due tomorrow must be reminded");

  const weekLongEarly = { dateExtended: now, dueDate: mins(7 * 1440) };
  assert.equal(isReminderDue(weekLongEarly, now), false, "a week away is too early");

  // A 2-hour credit gets a 30-minute lead — short debts must not be forgotten.
  const twoHour = { dateExtended: mins(-90), dueDate: mins(30) };
  assert.equal(isReminderDue(twoHour, now), true, "short credits must still be reminded");

  // Anything already overdue is unambiguously due.
  const overdue = { dateExtended: mins(-2880), dueDate: mins(-60) };
  assert.equal(isReminderDue(overdue, now), true, "an overdue credit must always be reminded");

  // The lead time must always be positive, or nothing would ever send.
  for (const window of [1, 30, 120, 1440, 10080, 43200]) {
    assert.ok(reminderLeadMinutesForDue(window) > 0, `lead time collapsed to 0 for a ${window}-minute credit`);
  }
});
