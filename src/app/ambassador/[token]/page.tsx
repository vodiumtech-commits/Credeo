import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyAmbassadorToken } from "@/lib/bnpl-token";
import { formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * An ambassador's own scoreboard, opened from a signed link — no account needed.
 * Shows only their own numbers: never vendor names, customers or amounts owed.
 */
export default async function AmbassadorStatsPage({ params }: { params: { token: string } }) {
  const id = verifyAmbassadorToken(params.token);
  if (!id) notFound();

  const ambassador = await prisma.ambassador.findUnique({
    where: { id },
    include: { vendors: { select: { id: true } } },
  });
  if (!ambassador) notFound();

  const vendorIds = ambassador.vendors.map((v) => v.id);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totals, recent] = await Promise.all([
    vendorIds.length
      ? prisma.credit.groupBy({
          by: ["vendorId"],
          where: { vendorId: { in: vendorIds } },
          _count: { _all: true },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    vendorIds.length
      ? prisma.credit.groupBy({
          by: ["vendorId"],
          where: { vendorId: { in: vendorIds }, createdAt: { gte: weekAgo } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const activated = totals.filter((t) => t._count._all > 0).length;
  const creditsLogged = totals.reduce((s, t) => s + t._count._all, 0);
  const totalTracked = totals.reduce((s, t) => s + Number(t._sum.amount ?? 0), 0);
  const activeThisWeek = recent.length;
  const signups = vendorIds.length;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vodiumledger.com";
  const link = `${appUrl}/r/${ambassador.code}`;

  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-vodium-cream px-5 py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl border border-vodium-gold flex items-center justify-center font-serif text-vodium-gold">
            V
          </div>
          <span className="font-serif tracking-[0.14em] text-xs text-vodium-cream/60">VODIUM LEDGER</span>
        </div>

        <p className="text-xs uppercase tracking-[0.2em] text-vodium-gold">Your numbers</p>
        <h1 className="font-serif text-3xl mt-1">{ambassador.name}</h1>
        <p className="text-sm text-vodium-cream/40 mt-1">
          {ambassador.campus ? `${ambassador.campus} · ` : ""}Code <span className="text-vodium-gold">{ambassador.code}</span>
        </p>

        {/* The headline number is activation, not signups — that's what counts. */}
        <div className="mt-8 rounded-2xl border border-vodium-gold/25 bg-vodium-gold/[0.06] p-6 text-center">
          <p className="font-serif text-5xl text-vodium-gold">{activated}</p>
          <p className="text-sm text-vodium-cream/60 mt-1">vendors actively using Vodium because of you</p>
          <p className="text-xs text-vodium-cream/30 mt-2">
            out of {signups} signed up · {activeThisWeek} logged credit this week
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Box value={String(ambassador.clicks)} label="Link clicks" />
          <Box value={String(signups)} label="Vendors signed up" />
          <Box value={String(creditsLogged)} label="Credits they logged" />
          <Box value={formatNaira(totalTracked)} label="₦ tracked through them" />
        </div>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-5">
          <p className="text-xs text-vodium-cream/40 mb-2">Your referral link — share it with vendors:</p>
          <p className="font-mono text-sm text-vodium-gold break-all">{link}</p>
        </div>

        <p className="text-center text-[11px] text-vodium-cream/25 mt-6">
          Numbers update live. Keep this link private — it&rsquo;s yours.
        </p>
      </div>
    </div>
  );
}

function Box({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal px-4 py-3.5">
      <p className="font-serif text-xl text-vodium-cream">{value}</p>
      <p className="text-xs text-vodium-cream/35 mt-0.5">{label}</p>
    </div>
  );
}
