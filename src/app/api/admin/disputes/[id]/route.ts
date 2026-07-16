import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/credit-score/score";
import { sendWhatsAppMessage } from "@/lib/whatsapp/outbound";
import { getOrgChannelCredentials } from "@/lib/whatsapp/channel-token";
import { messages } from "@/lib/whatsapp/messages";

export const dynamic = "force-dynamic";

/** Super admin has oversight; customer care attends to disputes. */
const CAN_ACT = ["CUSTOMER_CARE"];

const schema = z.object({
  action: z.enum(["IN_REVIEW", "UPHELD", "REJECTED"]),
  note: z.string().trim().max(1000).optional(),
});

// POST /api/admin/disputes/[id] — attend to a dispute.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_ACT.includes(session.role)) {
      return NextResponse.json(
        { error: "Only customer care can attend to disputes." },
        { status: 403 }
      );
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const { action, note } = parsed.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id: params.id },
      include: {
        credit: true,
        student: { select: { id: true, fullName: true, phone: true } },
        vendor: { select: { id: true, businessName: true, organizationId: true } },
      },
    });
    if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    if (["UPHELD", "REJECTED"].includes(dispute.status)) {
      return NextResponse.json({ error: "This dispute is already resolved." }, { status: 409 });
    }

    const amount = Number(dispute.credit.amount);
    const isFinal = action !== "IN_REVIEW";

    if (action === "UPHELD") {
      // The credit was not this customer's. Void it and erase the score damage —
      // deleting the events (rather than writing off) so the customer's shared
      // Vodium score is not punished for someone else's debt.
      await prisma.$transaction(async (tx) => {
        await tx.creditScoreEvent.deleteMany({ where: { creditId: dispute.creditId } });
        await tx.credit.update({
          where: { id: dispute.creditId },
          data: { status: "WRITTEN_OFF", remindersEnabled: false, closedAt: new Date() },
        });
      });

      // Keep the stored score column in step with the remaining event history.
      const remaining = await prisma.creditScoreEvent.findMany({
        where: { studentId: dispute.studentId },
        orderBy: { occurredAt: "asc" },
      });
      const { score } = computeScore(remaining);
      await prisma.student.update({
        where: { id: dispute.studentId },
        data: { vodiumScore: score, scoreUpdatedAt: new Date() },
      });
    }

    if (action === "REJECTED") {
      // Credit stands — resume the reminders that were paused when it was raised.
      await prisma.credit.update({
        where: { id: dispute.creditId },
        data: { remindersEnabled: true },
      });
    }

    const updated = await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        status: action,
        resolution: note ?? dispute.resolution,
        ...(isFinal ? { handledById: session.id, handledAt: new Date() } : { handledById: session.id }),
      },
    });

    // Tell the people affected what happened.
    if (isFinal) {
      const creds = (await getOrgChannelCredentials(dispute.vendor.organizationId)) ?? undefined;
      const customerMsg =
        action === "UPHELD"
          ? messages.disputeUpheldToCustomer(dispute.vendor.businessName, amount)
          : messages.disputeRejectedToCustomer(dispute.vendor.businessName, amount);
      try {
        await sendWhatsAppMessage(dispute.student.phone, customerMsg, creds);
      } catch (err) {
        console.error("[admin/disputes] customer notify failed:", err);
      }

      await prisma.notification.create({
        data: {
          vendorId: dispute.vendor.id,
          title: action === "UPHELD" ? "Dispute Upheld" : "Dispute Rejected",
          message:
            action === "UPHELD"
              ? `${dispute.student.fullName}'s dispute was upheld. The ₦${amount.toLocaleString()} credit has been voided.`
              : `${dispute.student.fullName}'s dispute was rejected. The ₦${amount.toLocaleString()} credit stands.`,
          type: action === "UPHELD" ? "WARNING" : "INFO",
        },
      });
    }

    return NextResponse.json({ ok: true, dispute: updated });
  } catch (err) {
    console.error("[admin/disputes/:id]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
