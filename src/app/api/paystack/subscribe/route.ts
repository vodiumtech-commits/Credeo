import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";
import type { SubscriptionPlan } from "@prisma/client";

// Paystack plan codes — set these in your Paystack dashboard and add to .env
const PLAN_CODES: Record<SubscriptionPlan, string> = {
  STARTER:    process.env.PAYSTACK_PLAN_STARTER    ?? "",
  GROWTH:     process.env.PAYSTACK_PLAN_GROWTH     ?? "",
  PRO:        process.env.PAYSTACK_PLAN_PRO        ?? "",
};

const PLAN_AMOUNTS: Record<SubscriptionPlan, number> = {
  STARTER:    200000,  // ₦2,000 in kobo
  GROWTH:     500000,  // ₦5,000 in kobo
  PRO:        1000000, // ₦10,000 in kobo
};

const schema = z.object({
  plan: z.enum(["STARTER", "GROWTH", "PRO"]),
});

// POST /api/paystack/subscribe — initialise a Paystack transaction for plan subscription
export async function POST(req: NextRequest) {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({
    where: { phone },
    include: { subscription: true },
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const planCode = PLAN_CODES[plan];

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  // Upsert subscription record so the webhook knows which vendor to update
  const paystackCustomerId = vendor.subscription?.paystackCustomerId ?? null;

  // Initialise Paystack transaction
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?subscribed=1`;

  const body: Record<string, unknown> = {
    email: vendor.email,
    amount: PLAN_AMOUNTS[plan],
    callback_url: callbackUrl,
    metadata: {
      vendorId: vendor.id,
      plan,
      custom_fields: [
        { display_name: "Business", variable_name: "business", value: vendor.businessName },
        { display_name: "Plan",     variable_name: "plan",     value: plan },
      ],
    },
  };

  // If a Paystack plan code is configured, use subscription initialisation
  if (planCode) {
    body.plan = planCode;
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || !data.status) {
    console.error("[paystack/subscribe] Paystack error:", data);
    return NextResponse.json({ error: "Could not initiate payment. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
}
