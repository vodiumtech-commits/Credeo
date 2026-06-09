import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorSession } from "@/lib/session";

export async function GET() {
  const vendor = await getVendorSession();
  if (!vendor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function POST(req: NextRequest) {
  // This could be used for system-generated notifications from the client
  // but usually we create them from the server.
  const vendor = await getVendorSession();
  if (!vendor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, message, type } = await req.json();

  const notification = await prisma.notification.create({
    data: {
      vendorId: vendor.id,
      title,
      message,
      type: type ?? "INFO",
    },
  });

  return NextResponse.json(notification, { status: 201 });
}
