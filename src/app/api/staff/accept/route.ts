import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/redis";
import { setVendorSession } from "@/lib/session";
import { ipFromRequest, writeAudit } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const rl = await rateLimit(`rl:staff-accept:${token.slice(0, 16)}`, 5, 600, true);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
  }

  const vendor = await prisma.vendor.findUnique({ where: { inviteToken: token } });
  if (!vendor) {
    return NextResponse.json({ error: "This invitation link is invalid or has already been used." }, { status: 404 });
  }
  if (vendor.inviteTokenExpiresAt && vendor.inviteTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired. Ask your manager to resend it." }, { status: 410 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      passwordHash,
      status: "ACTIVE",
      inviteToken: null,
      inviteTokenExpiresAt: null,
    },
  });

  setVendorSession(vendor.phone);

  await writeAudit({
    actorType: "vendor",
    actorId: vendor.id,
    action: "member.accepted",
    entityType: "Vendor",
    entityId: vendor.id,
    metadata: { organizationId: vendor.organizationId, email: vendor.email },
    ipAddress: ipFromRequest(req),
  });

  return NextResponse.json({ ok: true });
}
