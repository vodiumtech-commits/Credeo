import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasTenantWriteAccess, requireTenantContext } from "@/lib/tenant-context";
import { ipFromRequest, writeAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().max(600).nullish(),
  sku: z.string().max(80).nullish(),
  price: z.number().positive().optional(),
  imageUrl: z.string().url().max(600).nullish(),
  active: z.boolean().optional(),
  bnplEligible: z.boolean().optional(),
});

async function load(id: string, organizationId: string) {
  return prisma.product.findFirst({ where: { id, organizationId } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireTenantContext();
  if (!hasTenantWriteAccess(ctx) || !ctx.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const product = await load(params.id, ctx.organizationId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const json = await req.json();
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const d = parsed.data;

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      ...(d.name !== undefined ? { name: d.name.trim() } : {}),
      ...(d.description !== undefined ? { description: d.description?.trim() || null } : {}),
      ...(d.sku !== undefined ? { sku: d.sku?.trim() || null } : {}),
      ...(d.price !== undefined ? { price: d.price } : {}),
      ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl?.trim() || null } : {}),
      ...(d.active !== undefined ? { active: d.active } : {}),
      ...(d.bnplEligible !== undefined ? { bnplEligible: d.bnplEligible } : {}),
    },
  });

  await writeAudit({
    actorType: "vendor",
    actorId: ctx.vendor.id,
    action: "product.updated",
    entityType: "Product",
    entityId: product.id,
    metadata: { organizationId: ctx.organizationId, changes: d },
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json({ ok: true, product: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await requireTenantContext();
  if (!hasTenantWriteAccess(ctx) || !ctx.organizationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const product = await load(params.id, ctx.organizationId);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  await prisma.product.delete({ where: { id: product.id } });

  await writeAudit({
    actorType: "vendor",
    actorId: ctx.vendor.id,
    action: "product.deleted",
    entityType: "Product",
    entityId: product.id,
    metadata: { organizationId: ctx.organizationId, name: product.name },
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json({ ok: true });
}
