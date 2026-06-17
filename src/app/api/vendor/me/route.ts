import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";

export async function GET() {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({
    where: { phone },
    include: { subscription: true, community: true },
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  return NextResponse.json(vendor);
}

const patchSchema = z.object({
  businessName:   z.string().min(2).max(100).optional(),
  ownerName:      z.string().min(2).max(100).optional(),
  location:       z.string().min(3).max(200).optional(),
  email:          z.string().trim().email().toLowerCase().optional(),
});

export async function PATCH(req: NextRequest) {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({ where: { phone } });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.email && parsed.data.email !== vendor.email) {
    const existing = await prisma.vendor.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existing && existing.id !== vendor.id) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }
  }

  try {
    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        ...(parsed.data.businessName   && { businessName: parsed.data.businessName }),
        ...(parsed.data.ownerName      && { ownerName: parsed.data.ownerName }),
        ...(parsed.data.location && { location: parsed.data.location }),
        ...(parsed.data.email && { email: parsed.data.email }),
      },
      include: { subscription: true, community: true },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique constraint")) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }
    console.error("[vendor/me]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
