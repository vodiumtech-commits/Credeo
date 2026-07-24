import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { listOtpTemplates, ensureOtpTemplate } from "@/lib/whatsapp/otp-template";

export const dynamic = "force-dynamic";

// Same bar as the bot profile: only the super admin touches the platform's
// Meta configuration.
const CAN_MANAGE = ["SUPER_ADMIN"];

// GET — which template OTP sending will use, and whether it exists/is approved.
export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await listOtpTemplates());
}

// POST — create the OTP template if missing. Idempotent: an existing template
// is reported untouched, so this can never break a working setup.
export async function POST() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await ensureOtpTemplate();
  if (result.detail && !result.active) {
    return NextResponse.json({ error: result.detail, ...result }, { status: 502 });
  }
  return NextResponse.json(result);
}
