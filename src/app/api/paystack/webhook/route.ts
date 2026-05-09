import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? "";

  // Verify HMAC-SHA512 signature
  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature) {
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
      // data.customer.email or data.plan.name may help identify vendor
      const paystackCode = data.subscription_code;
      const customerId = data.customer?.id?.toString();
      const planCode = data.plan?.plan_code;
      const nextPaymentDate = data.next_payment_date ? new Date(data.next_payment_date) : null;

      if (paystackCode && customerId) {
        await prisma.vendorSubscription.updateMany({
          where: { paystackCustomerId: customerId },
          data: {
            paystackSubscriptionCode: paystackCode,
            status: "ACTIVE",
            ...(nextPaymentDate ? { currentPeriodEnd: nextPaymentDate } : {}),
          },
        });
      }
      break;
    }

    case "charge.success": {
      const customerId = data.customer?.id?.toString();
      const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
      const nextMonth = new Date(paidAt);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      if (customerId) {
        await prisma.vendorSubscription.updateMany({
          where: { paystackCustomerId: customerId },
          data: {
            status: "ACTIVE",
            currentPeriodStart: paidAt,
            currentPeriodEnd: nextMonth,
          },
        });
      }
      break;
    }

    case "subscription.disable": {
      const paystackCode = data.subscription_code;
      if (paystackCode) {
        await prisma.vendorSubscription.updateMany({
          where: { paystackSubscriptionCode: paystackCode },
          data: { status: "CANCELLED" },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const paystackCode = data.subscription?.subscription_code;
      if (paystackCode) {
        await prisma.vendorSubscription.updateMany({
          where: { paystackSubscriptionCode: paystackCode },
          data: { status: "PAST_DUE" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ ok: true });
}
