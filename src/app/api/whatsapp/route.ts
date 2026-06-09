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
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/credit-score/score";
import { messages } from "@/lib/whatsapp/messages";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import { parseUniversity } from "@/lib/university";
import {
  step,
  type SessionContext,
  type SideEffect,
} from "@/lib/whatsapp/state-machine";

export const runtime = "nodejs";

// ── Meta webhook payload types ────────────────────────────────────────────────

interface MetaTextMessage {
  from:      string;   // E.164 without "+"
  id:        string;
  timestamp: string;
  type:      "text" | string;
  text?:     { body: string };
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
  } else {
    console.warn("[whatsapp] WHATSAPP_APP_SECRET not set — skipping signature check. Set it in Vercel.");
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

  // Silently ack status updates, delivery receipts, etc.
  if (!message || message.type !== "text" || !message.text?.body) {
    return NextResponse.json({ ok: true });
  }

  const fromPhone   = `+${message.from}`;   // Meta sends without "+", normalise to E.164
  const messageText = message.text.body.trim();

  console.log(`[whatsapp] ← ${fromPhone}: "${messageText}"`);

  // ── Process message (wrapped so errors never escape) ────────────────────────
  try {
    // Load or create session
    const session = await prisma.whatsAppSession.upsert({
      where:  { phone: fromPhone },
      update: { lastInteractionAt: new Date() },
      create: { phone: fromPhone, state: "IDLE", context: {} },
    });

    // Resolve vendor — restrict BOT to registered vendors only
    const vendor = session.vendorId
      ? await prisma.vendor.findUnique({ where: { id: session.vendorId } })
      : await prisma.vendor.findUnique({ where: { phone: fromPhone } });

    if (!vendor) {
      console.log(`[whatsapp] Rejected: unregistered user ${fromPhone}`);
      await sendWhatsAppMessage(
        fromPhone,
        "You are not registered as a vendor on Vodium Ledger. Please sign up at vodium.ng or contact support."
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
    await prisma.whatsAppSession.update({
      where: { phone: fromPhone },
      data: {
        state:   result.nextState,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context: { ...sessionCtx.context, ...(result.contextPatch ?? {}) } as any,
        vendorId: vendor?.id,
      },
    });

    // Side effects
    let finalReply     = result.reply;
    let linkedVendorId = vendor?.id;

    if (result.sideEffects?.length) {
      for (const effect of result.sideEffects) {
        const { replyOverride, newVendorId } = await runSideEffect(effect, fromPhone, vendor?.id);
        if (replyOverride !== undefined) finalReply    = replyOverride;
        if (newVendorId)                 linkedVendorId = newVendorId;
      }
      if (linkedVendorId && linkedVendorId !== vendor?.id) {
        await prisma.whatsAppSession.update({
          where: { phone: fromPhone },
          data:  { vendorId: linkedVendorId },
        });
      }
    }

    console.log(`[whatsapp] → ${fromPhone}: "${finalReply.slice(0, 80)}..."`);

    // Send reply
    await sendWhatsAppMessage(fromPhone, finalReply);

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
  newVendorId?:   string;
}

async function runSideEffect(
  effect:    SideEffect,
  fromPhone: string,
  vendorId?: string
): Promise<SideEffectResult> {
  switch (effect.type) {

    case "CREATE_VENDOR": {
      const { name, businessName, universityShortName, phone } = effect.data;
      const normalPhone = phone.startsWith("+") ? phone : `+${phone}`;
      const existing    = await prisma.vendor.findUnique({ where: { phone: normalPhone } });
      if (existing) return { newVendorId: existing.id };

      const uniMeta    = parseUniversity(universityShortName);
      const university = await prisma.university.upsert({
        where:  { name: uniMeta.name },
        update: {},
        create: { name: uniMeta.name, shortName: uniMeta.shortName ?? null, city: uniMeta.city, state: uniMeta.state, status: "PILOT" },
      });

      const placeholderEmail = `${normalPhone.replace("+", "")}@wa.vodiumledger.com`;
      const placeholderHash  = `$2a$12$whatsapp${crypto.randomBytes(16).toString("hex")}`;
      const trialEndsAt      = new Date(Date.now() + 60 * 86_400_000);

      const newVendor = await prisma.vendor.create({
        data: {
          ownerName: name, businessName, phone: normalPhone,
          email: placeholderEmail, passwordHash: placeholderHash,
          universityId: university.id, vendorType: "OTHER", status: "ACTIVE",
          subscription: { create: { plan: "STARTER", status: "TRIAL", trialEndsAt, monthlyAmount: 2000 } },
        },
      });
      return { newVendorId: newVendor.id };
    }

    case "CREATE_CREDIT": {
      if (!vendorId) return {};
      const { studentName, matric, amount, dueInDays } = effect.data;
      const pendingPhone = `pending:${studentName.toLowerCase().replace(/\s+/g, "-")}`;
      const student = await prisma.student.upsert({
        where:  { phone: pendingPhone },
        update: {},
        create: { fullName: studentName, phone: pendingPhone, ...(matric && { matricNumber: matric }) },
      });
      const dueDate = new Date(Date.now() + dueInDays * 86_400_000);
      await prisma.credit.create({ data: { vendorId, studentId: student.id, amount, dueDate, status: "OUTSTANDING" } });
      await prisma.creditScoreEvent.create({ data: { studentId: student.id, vendorId, eventType: "CREDIT_EXTENDED", amount, scoreDelta: 0 } });
      return {};
    }

    case "FETCH_LIST": {
      const credits = await prisma.credit.findMany({
        where: { vendorId: effect.data.vendorId, status: { in: ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] } },
        include: { student: true },
        orderBy: { dueDate: "asc" },
      });
      if (!credits.length) return { replyOverride: messages.listEmpty() };
      const now = Date.now();
      return { replyOverride: messages.listFull(credits.map((c) => ({ studentName: c.student.fullName, amount: Number(c.amount), daysUntilDue: Math.ceil((c.dueDate.getTime() - now) / 86_400_000) }))) };
    }

    case "MARK_PAID": {
      if (!vendorId) return { replyOverride: messages.noVendorAccount() };
      const { studentName } = effect.data;
      const words   = studentName.split(/\s+/).filter(Boolean);
      const credits = await prisma.credit.findMany({
        where: { vendorId, status: { in: ["OUTSTANDING", "DUE_SOON", "OVERDUE", "PARTIALLY_PAID"] }, student: { OR: words.map((w) => ({ fullName: { contains: w, mode: "insensitive" as const } })) } },
        include: { student: true }, orderBy: { dueDate: "asc" }, take: 1,
      });
      if (!credits.length) return { replyOverride: messages.paidNotFound(studentName) };
      const credit  = credits[0];
      const amount  = Number(credit.amount);
      const student = credit.student;
      const now     = new Date();
      const paidOnTime = now <= credit.dueDate;
      const scoreDelta = paidOnTime ? 25 : -15;
      const eventType  = paidOnTime ? "PAID_ON_TIME" : "PAID_LATE" as const;
      await prisma.credit.update({ where: { id: credit.id }, data: { status: "PAID", amountRepaid: amount, closedAt: now } });
      await prisma.repayment.create({ data: { creditId: credit.id, amount, method: "CASH", receivedAt: now, recordedBy: vendorId } });
      await prisma.creditScoreEvent.create({ data: { studentId: student.id, vendorId, creditId: credit.id, eventType, amount, scoreDelta } });
      const newScore = Math.min(1000, Math.max(0, (student.vodiumScore ?? 500) + scoreDelta));
      await prisma.student.update({ where: { id: student.id }, data: { vodiumScore: newScore, scoreUpdatedAt: now } });
      return { replyOverride: messages.paidConfirmed(student.fullName, amount) };
    }

    case "FETCH_SCORE": {
      const { studentQuery, fromPhone } = effect.data;
      const words = studentQuery.split(/\s+/).filter(Boolean);
      const byMatric = await prisma.student.findFirst({ where: { matricNumber: { equals: studentQuery, mode: "insensitive" } }, include: { scoreEvents: { orderBy: { occurredAt: "asc" } } } });
      const student = byMatric ?? await prisma.student.findFirst({ where: { OR: words.map((w) => ({ fullName: { contains: w, mode: "insensitive" as const } })), NOT: { phone: { startsWith: "pending:" } } }, include: { scoreEvents: { orderBy: { occurredAt: "asc" } } }, orderBy: { createdAt: "desc" } });
      if (!student)                    return { replyOverride: messages.scoreNotFound(studentQuery) };
      if (!student.scoreEvents.length) return { replyOverride: messages.scoreNoHistory(student.fullName) };

      // Capture student's WhatsApp phone for reminders (only if phone is pending or not set)
      if (student.phone?.startsWith("pending:")) {
        await prisma.student.update({
          where: { id: student.id },
          data: { phone: fromPhone },
        });
      }

      const { score, summary } = computeScore(student.scoreEvents);
      return { replyOverride: messages.scoreReply(student.fullName, score, summary) };
    }

    default:
      return {};
  }
}
