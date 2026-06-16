import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";
import { activateSubscriptionFromPaystackData, type PaystackPaymentData } from "@/lib/paystack/subscription";

type PaystackVerifyResponse = {
  status?: boolean;
  data?: PaystackPaymentData;
  message?: string;
};

export async function GET(req: NextRequest) {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reference = req.nextUrl.searchParams.get("reference")?.trim();
  if (!reference) {
    return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { phone },
    include: { subscription: true },
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  const result = (await res.json()) as PaystackVerifyResponse;

  if (!res.ok || !result.status || !result.data) {
    console.error("[paystack/verify] Paystack error:", result);
    return NextResponse.json({ error: "Payment could not be confirmed" }, { status: 502 });
  }

  const verified = await activateSubscriptionFromPaystackData(vendor.id, result.data);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: verified.status });
  }

  return NextResponse.json({ ok: true, plan: verified.plan });
}
