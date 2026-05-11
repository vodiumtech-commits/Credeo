/**
 * SendPulse WhatsApp webhook — POST /api/whatsapp
 *
 * SendPulse sends JSON payloads (not form-encoded like Twilio).
 * We return { ok: true } immediately and send the reply via SendPulse API.
 *
 * Payload shape SendPulse delivers:
 * {
 *   event_name: "incoming message",
 *   bot:     { id: "bot_id", channel_type: "whatsapp" },
 *   contact: { id: "...", phone: "+2348012345678", name: "John" },
 *   message: { id: "...", type: "text", data: { text: "ADD" } }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/credit-score/score";
import { messages } from "@/lib/whatsapp/messages";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import {
  step,
  type SessionContext,
  type SideEffect,
} from "@/lib/whatsapp/state-machine";

export const runtime = "nodejs";

// ─── SendPulse webhook payload type ──────────────────────────────────────────

interface SendPulseWebhook {
  event_name?: string;
  bot?:        { id: string; channel_type: string };
  contact?:    { id: string; phone: string; name?: string };
  message?:    { id: string; type: string; data?: { text?: string } };
}

// ─── webhook ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Parse JSON body.
  let payload: SendPulseWebhook;
  try {
    payload = (await req.json()) as SendPulseWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 2. Verify webhook secret (SendPulse sends X-Secret-Token header).
  const webhookSecret = process.env.SENDPULSE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const incoming = req.headers.get("x-secret-token") ?? "";
    if (incoming !== webhookSecret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 3. Only handle text messages — silently ack everything else.
  const fromPhone   = payload.contact?.phone;
  const messageText = payload.message?.data?.text?.trim();

  if (!fromPhone || !messageText || payload.message?.type !== "text") {
    return NextResponse.json({ ok: true });
  }

  // 4. Load or create session (stored with E.164 phone, no prefix needed).
  const session = await prisma.whatsAppSession.upsert({
    where:  { phone: fromPhone },
    update: { lastInteractionAt: new Date() },
    create: { phone: fromPhone, state: "IDLE", context: {} },
  });

  // 5. Resolve vendor — by linked session first, then by phone.
  const vendor = session.vendorId
    ? await prisma.vendor.findUnique({ where: { id: session.vendorId } })
    : await prisma.vendor.findUnique({ where: { phone: fromPhone } });

  // 6. Run state machine.
  const sessionCtx: SessionContext = {
    state:    session.state,
    context:  (session.context as Record<string, unknown>) ?? {},
    vendorId: vendor?.id,
  };

  const result = step(sessionCtx, { body: messageText, fromPhone });

  // 7. Persist updated session.
  await prisma.whatsAppSession.update({
    where: { phone: fromPhone },
    data: {
      state:   result.nextState,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context: { ...sessionCtx.context, ...(result.contextPatch ?? {}) } as any,
      vendorId: vendor?.id,
    },
  });

  // 8. Run side effects — each can override the reply.
  let finalReply    = result.reply;
  let linkedVendorId = vendor?.id;

  if (result.sideEffects?.length) {
    for (const effect of result.sideEffects) {
      const { replyOverride, newVendorId } = await runSideEffect(
        effect,
        fromPhone,
        vendor?.id
      );
      if (replyOverride !== undefined) finalReply   = replyOverride;
      if (newVendorId)                 linkedVendorId = newVendorId;
    }

    // Link newly-created vendor to this session.
    if (linkedVendorId && linkedVendorId !== vendor?.id) {
      await prisma.whatsAppSession.update({
        where: { phone: fromPhone },
        data:  { vendorId: linkedVendorId },
      });
    }
  }

  // 9. Send reply via SendPulse API (not TwiML — that's Twilio only).
  await sendWhatsAppMessage(fromPhone, finalReply);

  return NextResponse.json({ ok: true });
}

// SendPulse pings GET to verify the endpoint.
export async function GET() {
  return NextResponse.json({ ok: true, service: "vodium-ledger-whatsapp" });
}

// ─── side-effect executor ─────────────────────────────────────────────────────

interface SideEffectResult {
  replyOverride?: string;
  newVendorId?:   string;
}

async function runSideEffect(
  effect:    SideEffect,
  fromPhone: string,
  vendorId?: string
): Promise<SideEffectResult> {
  switch (effect.type) {

    // ── CREATE_VENDOR ──────────────────────────────────────────────────────
    case "CREATE_VENDOR": {
      const { name, businessName, universityShortName, phone } = effect.data;

      const normalPhone = phone.replace(/^whatsapp:/, "");
      const existing    = await prisma.vendor.findUnique({ where: { phone: normalPhone } });
      if (existing) return { newVendorId: existing.id };

      const university = await prisma.university.upsert({
        where:  { name: universityShortName },
        update: {},
        create: {
          name:      universityShortName,
          shortName: universityShortName,
          city:      "Nigeria",
          state:     "Nigeria",
          status:    "PILOT",
        },
      });

      const placeholderEmail = `${normalPhone.replace("+", "")}@wa.credeo.app`;
      const placeholderHash  = `$2a$12$whatsapp${crypto.randomBytes(16).toString("hex")}`;
      const trialEndsAt      = new Date(Date.now() + 60 * 86_400_000);

      const newVendor = await prisma.vendor.create({
        data: {
          ownerName:    name,
          businessName,
          phone:        normalPhone,
          email:        placeholderEmail,
          passwordHash: placeholderHash,
          universityId: university.id,
          vendorType:   "OTHER",
          status:       "ACTIVE",
          subscription: {
            create: {
              plan:          "STARTER",
              status:        "TRIAL",
              trialEndsAt,
              monthlyAmount: 2000,
            },
          },
        },
      });

      return { newVendorId: newVendor.id };
    }

    // ── CREATE_CREDIT ──────────────────────────────────────────────────────
    case "CREATE_CREDIT": {
      if (!vendorId) return {};
      const { studentName, matric, amount, dueInDays } = effect.data;

      const pendingPhone = `pending:${studentName.toLowerCase().replace(/\s+/g, "-")}`;
      const student = await prisma.student.upsert({
        where:  { phone: pendingPhone },
        update: {},
        create: {
          fullName:     studentName,
          phone:        pendingPhone,
          ...(matric && { matricNumber: matric }),
        },
      });

      const dueDate = new Date(Date.now() + dueInDays * 86_400_000);
      await prisma.credit.create({
        data: { vendorId, studentId: student.id, amount, dueDate, status: "OUTSTANDING" },
      });

      await prisma.creditScoreEvent.create({
        data: { studentId: student.id, vendorId, eventType: "CREDIT_EXTENDED", amount, scoreDelta: 0 },
      });

      return {};
    }

    // ── FETCH_LIST ─────────────────────────────────────────────────────────
    case "FETCH_LIST": {
      const credits = await prisma.credit.findMany({
        where:   {
          vendorId: effect.data.vendorId,
          status:   { in: ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] },
        },
        include: { student: true },
        orderBy: { dueDate: "asc" },
      });

      if (!credits.length) return { replyOverride: messages.listEmpty() };

      const now     = Date.now();
      const entries = credits.map((c) => ({
        studentName:  c.student.fullName,
        amount:       Number(c.amount),
        daysUntilDue: Math.ceil((c.dueDate.getTime() - now) / 86_400_000),
      }));

      return { replyOverride: messages.listFull(entries) };
    }

    // ── MARK_PAID ──────────────────────────────────────────────────────────
    case "MARK_PAID": {
      if (!vendorId) return { replyOverride: messages.noVendorAccount() };
      const { studentName } = effect.data;

      const words   = studentName.split(/\s+/).filter(Boolean);
      const credits = await prisma.credit.findMany({
        where: {
          vendorId,
          status:  { in: ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] },
          student: {
            OR: words.map((w) => ({
              fullName: { contains: w, mode: "insensitive" as const },
            })),
          },
        },
        include: { student: true },
        orderBy: { dueDate: "asc" },
        take:    1,
      });

      if (!credits.length) return { replyOverride: messages.paidNotFound(studentName) };

      const credit  = credits[0];
      const amount  = Number(credit.amount);
      const student = credit.student;
      const now     = new Date();

      const paidOnTime = now <= credit.dueDate;
      const scoreDelta = paidOnTime ? 25 : -15;
      const eventType  = paidOnTime ? "PAID_ON_TIME" : "PAID_LATE" as const;

      await prisma.credit.update({
        where: { id: credit.id },
        data:  { status: "PAID", amountRepaid: amount, closedAt: now },
      });

      await prisma.repayment.create({
        data: { creditId: credit.id, amount, method: "CASH", receivedAt: now, recordedBy: vendorId },
      });

      await prisma.creditScoreEvent.create({
        data: { studentId: student.id, vendorId, creditId: credit.id, eventType, amount, scoreDelta },
      });

      await prisma.student.update({
        where: { id: student.id },
        data:  { vodiumScore: { increment: scoreDelta }, scoreUpdatedAt: now },
      });

      return { replyOverride: messages.paidConfirmed(student.fullName, amount) };
    }

    // ── FETCH_SCORE ────────────────────────────────────────────────────────
    case "FETCH_SCORE": {
      const { studentQuery } = effect.data;
      const words = studentQuery.split(/\s+/).filter(Boolean);

      const byMatric = await prisma.student.findFirst({
        where:   { matricNumber: { equals: studentQuery, mode: "insensitive" } },
        include: { scoreEvents: { orderBy: { occurredAt: "asc" } } },
      });

      const student = byMatric ?? await prisma.student.findFirst({
        where: {
          OR: words.map((w) => ({ fullName: { contains: w, mode: "insensitive" as const } })),
          NOT: { phone: { startsWith: "pending:" } },
        },
        include: { scoreEvents: { orderBy: { occurredAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      if (!student)                    return { replyOverride: messages.scoreNotFound(studentQuery) };
      if (!student.scoreEvents.length) return { replyOverride: messages.scoreNoHistory(student.fullName) };

      const { score, summary } = computeScore(student.scoreEvents);
      return { replyOverride: messages.scoreReply(student.fullName, score, summary) };
    }

    default:
      return {};
  }
}
