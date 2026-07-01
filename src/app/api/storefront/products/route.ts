import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantByHost } from "@/lib/tenant-domain";

// Public: list a store's BNPL-eligible products, resolved by host.
export async function GET(req: NextRequest) {
  const org = await resolveTenantByHost(req.headers.get("host"));
  if (!org || org.type === "SOLO_VENDOR") {
    return NextResponse.json({ organization: null, products: [] });
  }

  const products = await prisma.product.findMany({
    where: { organizationId: org.id, active: true, bnplEligible: true },
    select: { id: true, name: true, description: true, price: true, imageUrl: true, imageUrls: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    organization: { id: org.id, name: org.name, brandColor: org.brandColor, logoUrl: org.logoUrl },
    products: products.map((p) => ({ ...p, price: Number(p.price) })),
  });
}
