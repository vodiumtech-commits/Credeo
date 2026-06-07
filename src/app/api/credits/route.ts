import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";
import { rateLimit } from "@/lib/redis";
import { normalisePhoneNG } from "@/lib/utils";
import { getStudentLimit, isPlanActive } from "@/lib/plan";
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
  studentName:   z.string().min(2).max(100),
  matricNumber:  z.string().optional(),
  studentPhone:  z.string().optional(),
  amount:        z.number().positive(),
  description:   z.string().max(200).optional(),
  dueDate:       z.string().datetime(),
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
  const status = sub?.status ?? "TRIAL";

  if (!isPlanActive(status)) {
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

  const { studentName, matricNumber, studentPhone, amount, description, dueDate } = parsed.data;

  // Normalise student phone if provided
  const normalisedStudentPhone =
    studentPhone ? (normalisePhoneNG(studentPhone) ?? `pending:${Date.now()}`) : `pending:${Date.now()}`;

  // Upsert student — prefer matching by phone, fall back to matric placeholder
  const student = await prisma.student.upsert({
    where: { phone: normalisedStudentPhone },
    update: {
      ...(matricNumber && { matricNumber }),
    },
    create: {
      fullName: studentName,
      phone: normalisedStudentPhone,
      matricNumber: matricNumber ?? null,
      universityId: vendor.universityId,
    },
  });

  // ── Student count gating (only for new students) ─────────────────────────
  const plan = vendor.subscription?.plan ?? "STARTER";
  const studentLimit = getStudentLimit(plan);

  if (studentLimit !== null) {
    const alreadyOnBook = await prisma.credit.findFirst({
      where: { vendorId: vendor.id, studentId: student.id },
      select: { id: true },
    });
    if (!alreadyOnBook) {
      const uniqueStudentCount = await prisma.student.count({
        where: { credits: { some: { vendorId: vendor.id } } },
      });
      if (uniqueStudentCount >= studentLimit) {
        return NextResponse.json(
          {
            error: `You've reached the ${studentLimit}-student limit on your ${plan} plan. Upgrade to add more students.`,
            limitReached: true,
            plan,
            limit: studentLimit,
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
