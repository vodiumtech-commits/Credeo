import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionPhone } from "@/lib/session";

export async function GET() {
  const phone = getSessionPhone();
  if (!phone) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await prisma.vendor.findUnique({
    where: { phone },
    include: { subscription: true, university: true },
  });
  if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  return NextResponse.json(vendor);
}

const patchSchema = z.object({
  businessName:   z.string().min(2).max(100).optional(),
  ownerName:      z.string().min(2).max(100).optional(),
  campusLocation: z.string().min(3).max(200).optional(),
  email:          z.string().email().optional(),
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

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      ...(parsed.data.businessName   && { businessName: parsed.data.businessName }),
      ...(parsed.data.ownerName      && { ownerName: parsed.data.ownerName }),
      ...(parsed.data.campusLocation && { campusLocation: parsed.data.campusLocation }),
      ...(parsed.data.email && { email: parsed.data.email }),
    },
    include: { subscription: true },
  });

  return NextResponse.json(updated);
}
