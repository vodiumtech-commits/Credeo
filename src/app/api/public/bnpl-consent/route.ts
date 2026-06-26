import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import { verifyOrderToken } from "@/lib/bnpl-token";
import { ipFromRequest, writeAudit } from "@/lib/audit";

const schema = z.object({ token: z.string().min(10).max(400) });

// POST /api/public/bnpl-consent — customer accepts the BNPL terms for their order.
// Public (no login): authorized by the unguessable signed order token.
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const orderId = verifyOrderToken(parsed.data.token);
  if (!orderId) {
    return NextResponse.json({ error: "This link is invalid or has expired." }, { status: 404 });
  }

  const rl = await rateLimit(`rl:bnpl-consent:${orderId}`, 10, 600);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment." }, { status: 429 });
  }

  const order = await prisma.bnplOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.termsAcceptedAt) {
    return NextResponse.json({ ok: true, alreadyAccepted: true, acceptedAt: order.termsAcceptedAt });
  }

  const acceptedAt = new Date();
  await prisma.bnplOrder.update({
    where: { id: order.id },
    data: { termsAcceptedAt: acceptedAt },
  });

  await writeAudit({
    actorType: "system",
    actorId: order.studentId,
    action: "bnpl.consent_accepted",
    entityType: "BnplOrder",
    entityId: order.id,
    metadata: {
      organizationId: order.organizationId,
      orderNumber: order.orderNumber,
      totalAmount: Number(order.totalAmount),
      channel: "customer_web",
    },
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json({ ok: true, acceptedAt });
}
