import { NextRequest, NextResponse } from "next/server";
import { resolveTenantByHost } from "@/lib/tenant-domain";

export async function GET(req: NextRequest) {
  const organization = await resolveTenantByHost(req.headers.get("host"));
  if (!organization) {
    return NextResponse.json({ organization: null });
  }

  return NextResponse.json({
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
      logoUrl: organization.logoUrl,
      brandColor: organization.brandColor,
    },
  });
}
