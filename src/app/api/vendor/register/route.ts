import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalisePhoneNG } from "@/lib/utils";
import type { VendorType } from "@prisma/client";

const schema = z.object({
  businessName: z.string().min(2).max(100),
  vendorType: z.string(),
  campusLocation: z.string().min(3).max(200),
  university: z.string().min(2),
  ownerName: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")),
});

// Map display university name → city/state
const UNI_META: Record<string, { city: string; state: string }> = {
  UNILAG:   { city: "Lagos",      state: "Lagos" },
  OAU:      { city: "Ile-Ife",   state: "Osun" },
  UI:       { city: "Ibadan",    state: "Oyo" },
  COVENANT: { city: "Ota",       state: "Ogun" },
  FUTA:     { city: "Akure",     state: "Ondo" },
  LASU:     { city: "Lagos",     state: "Lagos" },
  UNIBEN:   { city: "Benin City",state: "Edo" },
  ABU:      { city: "Zaria",     state: "Kaduna" },
  UNN:      { city: "Nsukka",    state: "Enugu" },
  UNILORIN: { city: "Ilorin",    state: "Kwara" },
  BABCOCK:  { city: "Ilishan-Remo", state: "Ogun" },
  PAU:      { city: "Lagos",     state: "Lagos" },
};

function parseUniversity(raw: string): { name: string; shortName: string; city: string; state: string } {
  // e.g. "University of Lagos (UNILAG)"
  const match = raw.match(/\(([^)]+)\)$/);
  const shortName = match ? match[1] : raw.split(" ").map((w) => w[0]).join("").toUpperCase();
  const name = raw.replace(/\s*\([^)]*\)$/, "").trim() || raw;
  const meta = UNI_META[shortName] ?? { city: "Nigeria", state: "Nigeria" };
  return { name, shortName, ...meta };
}

export async function POST(req: NextRequest) {
  const phone = cookies().get("vodium_phone")?.value;
  if (!phone) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const { businessName, vendorType, campusLocation, university, ownerName, email } = parsed.data;

  // If vendor already exists for this phone, treat as login
  const existing = await prisma.vendor.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyExists: true, vendorId: existing.id });
  }

  const uniMeta = parseUniversity(university);

  const uni = await prisma.university.upsert({
    where: { name: uniMeta.name },
    update: {},
    create: {
      name: uniMeta.name,
      shortName: uniMeta.shortName,
      city: uniMeta.city,
      state: uniMeta.state,
      status: "PILOT",
    },
  });

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 60);

  const vendor = await prisma.vendor.create({
    data: {
      businessName,
      ownerName,
      phone,
      email: email || null,
      vendorType: (vendorType as VendorType) ?? "OTHER",
      universityId: uni.id,
      campusLocation,
      status: "ACTIVE",
      subscription: {
        create: {
          plan: "STARTER",
          status: "TRIAL",
          trialEndsAt,
          monthlyAmount: 2000,
        },
      },
    },
    include: { subscription: true },
  });

  return NextResponse.json({ ok: true, alreadyExists: false, vendorId: vendor.id });
}
