/**
 * Seed script — pilot data for development.
 * Run: npm run seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Vodium Ledger…");

  const unilag = await prisma.university.upsert({
    where: { name: "UNILAG" },
    update: {},
    create: {
      name: "UNILAG",
      shortName: "UNILAG",
      city: "Lagos",
      state: "Lagos",
      status: "PILOT",
    },
  });

  const vendor = await prisma.vendor.upsert({
    where: { phone: "+2348012345678" },
    update: {},
    create: {
      ownerName: "Mama T",
      businessName: "Mama T's Provisions",
      phone: "+2348012345678",
      universityId: unilag.id,
      vendorType: "PROVISION_SHOP",
      campusLocation: "Behind faculty of arts",
    },
  });

  const studentJohn = await prisma.student.upsert({
    where: { phone: "+2348011111111" },
    update: {},
    create: {
      fullName: "John Okafor",
      matricNumber: "180123456",
      phone: "+2348011111111",
      universityId: unilag.id,
      vodiumScore: 720,
    },
  });

  const studentAisha = await prisma.student.upsert({
    where: { phone: "+2348022222222" },
    update: {},
    create: {
      fullName: "Aisha Bello",
      matricNumber: "190654321",
      phone: "+2348022222222",
      universityId: unilag.id,
      vodiumScore: 480,
    },
  });

  await prisma.credit.create({
    data: {
      vendorId: vendor.id,
      studentId: studentJohn.id,
      amount: 2500,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1),
      description: "Provisions",
      status: "DUE_SOON",
    },
  });

  await prisma.credit.create({
    data: {
      vendorId: vendor.id,
      studentId: studentAisha.id,
      amount: 1500,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      description: "Lunch x3",
      status: "OUTSTANDING",
    },
  });

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
