/**
 * Twilio WhatsApp webhook — POST /api/whatsapp
 *
 * Twilio sends form-encoded payloads:
 *   From: "whatsapp:+2348012345678"
 *   Body: "ADD"
 *
 * We respond with TwiML <Message> for synchronous replies.
 * Side effects run before the response so they can override the reply text.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/credit-score/score";
import { messages } from "@/lib/whatsapp/messages";
import {
  step,
  type SessionContext,
  type SideEffect,
} from "@/lib/whatsapp/state-machine";

export const runtime = "nodejs";

// ─── webhook ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const form = await req.formData();

  // 1. Validate Twilio signature in production.
  if (process.env.NODE_ENV === "production") {
    const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
    const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/whatsapp`;
    const signature  = req.headers.get("x-twilio-signature") ?? "";

    const params: Record<string, string> = {};
    form.forEach((value, key) => { params[key] = String(value); });

    if (authToken && !twilio.validateRequest(authToken, signature, webhookUrl, params)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const fromPhone = String(form.get("From") ?? "");
  const body      = String(form.get("Body") ?? "").trim();

  if (!fromPhone || !body) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // 2. Load or create session.
  const session = await prisma.whatsAppSession.upsert({
    where:  { phone: fromPhone },
    update: { lastInteractionAt: new Date() },
    create: { phone: fromPhone, state: "IDLE", context: {} },
  });

  // 3. Find vendor — by linked session ID first, then by phone.
  const vendor = session.vendorId
    ? await prisma.vendor.findUnique({ where: { id: session.vendorId } })
    : await prisma.vendor.findUnique({ where: { phone: stripPrefix(fromPhone) } });

  // 4. Run state machine.
  const sessionCtx: SessionContext = {
    state:    session.state,
    context:  (session.context as Record<string, unknown>) ?? {},
    vendorId: vendor?.id,
  };

  const result = step(sessionCtx, { body, fromPhone });

  // 5. Persist session (link vendorId if we found one).
  await prisma.whatsAppSession.update({
    where: { phone: fromPhone },
    data: {
      state:    result.nextState,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context:  { ...sessionCtx.context, ...(result.contextPatch ?? {}) } as any,
      vendorId: vendor?.id,
    },
  });

  // 6. Run side effects — each can return a reply override.
  let finalReply = result.reply;
  let linkedVendorId = vendor?.id;

  if (result.sideEffects?.length) {
    for (const effect of result.sideEffects) {
      const { replyOverride, newVendorId } = await runSideEffect(
        effect,
        fromPhone,
        vendor?.id
      );
      if (replyOverride !== undefined) finalReply = replyOverride;
      if (newVendorId)                 linkedVendorId = newVendorId;
    }

    // If CREATE_VENDOR ran, link the new vendor to this session.
    if (linkedVendorId && linkedVendorId !== vendor?.id) {
      await prisma.whatsAppSession.update({
        where: { phone: fromPhone },
        data:  { vendorId: linkedVendorId },
      });
    }
  }

  // 7. Respond with TwiML.
  return new NextResponse(twiml(finalReply), {
    status:  200,
    headers: { "Content-Type": "text/xml" },
  });
}

// Twilio pings GET to verify the endpoint exists.
export async function GET() {
  return NextResponse.json({ ok: true, service: "vodium-ledger-whatsapp" });
}

// ─── side-effect executor ─────────────────────────────────────────────────────

interface SideEffectResult {
  replyOverride?: string;
  newVendorId?:   string;
}

async function runSideEffect(
  effect:   SideEffect,
  fromPhone: string,
  vendorId?: string
): Promise<SideEffectResult> {
  switch (effect.type) {

    // ── CREATE_VENDOR ──────────────────────────────────────────────────────
    case "CREATE_VENDOR": {
      const { name, businessName, universityShortName, phone } = effect.data;

      // Avoid duplicate if vendor already registered via web.
      const normalPhone = stripPrefix(phone);
      const existing = await prisma.vendor.findUnique({ where: { phone: normalPhone } });
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

      // Resolve student — match by name under this vendor, or create.
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
        data: {
          vendorId,
          studentId: student.id,
          amount,
          dueDate,
          status: "OUTSTANDING",
        },
      });

      // Record score event: credit extended.
      await prisma.creditScoreEvent.create({
        data: {
          studentId:  student.id,
          vendorId,
          eventType:  "CREDIT_EXTENDED",
          amount,
          scoreDelta: 0,
        },
      });

      return {};
    }

    // ── FETCH_LIST ─────────────────────────────────────────────────────────
    case "FETCH_LIST": {
      const credits = await prisma.credit.findMany({
        where: {
          vendorId: effect.data.vendorId,
          status:   { in: ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] },
        },
        include:  { student: true },
        orderBy:  { dueDate: "asc" },
      });

      if (!credits.length) {
        return { replyOverride: messages.listEmpty() };
      }

      const now = Date.now();
      const entries = credits.map((c) => ({
        studentName: c.student.fullName,
        amount:      Number(c.amount),
        daysUntilDue: Math.ceil((c.dueDate.getTime() - now) / 86_400_000),
      }));

      return { replyOverride: messages.listFull(entries) };
    }

    // ── MARK_PAID ──────────────────────────────────────────────────────────
    case "MARK_PAID": {
      if (!vendorId) return { replyOverride: messages.noVendorAccount() };
      const { studentName } = effect.data;

      // Find credits for students whose name contains any word from the input.
      const words = studentName.split(/\s+/).filter(Boolean);
      const credits = await prisma.credit.findMany({
        where: {
          vendorId,
          status: { in: ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] },
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

      if (!credits.length) {
        return { replyOverride: messages.paidNotFound(studentName) };
      }

      const credit  = credits[0];
      const amount  = Number(credit.amount);
      const student = credit.student;
      const now     = new Date();

      // Determine if paid on time or late.
      const paidOnTime = now <= credit.dueDate;
      const scoreDelta = paidOnTime ? 25 : -15;
      const eventType  = paidOnTime ? "PAID_ON_TIME" : "PAID_LATE";

      // Mark credit paid.
      await prisma.credit.update({
        where: { id: credit.id },
        data:  {
          status:      "PAID",
          amountRepaid: amount,
          closedAt:    now,
        },
      });

      // Record repayment.
      await prisma.repayment.create({
        data: {
          creditId:   credit.id,
          amount,
          method:     "CASH",
          receivedAt: now,
          recordedBy: vendorId,
        },
      });

      // Record score event + update student score.
      await prisma.creditScoreEvent.create({
        data: {
          studentId:  student.id,
          vendorId,
          creditId:   credit.id,
          eventType,
          amount,
          scoreDelta,
        },
      });

      await prisma.student.update({
        where: { id: student.id },
        data:  {
          vodiumScore:    { increment: scoreDelta },
          scoreUpdatedAt: now,
        },
      });

      return { replyOverride: messages.paidConfirmed(student.fullName, amount) };
    }

    // ── FETCH_SCORE ────────────────────────────────────────────────────────
    case "FETCH_SCORE": {
      const { studentQuery } = effect.data;
      const words = studentQuery.split(/\s+/).filter(Boolean);

      // Try matric number match first.
      const byMatric = await prisma.student.findFirst({
        where: { matricNumber: { equals: studentQuery, mode: "insensitive" } },
        include: { scoreEvents: { orderBy: { occurredAt: "asc" } } },
      });

      const student = byMatric ?? await prisma.student.findFirst({
        where: {
          OR: words.map((w) => ({
            fullName: { contains: w, mode: "insensitive" as const },
          })),
          NOT: { phone: { startsWith: "pending:" } },
        },
        include: { scoreEvents: { orderBy: { occurredAt: "asc" } } },
        orderBy: { createdAt: "desc" },
      });

      if (!student) {
        return { replyOverride: messages.scoreNotFound(studentQuery) };
      }

      if (!student.scoreEvents.length) {
        return { replyOverride: messages.scoreNoHistory(student.fullName) };
      }

      const { score, summary } = computeScore(student.scoreEvents);
      return { replyOverride: messages.scoreReply(student.fullName, score, summary) };
    }

    default:
      return {};
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function stripPrefix(phone: string): string {
  return phone.replace(/^whatsapp:/, "");
}

function twiml(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

