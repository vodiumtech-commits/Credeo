/**
 * Vodium Ledger — Meta Cloud API WhatsApp webhook
 *
 * GET  /api/whatsapp  — webhook verification (Meta hub challenge)
 * POST /api/whatsapp  — incoming message events
 *
 * Required env vars:
 *   WHATSAPP_VERIFY_TOKEN  — the string you set in Meta's Webhook configuration
 *   WHATSAPP_APP_SECRET    — your Meta App Secret (for HMAC signature check)
 *   WHATSAPP_ACCESS_TOKEN  — permanent access token (used by outbound.ts)
 *   WHATSAPP_PHONE_NUMBER_ID — phone number ID from Meta dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../lib/prisma";
import { computeScore } from "../../../lib/credit-score/score";
import { nextVendorCustomerId } from "../../../lib/customer-id";
import { formatNaira, normalisePhone } from "../../../lib/utils";
import { getOrCreateCustomerForVendor, roundMoney } from "../../../lib/bnpl";
import { signInvoiceToken } from "../../../lib/bnpl-token";
import { messages } from "../../../lib/whatsapp/messages";
import { sendWhatsAppButtons, sendWhatsAppList, sendWhatsAppMessage, type WhatsAppButton } from "../../../lib/whatsapp/outbound";
import { getOrgChannelCredentials } from "../../../lib/whatsapp/channel-token";
import { parseCommunity } from "../../../lib/community";
import { createSoloOrganizationForVendor, trialEndsAt } from "../../../lib/tenant";
import {
  step,
  friendlyDueText,
  reminderPromiseForDue,
  type SessionContext,
  type SideEffect,
} from "../../../lib/whatsapp/state-machine";
import {
  getCustomerScorePreview,
  sendCustomerVerification,
  vendorKnowsCustomer,
  verifyVerification,
  maskPhone,
} from "../../../lib/customer-verify";
import type { WhatsAppState } from "@prisma/client";

export const runtime = "nodejs";

// ── Meta webhook payload types ────────────────────────────────────────────────

interface MetaTextMessage {
  from:      string;   // E.164 without "+"
  id:        string;
  timestamp: string;
  type:      "text" | "interactive" | string;
  text?:     { body: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?:   { id: string; title: string };
  };
}

interface MetaWebhook {
  object: string;
  entry:  Array<{
    id:      string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: MetaTextMessage[];
        statuses?: unknown[];
      };
    }>;
  }>;
}

// ── GET — webhook verification ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    // Return the challenge as plain text — Meta requires this exact response.
    return new NextResponse(challenge ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ── POST — incoming messages ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Always return 200 to Meta — any non-200 causes retries and webhook suspension.
  // All errors are caught and logged; we never let an exception escape this handler.

  const rawBody = await req.text();

  // ── HMAC signature check ────────────────────────────────────────────────────
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sigHeader = req.headers.get("x-hub-signature-256") ?? "";
    const expected  = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    // Constant-time compare (both same length — SHA256 hex is always 64 chars + "sha256=")
    const a = Buffer.from(sigHeader.padEnd(expected.length, "\0"));
    const b = Buffer.from(expected.padEnd(sigHeader.length, "\0"));
    const maxLen = Math.max(a.length, b.length);
    const aBuf = Buffer.alloc(maxLen); a.copy(aBuf);
    const bBuf = Buffer.alloc(maxLen); b.copy(bBuf);
    if (!crypto.timingSafeEqual(aBuf, bBuf) || a.length !== b.length) {
      console.error("[whatsapp] HMAC signature mismatch — check WHATSAPP_APP_SECRET in Vercel env vars");
      // Still return 200 so Meta doesn't suspend the webhook, but don't process
      return NextResponse.json({ ok: true });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Fail closed: without the app secret we cannot verify Meta's signature, so
    // refuse to process (prevents forged webhook events driving the bot).
    console.error("[whatsapp] WHATSAPP_APP_SECRET not set in production — rejecting unverifiable webhook");
    return NextResponse.json({ ok: true });
  } else {
    console.warn("[whatsapp] WHATSAPP_APP_SECRET not set — skipping signature check (dev only).");
  }

  // ── Parse payload ───────────────────────────────────────────────────────────
  let payload: MetaWebhook;
  try {
    payload = JSON.parse(rawBody) as MetaWebhook;
  } catch {
    console.error("[whatsapp] Failed to parse webhook JSON");
    return NextResponse.json({ ok: true });
  }

  // ── Extract message ─────────────────────────────────────────────────────────
  const change  = payload.entry?.[0]?.changes?.[0];
  const value   = change?.value;
  const message = value?.messages?.[0];
  const phoneNumberId = value?.metadata?.phone_number_id;

  // Text messages carry a body; button taps arrive as "interactive" replies whose
  // id we treat exactly like typed text (e.g. tapping [Add credit] sends "ADD").
  const rawText =
    message?.type === "text"
      ? message.text?.body
      : message?.type === "interactive"
        ? message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id
        : undefined;

  // Silently ack status updates, delivery receipts, unsupported media, etc.
  if (!message || !rawText?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const fromPhone   = `+${message.from}`;   // Meta sends without "+", normalise to E.164
  const messageText = rawText.trim();

  console.log(`[whatsapp] ← ${fromPhone}: "${messageText}"`);

  // ── Process message (wrapped so errors never escape) ────────────────────────
  try {
    const channel = phoneNumberId
      ? await prisma.whatsAppChannel.findUnique({
          where: { phoneNumberId },
          select: { id: true, organizationId: true, status: true },
        })
      : null;

    // Reply from the store's own WhatsApp number when this message arrived on a
    // store channel; otherwise fall back to the global Vodium number.
    const creds = (await getOrgChannelCredentials(channel?.organizationId)) ?? undefined;

    // Load or create session
    const session = await prisma.whatsAppSession.upsert({
      where:  { phone: fromPhone },
      update: {
        lastInteractionAt: new Date(),
        ...(channel ? { channelId: channel.id, organizationId: channel.organizationId } : {}),
      },
      create: {
        phone: fromPhone,
        state: "IDLE",
        context: {},
        ...(channel ? { channelId: channel.id, organizationId: channel.organizationId } : {}),
      },
    });

    // Resolve vendor — restrict BOT to registered vendors only
    const vendor = session.vendorId
      ? await prisma.vendor.findUnique({ where: { id: session.vendorId } })
      : await prisma.vendor.findUnique({ where: { phone: fromPhone } });

    if (!vendor) {
      // Customers replying "PAID" to a reminder raise a claim — the vendor must
      // confirm before the credit is actually marked paid.
      const claimHandled = await handleCustomerPaidClaim(fromPhone, messageText, creds);
      if (claimHandled) return NextResponse.json({ ok: true });

      console.log(`[whatsapp] Rejected: unregistered user ${fromPhone}`);
      await sendWhatsAppMessage(
        fromPhone,
        "You are not registered as a vendor on Vodium Ledger. Please sign up at vodiumledger.com or contact support.",
        creds
      );
      return NextResponse.json({ ok: true });
    }

    // Run state machine
    const sessionCtx: SessionContext = {
      state:    session.state,
      context:  (session.context as Record<string, unknown>) ?? {},
      vendorId: vendor?.id,
    };

    const result = step(sessionCtx, { body: messageText, fromPhone });

    // Persist updated session
    const mergedContext = { ...sessionCtx.context, ...(result.contextPatch ?? {}) };
    await prisma.whatsAppSession.update({
      where: { phone: fromPhone },
      data: {
        state:   result.nextState,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context: mergedContext as any,
        vendorId: vendor?.id,
        ...(channel ? { channelId: channel.id, organizationId: channel.organizationId } : {}),
      },
    });

    // Side effects
    let finalReply     = result.reply;
    let finalButtons   = result.buttons;
    let finalList      = result.list;
    let linkedVendorId = vendor?.id;
    let stateOverride: WhatsAppState | undefined;
    let contextOverride: Record<string, unknown> | undefined;

    if (result.sideEffects?.length) {
      for (const effect of result.sideEffects) {
        const r = await runSideEffect(effect, fromPhone, vendor?.id, mergedContext);
        if (r.replyOverride !== undefined) {
          finalReply   = r.replyOverride;
          finalButtons = r.buttonsOverride;
          finalList    = undefined;
        }
        if (r.newVendorId)        linkedVendorId  = r.newVendorId;
        if (r.stateOverride)      stateOverride   = r.stateOverride;
        if (r.contextPatchOverride) contextOverride = { ...(contextOverride ?? {}), ...r.contextPatchOverride };
      }
      if (linkedVendorId && linkedVendorId !== vendor?.id) {
        await prisma.whatsAppSession.update({
          where: { phone: fromPhone },
          data:  { vendorId: linkedVendorId },
        });
      }
      // A side effect can redirect the conversation (e.g. into verification).
      if (stateOverride || contextOverride) {
        await prisma.whatsAppSession.update({
          where: { phone: fromPhone },
          data: {
            ...(stateOverride ? { state: stateOverride } : {}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            context: { ...mergedContext, ...(contextOverride ?? {}) } as any,
          },
        });
      }
    }

    console.log(`[whatsapp] → ${fromPhone}: "${finalReply.slice(0, 80)}..."`);

    // Send reply (with a tappable list or buttons when the step provides them)
    if (finalList) {
      await sendWhatsAppList(fromPhone, finalReply, finalList.buttonText, finalList.rows, creds);
    } else if (finalButtons?.length) {
      await sendWhatsAppButtons(fromPhone, finalReply, finalButtons, creds);
    } else {
      await sendWhatsAppMessage(fromPhone, finalReply, creds);
    }

  } catch (err) {
    console.error("[whatsapp] Error processing message from", fromPhone, ":", err);
    // Attempt a fallback reply so the user isn't left hanging
    try {
      await sendWhatsAppMessage(
        fromPhone,
        "Sorry, I ran into a problem. Please try again in a moment or visit your dashboard."
      );
    } catch (sendErr) {
      console.error("[whatsapp] Failed to send fallback message:", sendErr);
    }
  }

  // Always 200 so Meta doesn't retry or suspend the webhook
  return NextResponse.json({ ok: true });
}

// ── side-effect executor ──────────────────────────────────────────────────────

interface SideEffectResult {
  replyOverride?: string;
  /** Buttons attached to the overriding reply (ignored without replyOverride). */
  buttonsOverride?: WhatsAppButton[];
  newVendorId?:   string;
  /** Redirect the conversation to a new state (e.g. into customer verification). */
  stateOverride?: WhatsAppState;
  /** Merge extra keys into the persisted session context. */
  contextPatchOverride?: Record<string, unknown>;
}

const OPEN_CREDIT_STATUSES = ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] as const;

const ADD_AGAIN_BUTTONS: WhatsAppButton[] = [
  { id: "ADD",  title: "Add another" },
  { id: "LIST", title: "Who's owing" },
];

/** Creates the credit, its score event and the vendor notification. Shared by the
 *  direct path and the post-verification path. */
async function finalizeCredit(input: {
  vendorId: string;
  vendor: { organizationId: string | null; branchId: string | null };
  studentId: string;
  customerName: string;
  amount: number;
  dueInMinutes: number;
  remindersEnabled: boolean;
}) {
  const dueDate = new Date(Date.now() + input.dueInMinutes * 60_000);
  await prisma.credit.create({
    data: {
      vendorId: input.vendorId,
      organizationId: input.vendor.organizationId,
      branchId: input.vendor.branchId,
      studentId: input.studentId,
      amount: input.amount,
      dueDate,
      status: "OUTSTANDING",
      remindersEnabled: input.remindersEnabled,
    },
  });
  await prisma.creditScoreEvent.create({
    data: { studentId: input.studentId, vendorId: input.vendorId, eventType: "CREDIT_EXTENDED", amount: input.amount, scoreDelta: 0 },
  });
  await prisma.notification.create({
    data: {
      vendorId: input.vendorId,
      title: "New Credit Added",
      message: `₦${Number(input.amount).toLocaleString()} credit recorded for ${input.customerName} via WhatsApp.`,
      type: "INFO",
    },
  });
}

/** Clears the pending-verification keys from the session context. */
const CLEAR_PENDING_VERIFY = {
  pvHmac: null, pvExpiresAt: null, pvPhone: null, pvMasked: null,
  pcName: null, pcAmount: null, pcDue: null, pcReminders: null,
} as const;

/** Marks a credit fully paid: repayment, score event, score update, vendor notification. */
async function settleCredit(
  credit: { id: string; amount: unknown; dueDate: Date; student: { id: string; fullName: string; vodiumScore: number | null } },
  vendorId: string
): Promise<{ customerName: string; amount: number }> {
  const amount   = Number(credit.amount);
  const customer = credit.student;
  const now      = new Date();
  const paidOnTime = now <= credit.dueDate;
  const scoreDelta = paidOnTime ? 25 : -15;
  const eventType  = paidOnTime ? "PAID_ON_TIME" : ("PAID_LATE" as const);

  await prisma.credit.update({ where: { id: credit.id }, data: { status: "PAID", amountRepaid: amount, closedAt: now } });
  await prisma.repayment.create({ data: { creditId: credit.id, amount, method: "CASH", receivedAt: now, recordedBy: vendorId } });
  await prisma.creditScoreEvent.create({ data: { studentId: customer.id, vendorId, creditId: credit.id, eventType, amount, scoreDelta } });
  const newScore = Math.min(1000, Math.max(0, (customer.vodiumScore ?? 500) + scoreDelta));
  await prisma.student.update({ where: { id: customer.id }, data: { vodiumScore: newScore, scoreUpdatedAt: now } });

  await prisma.notification.create({
    data: {
      vendorId,
      title: "Credit Paid",
      message: `${customer.fullName} paid ₦${amount.toLocaleString()} via WhatsApp.`,
      type: "SUCCESS",
    },
  });

  return { customerName: customer.fullName, amount };
}

/**
 * A customer (not a vendor) replied "PAID" — raise a claim with every vendor
 * holding an open credit for them. Nothing is marked paid here: each vendor
 * gets a tappable Confirm/Not-received prompt and the ledger only changes
 * when they confirm. Returns false when the sender isn't a known customer.
 */
async function handleCustomerPaidClaim(
  fromPhone: string,
  text: string,
  creds?: { token: string; phoneId: string }
): Promise<boolean> {
  const upper = text.trim().toUpperCase();
  if (upper !== "PAID" && !upper.startsWith("PAID ")) return false;

  const student = await prisma.student.findUnique({ where: { phone: fromPhone } });
  if (!student) return false;

  const credits = await prisma.credit.findMany({
    where: { studentId: student.id, status: { in: [...OPEN_CREDIT_STATUSES] } },
    include: { vendor: { select: { id: true, businessName: true, phone: true, organizationId: true } } },
    orderBy: { dueDate: "asc" },
  });

  if (!credits.length) {
    await sendWhatsAppMessage(fromPhone, messages.claimNoCredit(), creds);
    return true;
  }

  const vendorNames: string[] = [];
  for (const credit of credits) {
    const amount = Number(credit.amount);
    if (!vendorNames.includes(credit.vendor.businessName)) vendorNames.push(credit.vendor.businessName);

    await prisma.notification.create({
      data: {
        vendorId: credit.vendor.id,
        title: "Payment Claim",
        message: `${student.fullName} says they've paid ₦${amount.toLocaleString()}. Confirm on WhatsApp once you receive it.`,
        type: "INFO",
      },
    });

    const vendorCreds = (await getOrgChannelCredentials(credit.vendor.organizationId)) ?? undefined;
    try {
      await sendWhatsAppButtons(
        credit.vendor.phone,
        messages.claimToVendor(student.fullName, amount),
        [
          { id: `CONFIRM_PAID_${credit.id}`, title: "Confirm received ✓" },
          { id: `NOT_PAID_${credit.id}`,     title: "Not received" },
        ],
        vendorCreds
      );
    } catch (err) {
      console.error("[whatsapp] Failed to notify vendor of payment claim:", err);
    }
  }

  await sendWhatsAppMessage(fromPhone, messages.claimAckToCustomer(vendorNames), creds);
  return true;
}

async function runSideEffect(
  effect:    SideEffect,
  fromPhone: string,
  vendorId?: string,
  sessionContext: Record<string, unknown> = {}
): Promise<SideEffectResult> {
  switch (effect.type) {

    case "CREATE_VENDOR": {
      const { name, businessName, communityName, phone } = effect.data;
      const normalPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const existing    = await prisma.vendor.findUnique({ where: { phone: normalPhone } });
      if (existing) return { newVendorId: existing.id };

      const communityMeta    = parseCommunity(communityName);
      const community = await prisma.community.upsert({
        where:  { name: communityMeta.name },
        update: {},
        create: { name: communityMeta.name, shortName: communityMeta.shortName ?? null, city: communityMeta.city, state: communityMeta.state, status: "PILOT" },
      });

      const placeholderEmail = `${normalPhone.replace("+", "")}@wa.vodiumledger.com`;
      const placeholderHash  = `$2a$12$whatsapp${crypto.randomBytes(16).toString("hex")}`;
      const subscriptionTrialEndsAt = trialEndsAt();

      const newVendor = await prisma.vendor.create({
        data: {
          ownerName: name, businessName, phone: normalPhone,
          email: placeholderEmail, passwordHash: placeholderHash,
          communityId: community.id, vendorType: "OTHER", status: "ACTIVE",
          subscription: { create: { plan: "STARTER", status: "TRIAL", trialEndsAt: subscriptionTrialEndsAt, monthlyAmount: 2000 } },
        },
      });
      await createSoloOrganizationForVendor(newVendor);
      return { newVendorId: newVendor.id };
    }

    case "SCORE_PREVIEW": {
      // Warn the vendor about the customer's cross-vendor reliability before they
      // decide the amount. Only overrides the prompt when the customer is known.
      const preview = await getCustomerScorePreview({
        phone: effect.data.customerPhone,
        name: effect.data.customerName,
      });
      if (!preview?.found) return {};
      return {
        replyOverride: messages.addCreditAskAmountWithScore(effect.data.customerName, preview.warning),
        buttonsOverride: [{ id: "CANCEL", title: "Cancel" }],
      };
    }

    case "CREATE_CREDIT": {
      if (!vendorId) return {};
      const { customerName, customerPhone, amount, dueInMinutes, remindersEnabled } = effect.data;
      const normalCustomerPhone = normalisePhone(customerPhone);
      if (!normalCustomerPhone) {
        return {
          replyOverride: "That customer phone number is not valid. Please restart with ADD and enter a valid WhatsApp number.", buttonsOverride: [{ id: "ADD", title: "Try again" }] as WhatsAppButton[],
        };
      }
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { businessName: true, communityId: true, organizationId: true, branchId: true },
      });

      const existingVendor = await prisma.vendor.findUnique({
        where: { phone: normalCustomerPhone },
        select: { businessName: true },
      });
      if (existingVendor) {
        return {
          replyOverride: "That phone number belongs to a vendor account. Please use the customer's WhatsApp number and try ADD again.", buttonsOverride: [{ id: "ADD", title: "Try again" }] as WhatsAppButton[],
        };
      }

      const existingCustomer = await prisma.student.findUnique({
        where: { phone: normalCustomerPhone },
      });

      // Existing number belonging to a customer this vendor has never served →
      // verify with a code sent to the customer's own WhatsApp before attaching.
      if (existingCustomer && !(await vendorKnowsCustomer(vendorId, existingCustomer.id))) {
        let challenge;
        try {
          challenge = await sendCustomerVerification({ phone: normalCustomerPhone, storeName: vendor?.businessName ?? "the shop" });
        } catch (err) {
          console.error("[whatsapp] customer verification send failed:", err);
          return { replyOverride: messages.verifyDeliveryFailed(), buttonsOverride: [{ id: "ADD", title: "Try again" }] as WhatsAppButton[] };
        }
        const masked = maskPhone(normalCustomerPhone);
        return {
          replyOverride: messages.verifyAskCode(masked),
          buttonsOverride: [{ id: "RESEND", title: "Resend code" }, { id: "CANCEL", title: "Cancel" }],
          stateOverride: "VERIFYING_CUSTOMER",
          contextPatchOverride: {
            pvHmac: challenge.hmac, pvExpiresAt: challenge.expiresAt, pvPhone: normalCustomerPhone, pvMasked: masked,
            pcName: customerName, pcAmount: amount, pcDue: dueInMinutes, pcReminders: remindersEnabled,
          },
        };
      }

      // No verification needed: brand-new customer, or a repeat at this shop.
      const generatedCustomerId = await nextVendorCustomerId(vendorId, vendor?.businessName ?? "Customer");
      let customer = existingCustomer;
      if (existingCustomer) {
        if (!existingCustomer.matricNumber) {
          customer = await prisma.student.update({
            where: { id: existingCustomer.id },
            data: { matricNumber: generatedCustomerId },
          });
        }
      } else {
        customer = await prisma.student.create({
          data: {
            fullName: customerName,
            phone: normalCustomerPhone,
            matricNumber: generatedCustomerId,
            communityId: vendor?.communityId ?? null,
            organizationId: vendor?.organizationId ?? null,
          },
        });
      }
      if (!customer || !vendor) return {};

      await finalizeCredit({
        vendorId,
        vendor: { organizationId: vendor.organizationId, branchId: vendor.branchId },
        studentId: customer.id,
        customerName,
        amount,
        dueInMinutes,
        remindersEnabled,
      });

      return {}; // state machine already sent the "✅ Saved" confirmation
    }

    case "VERIFY_CUSTOMER_CODE": {
      if (!vendorId) return { replyOverride: messages.noVendorAccount() };
      const phone = String(sessionContext.pvPhone ?? "");
      const hmac = String(sessionContext.pvHmac ?? "");
      const expiresAt = Number(sessionContext.pvExpiresAt ?? 0);

      if (!phone || !hmac || !verifyVerification(phone, effect.data.code, expiresAt, hmac)) {
        return {
          replyOverride: messages.verifyBadCode(),
          buttonsOverride: [{ id: "RESEND", title: "Resend code" }, { id: "CANCEL", title: "Cancel" }],
          stateOverride: "VERIFYING_CUSTOMER",
        };
      }

      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { businessName: true, communityId: true, organizationId: true, branchId: true },
      });
      const customer = await prisma.student.findUnique({ where: { phone } });
      if (!vendor || !customer) {
        return { replyOverride: "Sorry, I couldn't complete that. Please try *ADD* again.", buttonsOverride: [{ id: "ADD", title: "Try again" }] as WhatsAppButton[], stateOverride: "IDLE", contextPatchOverride: { ...CLEAR_PENDING_VERIFY } };
      }

      if (!customer.matricNumber) {
        await prisma.student.update({
          where: { id: customer.id },
          data: { matricNumber: await nextVendorCustomerId(vendorId, vendor.businessName) },
        });
      }

      const amount = Number(sessionContext.pcAmount ?? 0);
      const dueInMinutes = Number(sessionContext.pcDue ?? 0);
      const remindersEnabled = sessionContext.pcReminders !== false;

      await finalizeCredit({
        vendorId,
        vendor: { organizationId: vendor.organizationId, branchId: vendor.branchId },
        studentId: customer.id,
        customerName: customer.fullName,
        amount,
        dueInMinutes,
        remindersEnabled,
      });

      const reply = messages.addCreditConfirmed(
        customer.fullName,
        amount,
        friendlyDueText(dueInMinutes),
        remindersEnabled ? reminderPromiseForDue(dueInMinutes) : messages.noReminderPromise(),
      );
      return {
        replyOverride: `✅ Verified.\n\n${reply}`,
        buttonsOverride: ADD_AGAIN_BUTTONS,
        stateOverride: "IDLE",
        contextPatchOverride: { ...CLEAR_PENDING_VERIFY },
      };
    }

    case "RESEND_CUSTOMER_CODE": {
      const phone = String(sessionContext.pvPhone ?? "");
      if (!phone) {
        return { replyOverride: "That request expired. Please start again with *ADD*.", buttonsOverride: [{ id: "ADD", title: "Add credit" }] as WhatsAppButton[], stateOverride: "IDLE", contextPatchOverride: { ...CLEAR_PENDING_VERIFY } };
      }
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId ?? "" }, select: { businessName: true } });
      try {
        const challenge = await sendCustomerVerification({ phone, storeName: vendor?.businessName ?? "the shop" });
        return {
          replyOverride: messages.verifyResent(maskPhone(phone)),
          buttonsOverride: [{ id: "RESEND", title: "Resend code" }, { id: "CANCEL", title: "Cancel" }],
          stateOverride: "VERIFYING_CUSTOMER",
          contextPatchOverride: { pvHmac: challenge.hmac, pvExpiresAt: challenge.expiresAt },
        };
      } catch (err) {
        console.error("[whatsapp] resend verification failed:", err);
        return { replyOverride: messages.verifyDeliveryFailed(), buttonsOverride: [{ id: "CANCEL", title: "Cancel" }], stateOverride: "VERIFYING_CUSTOMER" };
      }
    }

    case "CREATE_INVOICE": {
      if (!vendorId) return { replyOverride: messages.noVendorAccount() };
      const { customerName, customerPhone, items, dueInMinutes } = effect.data;

      let vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: { organization: true },
      });
      if (!vendor) return {};

      // Invoices are organization-scoped; older bot vendors may predate solo orgs.
      if (!vendor.organizationId) {
        await createSoloOrganizationForVendor(vendor);
        vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, include: { organization: true } });
      }
      if (!vendor?.organizationId || !vendor.organization) {
        return { replyOverride: "I couldn't set up invoicing for your shop. Please try again or reply *SUPPORT*.", buttonsOverride: [{ id: "INVOICE", title: "Try again" }] as WhatsAppButton[] };
      }
      const organization = vendor.organization;

      let customer;
      try {
        customer = await getOrCreateCustomerForVendor({
          vendorId,
          vendorBusinessName: vendor.businessName,
          communityId: vendor.communityId,
          organizationId: vendor.organizationId,
          fullName: customerName,
          phone: customerPhone,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "I couldn't save that customer.";
        return { replyOverride: `❌ ${message}\n\nReply *INVOICE* to try again.`, buttonsOverride: [{ id: "INVOICE", title: "Try again" }] as WhatsAppButton[] };
      }

      const subtotal = roundMoney(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
      if (subtotal <= 0) {
        return { replyOverride: "The invoice total must be greater than zero. Reply *INVOICE* to try again.", buttonsOverride: [{ id: "INVOICE", title: "Try again" }] as WhatsAppButton[] };
      }

      const dueDate = new Date(Date.now() + dueInMinutes * 60_000);
      const invoice = await prisma.invoice.create({
        data: {
          organizationId: vendor.organizationId,
          branchId: vendor.branchId,
          vendorId,
          studentId: customer.id,
          invoiceNumber: `INV-${(organization.slug ?? "VDM").slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          status: "DRAFT",
          subtotal,
          discountAmount: 0,
          total: subtotal,
          dueDate,
          items: {
            create: items.map((i) => ({
              name: i.name.trim(),
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: roundMoney(i.quantity * i.unitPrice),
            })),
          },
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vodiumledger.com";
      const link = `${appUrl}/invoice/${signInvoiceToken(invoice.id)}`;
      const storeName = organization.name ?? vendor.businessName;
      const dueText = dueDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

      const customerMessage =
        `Hi *${customer.fullName}* 👋\n\n` +
        `${storeName} has sent you an invoice.\n\n` +
        `*Invoice:* ${invoice.invoiceNumber}\n` +
        `*Amount:* ${formatNaira(subtotal)}\n` +
        `*Due:* ${dueText}\n\n` +
        `View it here:\n${link}\n\n` +
        `Thank you! 🙏`;

      const orgCreds = await getOrgChannelCredentials(vendor.organizationId);
      try {
        await sendWhatsAppMessage(customer.phone, customerMessage, orgCreds ?? undefined);
      } catch (err) {
        console.error("[whatsapp] Invoice delivery failed:", err);
        return { replyOverride: messages.invoiceSendFailed(invoice.invoiceNumber, link), buttonsOverride: [{ id: "INVOICE", title: "New invoice" }, { id: "LIST", title: "Who's owing" }] as WhatsAppButton[] };
      }

      await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "SENT", sentAt: new Date() } });
      await prisma.notification.create({
        data: {
          vendorId,
          title: "Invoice Sent",
          message: `Invoice ${invoice.invoiceNumber} (${formatNaira(subtotal)}) sent to ${customer.fullName} via WhatsApp.`,
          type: "SUCCESS",
        },
      });

      return {
        replyOverride: messages.invoiceSent(customer.fullName, invoice.invoiceNumber, subtotal),
        buttonsOverride: [
          { id: "INVOICE", title: "New invoice" },
          { id: "LIST",    title: "Who's owing" },
        ],
      };
    }

    case "FETCH_LIST": {
      const credits = await prisma.credit.findMany({
        where: { vendorId: effect.data.vendorId, status: { in: ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] } },
        include: { student: true },
        orderBy: { dueDate: "asc" },
      });
      if (!credits.length) {
        return {
          replyOverride: messages.listEmpty(),
          buttonsOverride: [
            { id: "ADD",     title: "Add credit" },
            { id: "INVOICE", title: "New invoice" },
          ],
        };
      }
      const now = Date.now();
      return {
        replyOverride: messages.listFull(credits.map((c) => ({ customerName: c.student.fullName, amount: Number(c.amount), daysUntilDue: Math.ceil((c.dueDate.getTime() - now) / 86_400_000) }))),
        buttonsOverride: [
          { id: "PAID",  title: "Mark one paid" },
          { id: "ADD",   title: "Add credit" },
          { id: "SCORE", title: "Check a score" },
        ],
      };
    }

    case "MARK_PAID": {
      if (!vendorId) return { replyOverride: messages.noVendorAccount() };
      const { customerName } = effect.data;
      const words   = customerName.split(/\s+/).filter(Boolean);
      const credits = await prisma.credit.findMany({
        where: { vendorId, status: { in: [...OPEN_CREDIT_STATUSES] }, student: { OR: words.map((w) => ({ fullName: { contains: w, mode: "insensitive" as const } })) } },
        include: { student: true }, orderBy: { dueDate: "asc" }, take: 1,
      });
      if (!credits.length) {
        return { replyOverride: messages.paidNotFound(customerName), buttonsOverride: [{ id: "LIST", title: "Who's owing" }] };
      }
      const settled = await settleCredit(credits[0], vendorId);
      return {
        replyOverride: messages.paidConfirmed(settled.customerName, settled.amount),
        buttonsOverride: [
          { id: "LIST", title: "Who's owing" },
          { id: "ADD",  title: "Add credit" },
        ],
      };
    }

    case "CONFIRM_PAID": {
      const { creditId } = effect.data;
      const credit = await prisma.credit.findFirst({
        where: { id: creditId, vendorId: effect.data.vendorId, status: { in: [...OPEN_CREDIT_STATUSES] } },
        include: { student: true },
      });
      if (!credit) return { replyOverride: messages.confirmNotFound() };

      const settled = await settleCredit(credit, effect.data.vendorId);

      // Close the loop with the customer.
      const confirmingVendor = await prisma.vendor.findUnique({
        where: { id: effect.data.vendorId },
        select: { businessName: true, organizationId: true },
      });
      const customerCreds = (await getOrgChannelCredentials(confirmingVendor?.organizationId)) ?? undefined;
      try {
        await sendWhatsAppMessage(
          credit.student.phone,
          messages.claimConfirmedToCustomer(confirmingVendor?.businessName ?? "The vendor", settled.amount),
          customerCreds
        );
      } catch (err) {
        console.error("[whatsapp] Failed to notify customer of confirmed payment:", err);
      }

      return {
        replyOverride: messages.paidConfirmed(settled.customerName, settled.amount),
        buttonsOverride: [{ id: "LIST", title: "Who's owing" }],
      };
    }

    case "DISPUTE_PAID": {
      const { creditId } = effect.data;
      const credit = await prisma.credit.findFirst({
        where: { id: creditId, vendorId: effect.data.vendorId, status: { in: [...OPEN_CREDIT_STATUSES] } },
        include: { student: true, vendor: { select: { businessName: true, organizationId: true } } },
      });
      if (!credit) return { replyOverride: messages.confirmNotFound() };

      const customerCreds = (await getOrgChannelCredentials(credit.vendor.organizationId)) ?? undefined;
      try {
        await sendWhatsAppMessage(
          credit.student.phone,
          messages.claimDisputedToCustomer(credit.vendor.businessName, Number(credit.amount)),
          customerCreds
        );
      } catch (err) {
        console.error("[whatsapp] Failed to notify customer of disputed claim:", err);
      }

      return { replyOverride: messages.claimDisputeNoted(credit.student.fullName), buttonsOverride: [{ id: "LIST", title: "Who's owing" }] as WhatsAppButton[] };
    }

    case "FETCH_SCORE": {
      const { customerQuery, fromPhone: _fromPhone } = effect.data;
      const words = customerQuery.split(/\s+/).filter(Boolean);
      
      // Try by phone first
      const normalQueryPhone = normalisePhone(customerQuery);
      const byPhone = normalQueryPhone ? await prisma.student.findUnique({ where: { phone: normalQueryPhone }, include: { scoreEvents: { orderBy: { occurredAt: "asc" } } } }) : null;
      
      const customer = byPhone ?? await prisma.student.findFirst({ where: { OR: words.map((w) => ({ fullName: { contains: w, mode: "insensitive" as const } })), NOT: { phone: { startsWith: "pending:" } } }, include: { scoreEvents: { orderBy: { occurredAt: "asc" } } }, orderBy: { createdAt: "desc" } });
      
      const scoreButtons: WhatsAppButton[] = [
        { id: "LIST", title: "Who's owing" },
        { id: "ADD",  title: "Add credit" },
      ];
      if (!customer)                    return { replyOverride: messages.scoreNotFound(customerQuery), buttonsOverride: scoreButtons };
      if (!customer.scoreEvents.length) return { replyOverride: messages.scoreNoHistory(customer.fullName), buttonsOverride: scoreButtons };

      const { score, summary } = computeScore(customer.scoreEvents);
      return { replyOverride: messages.scoreReply(customer.fullName, score, summary), buttonsOverride: scoreButtons };
    }


    default:
      return {};
  }
}
