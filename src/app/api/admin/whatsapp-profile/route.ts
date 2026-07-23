import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/session";
import { getWhatsAppProfile, syncWhatsAppProfile, VODIUM_PROFILE, type BusinessProfileInput } from "@/lib/whatsapp/profile";

export const dynamic = "force-dynamic";

// Only the super admin manages the platform bot's public identity.
const CAN_MANAGE = ["SUPER_ADMIN"];

// GET — the profile currently live on the WhatsApp number.
export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await getWhatsAppProfile();
  return NextResponse.json({ profile });
}

const setSchema = z.object({
  logoUrl: z.string().url().max(1000).optional(),
  about: z.string().max(139).optional(),
  description: z.string().max(512).optional(),
  email: z.string().email().optional(),
  address: z.string().max(256).optional(),
  websites: z.array(z.string().url()).max(2).optional(),
});

// POST — set the logo + profile fields. Empty body applies Vodium's defaults.
export async function POST(req: NextRequest) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!CAN_MANAGE.includes(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = setSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  // Merge over the branded defaults so a bare "apply" already does the right thing.
  const input: BusinessProfileInput = { ...VODIUM_PROFILE, ...parsed.data };
  const result = await syncWhatsAppProfile(input);

  if (!result.ok) {
    return NextResponse.json({ error: result.detail ?? "Could not update the profile", ...result }, { status: 502 });
  }
  return NextResponse.json(result);
}
