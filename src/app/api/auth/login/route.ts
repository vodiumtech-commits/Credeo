import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const vendor = await prisma.vendor.findUnique({ where: { email } });

  // Use a constant-time comparison even on "not found" to prevent user enumeration
  const hash = vendor?.passwordHash ?? "$2a$12$invalidhashpadding000000000000000000000000000000000000";
  const match = await bcrypt.compare(password, hash);

  if (!vendor || !match) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }

  cookies().set("vodium_phone", vendor.phone, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  const adminPhones = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (adminPhones.includes(vendor.phone) && process.env.ADMIN_SECRET) {
    cookies().set("vodium_admin", process.env.ADMIN_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }

  return NextResponse.json({ ok: true });
}
