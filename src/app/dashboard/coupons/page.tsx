import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/tenant-context";
import { CouponsClient, type CouponRow } from "@/components/ui/coupons-client";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const ctx = await requireTenantContext();
  const coupons = ctx.organizationId
    ? await prisma.couponCampaign.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(ctx.canSeeAllBranches ? {} : { OR: [{ branchId: null }, { branchId: ctx.branchId }] }),
        },
        include: { branch: true, _count: { select: { redemptions: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const rows: CouponRow[] = coupons.map((coupon) => ({
    id: coupon.id,
    name: coupon.name,
    code: coupon.code,
    branchName: coupon.branch?.name ?? null,
    type: coupon.type,
    value: Number(coupon.value),
    active: coupon.active,
    redemptions: coupon._count.redemptions,
  }));

  const branches = ctx.organization?.branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    code: branch.code,
  })) ?? [];

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <CouponsClient
        coupons={rows}
        branches={branches}
        canWrite={ctx.canWrite && Boolean(ctx.organizationId)}
        canSeeAllBranches={ctx.canSeeAllBranches}
      />
    </div>
  );
}
