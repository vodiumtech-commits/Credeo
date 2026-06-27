import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";
import { ProductsClient, type ProductRow } from "@/components/ui/products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const ctx = await requireTenantContext();
  if (!ctx.organizationId || !ctx.organization || ctx.organization.type === "SOLO_VENDOR") {
    redirect("/dashboard");
  }

  const products = await prisma.product.findMany({
    where: {
      organizationId: ctx.organizationId,
      ...(ctx.canSeeAllBranches ? {} : { OR: [{ branchId: null }, { branchId: ctx.branchId }] }),
    },
    include: { branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    active: p.active,
    bnplEligible: p.bnplEligible,
    branchId: p.branchId,
    branchName: p.branch?.name ?? null,
  }));

  const branches = ctx.organization.branches.map((b) => ({ id: b.id, name: b.name, code: b.code }));

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <ProductsClient
        products={rows}
        branches={branches}
        canWrite={ctx.canWrite}
        canSeeAllBranches={ctx.canSeeAllBranches}
        storeUrl={`https://${ctx.organization.slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vodiumledger.com"}`}
      />
    </div>
  );
}
