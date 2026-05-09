/**
 * Twilio WhatsApp webhook.
 *
 * POST /api/whatsapp
 * Twilio sends form-encoded payloads:
 *   From: "whatsapp:+2348012345678"
 *   Body: "ADD"
 *
 * We respond with TwiML <Message> for synchronous replies.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { step, type SessionContext, type SideEffect } from "@/lib/whatsapp/state-machine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const fromPhone = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "");

  if (!fromPhone || !body) {
    return new NextResponse("Bad request", { status: 400 });
  }

  // 1. Load or create session.
  const session = await prisma.whatsAppSession.upsert({
    where: { phone: fromPhone },
    update: { lastInteractionAt: new Date() },
    create: { phone: fromPhone, state: "IDLE", context: {} },
  });

  const vendor = session.vendorId
    ? await prisma.vendor.findUnique({ where: { id: session.vendorId } })
    : await prisma.vendor.findUnique({ where: { phone: stripWhatsAppPrefix(fromPhone) } });

  // 2. Run state machine.
  const sessionCtx: SessionContext = {
    state: session.state,
    context: (session.context as Record<string, any>) ?? {},
    vendorId: vendor?.id,
  };

  const result = step(sessionCtx, { body, fromPhone });

  // 3. Persist session state.
  await prisma.whatsAppSession.update({
    where: { phone: fromPhone },
    data: {
      state: result.nextState,
      context: { ...sessionCtx.context, ...(result.contextPatch ?? {}) },
      vendorId: vendor?.id,
    },
  });

  // 4. Run any side effects (DB writes).
  if (result.sideEffects?.length) {
    for (const effect of result.sideEffects) {
      await runSideEffect(effect, fromPhone);
    }
  }

  // 5. Respond with TwiML.
  return new NextResponse(twiml(result.reply), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

// ─── helpers ─────────────────────────────────────────

function stripWhatsAppPrefix(phone: string): string {
  return phone.replace(/^whatsapp:/, "");
}

function twiml(message: string): string {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
}

async function runSideEffect(effect: SideEffect, fromPhone: string) {
  switch (effect.type) {
    case "CREATE_VENDOR": {
      const { name, businessName, universityShortName, phone } = effect.data;
      const university = await prisma.university.upsert({
        where: { name: universityShortName },
        update: {},
        create: {
          name: universityShortName,
          shortName: universityShortName,
          city: "Unknown",
          state: "Unknown",
          status: "PILOT",
        },
      });
      await prisma.vendor.create({
        data: {
          ownerName: name,
          businessName,
          phone: stripWhatsAppPrefix(phone),
          universityId: university.id,
          vendorType: "OTHER",
        },
      });
      break;
    }

    case "CREATE_CREDIT": {
      const { vendorId, studentName, amount, dueInDays } = effect.data;
      // Resolve or create student by name (rough — refine in v2 with matric+phone).
      const student = await prisma.student.upsert({
        where: { phone: `pending:${studentName.toLowerCase().replace(/\s+/g, "-")}` },
        update: {},
        create: {
          fullName: studentName,
          phone: `pending:${studentName.toLowerCase().replace(/\s+/g, "-")}`,
        },
      });
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);
      await prisma.credit.create({
        data: {
          vendorId,
          studentId: student.id,
          amount,
          dueDate,
          status: "OUTSTANDING",
        },
      });
      break;
    }

    // Other effects (FETCH_LIST, FETCH_SCORE, MARK_PAID) wired in v2.
    default:
      break;
  }
}

// Twilio also pings GET to verify the endpoint exists.
export async function GET() {
  return NextResponse.json({ ok: true, service: "vodium-ledger-whatsapp" });
}
