import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { normaliseAmbassadorCode } from "@/lib/referral";
import { signAmbassadorToken } from "@/lib/bnpl-token";

export const dynamic = "force-dynamic";

const CAN_VIEW = ["SUPER_ADMIN", "MARKETING"];

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(3).max(16),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  campus: z.string().trim().max(80).optional(),
  stipend: z.number().min(0).max(10_000_000).optional(),
  notes: z.string().trim().max(500).optional(),
});

/**
 * The ambassador funnel. Appraisal hangs on *activation* — vendors who actually
 * log credit — not raw signups, so every stage is returned per ambassador.
 */
export async function GET() {
  try {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_VIEW.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ambassadors = await prisma.ambassador.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { vendors: { select: { id: true, businessName: true, createdAt: true } } },
    });

    const vendorIds = ambassadors.flatMap((a) => a.vendors.map((v) => v.id));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // One aggregate for lifetime totals, one for "still active this week".
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

    const totalsByVendor = new Map(totals.map((t) => [t.vendorId, t]));
    const activeVendorIds = new Set(recent.map((r) => r.vendorId));

    const rows = ambassadors.map((a) => {
      const signups = a.vendors.length;
      let activated = 0;
      let creditsLogged = 0;
      let totalTracked = 0;
      let activeThisWeek = 0;

      for (const v of a.vendors) {
        const t = totalsByVendor.get(v.id);
        if (t && t._count._all > 0) {
          activated++;
          creditsLogged += t._count._all;
          totalTracked += Number(t._sum.amount ?? 0);
        }
        if (activeVendorIds.has(v.id)) activeThisWeek++;
      }

      return {
        id: a.id,
        name: a.name,
        code: a.code,
        phone: a.phone,
        email: a.email,
        campus: a.campus,
        stipend: a.stipend ? Number(a.stipend) : null,
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt,
        statsToken: signAmbassadorToken(a.id),
        funnel: {
          clicks: a.clicks,
          signups,
          activated,
          creditsLogged,
          totalTracked,
          activeThisWeek,
          // Of the vendors they signed, how many actually use the product.
          activationRate: signups ? Math.round((activated / signups) * 100) : 0,
          // What each signed-up vendor costs against their monthly stipend.
          costPerSignup: a.stipend && signups ? Math.round(Number(a.stipend) / signups) : null,
        },
      };
    });

    const totalsAll = rows.reduce(
      (acc, r) => ({
        clicks: acc.clicks + r.funnel.clicks,
        signups: acc.signups + r.funnel.signups,
        activated: acc.activated + r.funnel.activated,
        creditsLogged: acc.creditsLogged + r.funnel.creditsLogged,
        totalTracked: acc.totalTracked + r.funnel.totalTracked,
      }),
      { clicks: 0, signups: 0, activated: 0, creditsLogged: 0, totalTracked: 0 }
    );

    return NextResponse.json({ ambassadors: rows, totals: totalsAll });
  } catch (err) {
    console.error("[admin/ambassadors]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/admin/ambassadors — add a campus rep and mint their link.
export async function POST(req: NextRequest) {
  try {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_VIEW.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const code = normaliseAmbassadorCode(parsed.data.code);
    if (!code) {
      return NextResponse.json(
        { error: "Codes are 3–16 characters: letters, numbers or dashes (e.g. TUNDE)." },
        { status: 400 }
      );
    }

    const clash = await prisma.ambassador.findUnique({ where: { code }, select: { id: true } });
    if (clash) return NextResponse.json({ error: `The code ${code} is already taken.` }, { status: 409 });

    const ambassador = await prisma.ambassador.create({
      data: {
        name: parsed.data.name,
        code,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        campus: parsed.data.campus || null,
        stipend: parsed.data.stipend ?? null,
        notes: parsed.data.notes || null,
      },
    });

    return NextResponse.json({ ok: true, ambassador }, { status: 201 });
  } catch (err) {
    console.error("[admin/ambassadors] create", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
