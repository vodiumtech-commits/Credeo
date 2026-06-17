import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";
import { rateLimit } from "@/lib/redis";
import { normalisePhoneNG } from "@/lib/utils";
import { getStudentLimit, isPlanActive } from "@/lib/plan";
import { nextVendorCustomerId } from "@/lib/customer-id";
import type { CreditStatus } from "@prisma/client";

// GET /api/credits?status=OVERDUE&search=emeka&page=1&limit=20
export async function GET(req: NextRequest) {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as CreditStatus | null;
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

  const where = {
    vendorId: vendor.id,
    ...(status ? { status } : {}),
    ...(search
      ? {
          student: {
            OR: [
              { fullName: { contains: search, mode: "insensitive" as const } },
              { matricNumber: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [credits, total] = await Promise.all([
    prisma.credit.findMany({
      where,
      include: { student: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.credit.count({ where }),
  ]);

  return NextResponse.json({ credits, total, page, limit });
}

const createSchema = z.object({
  customerName:   z.string().min(2).max(100),
  customerPhone:  z.string().optional(),
  amount:         z.number().positive(),
  description:    z.string().max(200).optional(),
  dueDate:        z.string().datetime(),
});

// POST /api/credits
export async function POST(req: NextRequest) {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // IP-based rate limit: 60 credits per hour per IP (prevents automated abuse)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { ok: rlOk } = await rateLimit(`rl:credits:${ip}`, 60, 3600);
  if (!rlOk) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { phone },
    include: { subscription: true },
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  // ── Subscription status check ────────────────────────────────────────────
  const sub = vendor.subscription;

  if (!isPlanActive(sub)) {
    return NextResponse.json(
      { error: "Your subscription has expired. Please renew to continue adding credits." },
      { status: 403 }
    );
  }

  const json = await req.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const { customerName, customerPhone, amount, description, dueDate } = parsed.data;

  const normalisedCustomerPhone = customerPhone ? normalisePhoneNG(customerPhone) : null;
  if (customerPhone && !normalisedCustomerPhone) {
    return NextResponse.json({ error: "Enter a valid customer WhatsApp number." }, { status: 400 });
  }
  const customerPhoneKey = normalisedCustomerPhone ?? `pending:${Date.now()}`;

  const existingVendor = await prisma.vendor.findUnique({
    where: { phone: customerPhoneKey },
    select: { businessName: true },
  });
  if (existingVendor) {
    return NextResponse.json(
      { error: "This phone number belongs to a vendor account. Use the customer's WhatsApp number." },
      { status: 409 }
    );
  }

  const existingStudent = await prisma.student.findUnique({
    where: { phone: customerPhoneKey },
  });
  const generatedCustomerId = await nextVendorCustomerId(vendor.id, vendor.businessName);
  let student = existingStudent;

  if (existingStudent) {
    if (existingStudent.fullName.trim().toLowerCase() !== customerName.trim().toLowerCase()) {
      return NextResponse.json(
        {
          error: `This phone number is already saved for ${existingStudent.fullName}. Use that customer name or enter a different phone number.`,
        },
        { status: 409 }
      );
    }

    if (!existingStudent.matricNumber) {
      student = await prisma.student.update({
        where: { id: existingStudent.id },
        data: { matricNumber: generatedCustomerId },
      });
    }
  } else {
    student = await prisma.student.create({
      data: {
        fullName: customerName,
        phone: customerPhoneKey,
        matricNumber: generatedCustomerId,
        communityId: vendor.communityId,
      },
    });
  }
  if (!student) {
    return NextResponse.json({ error: "Could not create customer" }, { status: 500 });
  }

  // ── Customer count gating (only for new customers) ─────────────────────────
  const plan = vendor.subscription?.plan ?? "STARTER";
  const customerLimit = getStudentLimit(plan);

  if (customerLimit !== null) {
    const alreadyOnBook = await prisma.credit.findFirst({
      where: { vendorId: vendor.id, studentId: student.id },
      select: { id: true },
    });
    if (!alreadyOnBook) {
      const uniqueCustomerCount = await prisma.student.count({
        where: { credits: { some: { vendorId: vendor.id } } },
      });
      if (uniqueCustomerCount >= customerLimit) {
        return NextResponse.json(
          {
            error: `You've reached the ${customerLimit}-customer limit on your ${plan} plan. Upgrade to add more customers.`,
            limitReached: true,
            plan,
            limit: customerLimit,
          },
          { status: 403 }
        );
      }
    }
  }

  const credit = await prisma.credit.create({
    data: {
      vendorId: vendor.id,
      studentId: student.id,
      amount,
      description: description ?? null,
      dueDate: new Date(dueDate),
      status: "OUTSTANDING",
    },
    include: { student: true },
  });

  // Record score event
  await prisma.creditScoreEvent.create({
    data: {
      studentId: student.id,
      vendorId: vendor.id,
      creditId: credit.id,
      eventType: "CREDIT_EXTENDED",
      amount,
      scoreDelta: 0,
    },
  });

  return NextResponse.json({ ok: true, credit }, { status: 201 });
}
