import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalisePhoneNG } from "@/lib/utils";
import type { VendorType } from "@prisma/client";

const schema = z.object({
  businessName:   z.string().min(2).max(100),
  vendorType:     z.string(),
  campusLocation: z.string().min(3).max(200),
  university:     z.string().min(2),
  ownerName:      z.string().min(2).max(100),
  phone:          z.string().min(7),
  email:          z.string().email(),
  password:       z.string().min(8, "Password must be at least 8 characters"),
});

const UNI_META: Record<string, { city: string; state: string }> = {
  UNILAG:   { city: "Lagos",        state: "Lagos" },
  OAU:      { city: "Ile-Ife",      state: "Osun" },
  UI:       { city: "Ibadan",       state: "Oyo" },
  COVENANT: { city: "Ota",          state: "Ogun" },
  FUTA:     { city: "Akure",        state: "Ondo" },
  LASU:     { city: "Lagos",        state: "Lagos" },
  UNIBEN:   { city: "Benin City",   state: "Edo" },
  ABU:      { city: "Zaria",        state: "Kaduna" },
  UNN:      { city: "Nsukka",       state: "Enugu" },
  UNILORIN: { city: "Ilorin",       state: "Kwara" },
  BABCOCK:  { city: "Ilishan-Remo", state: "Ogun" },
  PAU:      { city: "Lagos",        state: "Lagos" },
};

function parseUniversity(raw: string) {
  const match = raw.match(/\(([^)]+)\)$/);
  const shortName = match ? match[1] : raw.split(" ").map((w) => w[0]).join("").toUpperCase();
  const name = raw.replace(/\s*\([^)]*\)$/, "").trim() || raw;
  const meta = UNI_META[shortName] ?? { city: "Nigeria", state: "Nigeria" };
  return { name, shortName, ...meta };
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { businessName, vendorType, campusLocation, university, ownerName, phone, email, password } =
    parsed.data;

  const normalisedPhone = normalisePhoneNG(phone);
  if (!normalisedPhone) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Check for existing account
  const existing = await prisma.vendor.findFirst({
    where: { OR: [{ email }, { phone: normalisedPhone }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email or phone already exists. Please log in." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const uniMeta = parseUniversity(university);

  const uni = await prisma.university.upsert({
    where: { name: uniMeta.name },
    update: {},
    create: {
      name:      uniMeta.name,
      shortName: uniMeta.shortName,
      city:      uniMeta.city,
      state:     uniMeta.state,
      status:    "PILOT",
    },
  });

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 60);

  const vendor = await prisma.vendor.create({
    data: {
      businessName,
      ownerName,
      phone:        normalisedPhone,
      email,
      passwordHash,
      vendorType:   (vendorType as VendorType) ?? "OTHER",
      universityId: uni.id,
      campusLocation,
      status:       "ACTIVE",
      subscription: {
        create: {
          plan:          "STARTER",
          status:        "TRIAL",
          trialEndsAt,
          monthlyAmount: 2000,
        },
      },
    },
  });

  // Set session cookie immediately after registration
  cookies().set("vodium_phone", normalisedPhone, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 30,
    path:     "/",
  });

  return NextResponse.json({ ok: true, vendorId: vendor.id });
}
