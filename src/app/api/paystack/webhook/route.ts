import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  // Fail closed — reject all traffic if secret is not configured in production.
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    console.error("[paystack/webhook] PAYSTACK_WEBHOOK_SECRET not set — rejecting all webhook traffic");
    return new NextResponse("Webhook not configured", { status: 503 });
  }

  // Verify HMAC-SHA512 signature with constant-time compare.
  const hash = crypto.createHmac("sha512", secret ?? "").update(body).digest("hex");

  // Use timingSafeEqual to prevent length-leak and timing-oracle attacks.
  const sigBuf  = Buffer.from(signature, "hex");
  const hashBuf = Buffer.from(hash, "hex");
  const sigValid =
    sigBuf.length === hashBuf.length &&
    sigBuf.length > 0 &&
    crypto.timingSafeEqual(sigBuf, hashBuf);

  if (!sigValid) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(body);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  const data = event.data ?? {};

  switch (event.event) {
    case "subscription.create": {
      const paystackCode = data.subscription_code;
      const customerId = data.customer?.id?.toString();
      const planFromMetadata = data.metadata?.plan as string | undefined;
      const nextPaymentDate = data.next_payment_date ? new Date(data.next_payment_date) : null;

      if (paystackCode && customerId) {
        const sub = await prisma.vendorSubscription.findFirst({
          where: { paystackCustomerId: customerId },
        });
        if (sub) {
          await prisma.vendorSubscription.update({
            where: { id: sub.id },
            data: {
              paystackSubscriptionCode: paystackCode,
              status: "ACTIVE",
              ...(planFromMetadata ? { plan: planFromMetadata as any } : {}),
              ...(nextPaymentDate ? { currentPeriodEnd: nextPaymentDate } : {}),
            },
          });
          await prisma.notification.create({
            data: {
              vendorId: sub.vendorId,
              title: "Subscription Active",
              message: `Your ${planFromMetadata || sub.plan} plan is now active. Thank you for choosing Vodium!`,
              type: "SUCCESS",
            },
          });
        }
      }
      break;
    }

    case "charge.success": {
      const customerId = data.customer?.id?.toString();
      const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
      const nextMonth = new Date(paidAt);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      if (customerId) {
        const sub = await prisma.vendorSubscription.findFirst({
          where: { paystackCustomerId: customerId },
        });
        if (sub) {
          await prisma.vendorSubscription.update({
            where: { id: sub.id },
            data: {
              status: "ACTIVE",
              currentPeriodStart: paidAt,
              currentPeriodEnd: nextMonth,
            },
          });
          await prisma.notification.create({
            data: {
              vendorId: sub.vendorId,
              title: "Payment Successful",
              message: "Your monthly subscription payment was processed successfully.",
              type: "SUCCESS",
            },
          });
        }
      }
      break;
    }

    case "subscription.disable": {
      const paystackCode = data.subscription_code;
      if (paystackCode) {
        const sub = await prisma.vendorSubscription.findFirst({
          where: { paystackSubscriptionCode: paystackCode },
        });
        if (sub) {
          await prisma.vendorSubscription.update({
            where: { id: sub.id },
            data: { status: "CANCELLED" },
          });
          await prisma.notification.create({
            data: {
              vendorId: sub.vendorId,
              title: "Subscription Cancelled",
              message: "Your subscription has been disabled. You'll lose access to premium features soon.",
              type: "WARNING",
            },
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const paystackCode = data.subscription?.subscription_code;
      if (paystackCode) {
        const sub = await prisma.vendorSubscription.findFirst({
          where: { paystackSubscriptionCode: paystackCode },
        });
        if (sub) {
          await prisma.vendorSubscription.update({
            where: { id: sub.id },
            data: { status: "PAST_DUE" },
          });
          await prisma.notification.create({
            data: {
              vendorId: sub.vendorId,
              title: "Payment Failed",
              message: "We couldn't process your monthly payment. Please update your billing info.",
              type: "DANGER",
            },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
