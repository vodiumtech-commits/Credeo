import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeHost } from "@/lib/tenant-domain";
import { hasOrgAdminAccess, requireTenantContext } from "@/lib/tenant-context";
import { ipFromRequest, writeAudit } from "@/lib/audit";

const domainSchema = z.object({
  host: z.string().min(3).max(253),
  status: z.enum(["PENDING", "VERIFIED", "DISABLED"]).default("PENDING"),
});

export async function GET() {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId) return NextResponse.json({ domains: [] });

  const domains = await prisma.tenantDomain.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ domains });
}

export async function POST(req: NextRequest) {
  const ctx = await requireTenantContext();
  if (!hasOrgAdminAccess(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = domainSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const host = normalizeHost(parsed.data.host);
  if (!host || !/^[a-z0-9.-]+$/.test(host) || !host.includes(".")) {
    return NextResponse.json({ error: "Enter a valid domain or subdomain." }, { status: 400 });
  }

  try {
    const domain = await prisma.tenantDomain.create({
      data: {
        organizationId: ctx.organizationId!,
        host,
        status: parsed.data.status,
        verifiedAt: parsed.data.status === "VERIFIED" ? new Date() : null,
      },
    });

    await writeAudit({
      actorType: "vendor",
      actorId: ctx.vendor.id,
      action: "tenant.domain_added",
      entityType: "TenantDomain",
      entityId: domain.id,
      metadata: {
        organizationId: ctx.organizationId,
        host: domain.host,
        status: domain.status,
      },
      ipAddress: ipFromRequest(req),
    });

    return NextResponse.json({ ok: true, domain }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error && err.message.includes("Unique")
      ? "This domain is already connected."
      : "Could not add domain.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
