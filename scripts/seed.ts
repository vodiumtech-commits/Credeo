/**
 * Vodium Ledger — rich seed script.
 * Creates a realistic Nigerian campus credit ecosystem for development.
 * Run: npm run seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Vodium Ledger with rich pilot data…\n");

  // ─── Universities ───────────────────────────────────────────────────────────
  const unilag = await prisma.university.upsert({
    where: { name: "University of Lagos" },
    update: {},
    create: { name: "University of Lagos", shortName: "UNILAG", city: "Lagos", state: "Lagos", status: "ACTIVE" },
  });
  const oau = await prisma.university.upsert({
    where: { name: "Obafemi Awolowo University" },
    update: {},
    create: { name: "Obafemi Awolowo University", shortName: "OAU", city: "Ile-Ife", state: "Osun", status: "ACTIVE" },
  });
  await prisma.university.upsert({
    where: { name: "University of Ibadan" },
    update: {},
    create: { name: "University of Ibadan", shortName: "UI", city: "Ibadan", state: "Oyo", status: "PILOT" },
  });
  const covenant = await prisma.university.upsert({
    where: { name: "Covenant University" },
    update: {},
    create: { name: "Covenant University", shortName: "Covenant", city: "Ota", state: "Ogun", status: "PILOT" },
  });

  console.log("✅ Universities seeded");

  // ─── Vendors ────────────────────────────────────────────────────────────────
  const seedHash = await bcrypt.hash("password123", 10);

  const mamaTaiwo = await prisma.vendor.upsert({
    where: { phone: "+2348012345678" },
    update: {},
    create: {
      ownerName: "Taiwo Adeyemi",
      businessName: "Mama Taiwo's Provisions",
      phone: "+2348012345678",
      email: "taiwo@mamataiwoprovisions.ng",
      passwordHash: seedHash,
      universityId: unilag.id,
      vendorType: "PROVISION_SHOP",
      campusLocation: "Faculty of Arts Complex, Block C",
      status: "ACTIVE",
    },
  });

  const babaWale = await prisma.vendor.upsert({
    where: { phone: "+2348023456789" },
    update: {},
    create: {
      ownerName: "Waheed Babatunde",
      businessName: "Baba Wale's Food Canteen",
      phone: "+2348023456789",
      email: "babawale@foodcanteen.ng",
      passwordHash: seedHash,
      universityId: unilag.id,
      vendorType: "FOOD_CANTEEN",
      campusLocation: "Student Union Building, Ground Floor",
      status: "ACTIVE",
    },
  });

  const fastPrint = await prisma.vendor.upsert({
    where: { phone: "+2348034567890" },
    update: {},
    create: {
      ownerName: "Emmanuel Osei",
      businessName: "FastPrint Solutions",
      phone: "+2348034567890",
      email: "emmanuel@fastprint.ng",
      passwordHash: seedHash,
      universityId: oau.id,
      vendorType: "PRINTING",
      campusLocation: "Library Road, opposite gate 1",
      status: "ACTIVE",
    },
  });

  const kayLaundry = await prisma.vendor.upsert({
    where: { phone: "+2348045678901" },
    update: {},
    create: {
      ownerName: "Kayode Babatunde",
      businessName: "Kay Laundry Services",
      phone: "+2348045678901",
      email: "kayode@kaylaundry.ng",
      passwordHash: seedHash,
      universityId: covenant.id,
      vendorType: "LAUNDRY",
      campusLocation: "Hall 4 Block B",
      status: "ACTIVE",
    },
  });

  console.log("✅ Vendors seeded");

  // ─── Subscriptions ──────────────────────────────────────────────────────────
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 42); // 42 days left in trial

  await prisma.vendorSubscription.upsert({
    where: { vendorId: mamaTaiwo.id },
    update: {},
    create: {
      vendorId: mamaTaiwo.id,
      plan: "GROWTH",
      status: "ACTIVE",
      monthlyAmount: 5000,
      currentPeriodStart: new Date("2026-04-01"),
      currentPeriodEnd: new Date("2026-04-30"),
    },
  });

  await prisma.vendorSubscription.upsert({
    where: { vendorId: babaWale.id },
    update: {},
    create: {
      vendorId: babaWale.id,
      plan: "CAMPUS_PRO",
      status: "ACTIVE",
      monthlyAmount: 10000,
      currentPeriodStart: new Date("2026-04-01"),
      currentPeriodEnd: new Date("2026-04-30"),
    },
  });

  await prisma.vendorSubscription.upsert({
    where: { vendorId: fastPrint.id },
    update: {},
    create: {
      vendorId: fastPrint.id,
      plan: "STARTER",
      status: "TRIAL",
      monthlyAmount: 2000,
      trialEndsAt: trialEnd,
    },
  });

  await prisma.vendorSubscription.upsert({
    where: { vendorId: kayLaundry.id },
    update: {},
    create: {
      vendorId: kayLaundry.id,
      plan: "STARTER",
      status: "ACTIVE",
      monthlyAmount: 2000,
      currentPeriodStart: new Date("2026-04-01"),
      currentPeriodEnd: new Date("2026-04-30"),
    },
  });

  console.log("✅ Subscriptions seeded");

  // ─── Students (UNILAG focus) ────────────────────────────────────────────────
  const students = await Promise.all([
    upsertStudent("+2348011111111", "Emeka Okonkwo",       "2018/1234", unilag.id, 820),
    upsertStudent("+2348022222222", "Chidinma Eze",        "2019/5678", unilag.id, 760),
    upsertStudent("+2348033333333", "Babatunde Adeyemi",   "2020/9012", unilag.id, 540),
    upsertStudent("+2348044444444", "Folake Ogundimu",     "2018/3456", unilag.id, 890),
    upsertStudent("+2348055555555", "Ibrahim Suleiman",    "2021/7890", unilag.id, 680),
    upsertStudent("+2348066666666", "Chiamaka Obi",        "2019/2345", unilag.id, 390),
    upsertStudent("+2348077777777", "Taiwo Adesanya",      "2020/6789", unilag.id, 510),
    upsertStudent("+2348088888888", "Kunle Adeola",        "2021/1234", unilag.id, 720),
    upsertStudent("+2348099999999", "Ngozi Okafor",        "2019/5678", unilag.id, 320),
    upsertStudent("+2348000000001", "Adaeze Nwosu",        "2020/9012", unilag.id, 670),
    upsertStudent("+2348000000002", "Segun Balogun",       "2020/4445", unilag.id, 450),
    upsertStudent("+2348000000003", "Amaka Chukwu",        "2021/1156", unilag.id, 730),
    upsertStudent("+2348000000004", "Chidi Onyekachi",     "2018/7782", unilag.id, 850),
    upsertStudent("+2348000000005", "Fatimah Abubakar",    "2022/0023", unilag.id, 500),
    upsertStudent("+2348000000006", "Olawale Oladipo",     "2019/3390", unilag.id, 600),
    // OAU students
    upsertStudent("+2348000000010", "Tunde Olawale",       "OAU/2019/101", oau.id, 710),
    upsertStudent("+2348000000011", "Yetunde Fasanya",     "OAU/2020/203", oau.id, 840),
    upsertStudent("+2348000000012", "Gbenga Adeniyi",      "OAU/2021/087", oau.id, 480),
    // Covenant students
    upsertStudent("+2348000000020", "Esther Nwachukwu",   "CU/2021/045", covenant.id, 760),
    upsertStudent("+2348000000021", "Joshua Taiwo",        "CU/2022/112", covenant.id, 690),
  ]);

  console.log(`✅ ${students.length} students seeded`);

  // ─── Credits (Mama Taiwo's book) ────────────────────────────────────────────
  const [emeka, chidinma, babatunde, folake, ibrahim, chiamaka, taiwoA, kunle, ngozi, adaeze, segun, amaka, chidi, fatimah, olawale] = students;

  const now = new Date();
  const d = (days: number) => { const dd = new Date(now); dd.setDate(dd.getDate() + days); return dd; };

  const credits = [
    // PAID credits (historical good payments)
    { vendorId: mamaTaiwo.id, studentId: emeka.id,     amount: 5500,  status: "PAID" as const,        dueDate: d(-5),  desc: "Provisions",       repaid: 5500 },
    { vendorId: mamaTaiwo.id, studentId: folake.id,    amount: 8000,  status: "PAID" as const,        dueDate: d(-2),  desc: "Weekly tab",        repaid: 8000 },
    { vendorId: mamaTaiwo.id, studentId: chidi.id,     amount: 5000,  status: "PAID" as const,        dueDate: d(-10), desc: "Monthly tab",       repaid: 5000 },
    // DUE SOON
    { vendorId: mamaTaiwo.id, studentId: emeka.id,     amount: 3500,  status: "DUE_SOON" as const,    dueDate: d(1),   desc: "Provisions",        repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: chidinma.id,  amount: 2500,  status: "DUE_SOON" as const,    dueDate: d(3),   desc: "Beverages",         repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: kunle.id,     amount: 3000,  status: "DUE_SOON" as const,    dueDate: d(4),   desc: "Groceries",         repaid: 0 },
    // OUTSTANDING
    { vendorId: mamaTaiwo.id, studentId: ibrahim.id,   amount: 1800,  status: "OUTSTANDING" as const, dueDate: d(16),  desc: "Rice + stew",       repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: taiwoA.id,    amount: 2200,  status: "OUTSTANDING" as const, dueDate: d(23),  desc: "Snacks",            repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: adaeze.id,    amount: 4500,  status: "OUTSTANDING" as const, dueDate: d(17),  desc: "Provisions",        repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: fatimah.id,   amount: 1500,  status: "OUTSTANDING" as const, dueDate: d(19),  desc: "Food items",        repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: olawale.id,   amount: 6000,  status: "OUTSTANDING" as const, dueDate: d(16),  desc: "Provisions",        repaid: 0 },
    // OVERDUE
    { vendorId: mamaTaiwo.id, studentId: babatunde.id, amount: 4200,  status: "OVERDUE" as const,     dueDate: d(-3),  desc: "Toiletries + food", repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: chiamaka.id,  amount: 5500,  status: "OVERDUE" as const,     dueDate: d(-5),  desc: "Provisions",        repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: ngozi.id,     amount: 8000,  status: "OVERDUE" as const,     dueDate: d(-10), desc: "Weekly tab",        repaid: 0 },
    { vendorId: mamaTaiwo.id, studentId: segun.id,     amount: 2800,  status: "OVERDUE" as const,     dueDate: d(-2),  desc: "Snacks + drinks",   repaid: 0 },
    // PARTIALLY PAID
    { vendorId: mamaTaiwo.id, studentId: amaka.id,     amount: 3200,  status: "PARTIALLY_PAID" as const, dueDate: d(14), desc: "Provisions",      repaid: 1500 },
  ];

  for (const c of credits) {
    await prisma.credit.create({
      data: {
        vendorId:    c.vendorId,
        studentId:   c.studentId,
        amount:      c.amount,
        dueDate:     c.dueDate,
        description: c.desc,
        status:      c.status,
        amountRepaid: c.repaid,
        closedAt:    c.status === "PAID" ? new Date() : null,
      },
    });
  }

  console.log(`✅ ${credits.length} credits seeded for Mama Taiwo's`);

  // ─── Baba Wale credits (UNILAG Food Canteen) ────────────────────────────────
  const bwCredits = [
    { studentId: emeka.id,   amount: 4500,  status: "PAID" as const,        dueDate: d(-7),  desc: "Lunch x5",     repaid: 4500 },
    { studentId: chidinma.id,amount: 2800,  status: "OUTSTANDING" as const, dueDate: d(8),   desc: "Rice + protein", repaid: 0 },
    { studentId: folake.id,  amount: 6500,  status: "PAID" as const,        dueDate: d(-1),  desc: "Weekly meals",  repaid: 6500 },
    { studentId: ngozi.id,   amount: 12000, status: "OVERDUE" as const,     dueDate: d(-15), desc: "Monthly credit",repaid: 0 },
  ];

  for (const c of bwCredits) {
    await prisma.credit.create({
      data: {
        vendorId: babaWale.id,
        studentId: c.studentId,
        amount: c.amount,
        dueDate: c.dueDate,
        description: c.desc,
        status: c.status,
        amountRepaid: c.repaid,
        closedAt: c.status === "PAID" ? new Date() : null,
      },
    });
  }

  console.log("✅ Baba Wale credits seeded");

  // ─── Score events ───────────────────────────────────────────────────────────
  const scoreEvents = [
    { studentId: emeka.id,     vendorId: mamaTaiwo.id, type: "PAID_ON_TIME" as const,     delta: 25 },
    { studentId: folake.id,    vendorId: mamaTaiwo.id, type: "PAID_ON_TIME" as const,     delta: 25 },
    { studentId: chidi.id,     vendorId: mamaTaiwo.id, type: "PAID_ON_TIME" as const,     delta: 25 },
    { studentId: babatunde.id, vendorId: mamaTaiwo.id, type: "PAID_LATE" as const,        delta: -15 },
    { studentId: ngozi.id,     vendorId: mamaTaiwo.id, type: "DEFAULTED" as const,        delta: -80 },
    { studentId: chiamaka.id,  vendorId: mamaTaiwo.id, type: "PAID_LATE" as const,        delta: -15 },
    { studentId: emeka.id,     vendorId: babaWale.id,  type: "PAID_ON_TIME" as const,     delta: 25 },
    { studentId: folake.id,    vendorId: babaWale.id,  type: "PAID_ON_TIME" as const,     delta: 25 },
  ];

  for (const e of scoreEvents) {
    await prisma.creditScoreEvent.create({
      data: {
        studentId: e.studentId,
        vendorId:  e.vendorId,
        eventType: e.type,
        scoreDelta: e.delta,
        occurredAt: d(-Math.floor(Math.random() * 30)),
      },
    });
  }

  console.log("✅ Score events seeded");

  // ─── Audit log ──────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { actorType: "vendor", actorId: mamaTaiwo.id, action: "credit.created",    entityType: "Credit",    metadata: { amount: 3500, student: "Emeka Okonkwo" } },
      { actorType: "vendor", actorId: mamaTaiwo.id, action: "repayment.recorded",entityType: "Repayment", metadata: { amount: 5500, student: "Emeka Okonkwo" } },
      { actorType: "system", actorId: null,          action: "reminder.sent",      entityType: "Credit",    metadata: { student: "Babatunde Adeyemi" } },
      { actorType: "vendor", actorId: babaWale.id,   action: "credit.created",    entityType: "Credit",    metadata: { amount: 4500, student: "Emeka Okonkwo" } },
    ],
  });

  console.log("✅ Audit log seeded");

  console.log("\n🎉 Seed complete — Vodium Ledger is ready for pilot testing.\n");
  console.log("Demo vendor login: +2348012345678 (Mama Taiwo's Provisions, UNILAG)");
}

async function upsertStudent(
  phone: string,
  fullName: string,
  matricNumber: string,
  universityId: string,
  vodiumScore: number,
) {
  return prisma.student.upsert({
    where: { phone },
    update: {},
    create: { phone, fullName, matricNumber, universityId, vodiumScore, scoreUpdatedAt: new Date() },
  });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
