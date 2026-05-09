import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  cookies().delete("vodium_phone");
  cookies().delete("vodium_admin");
  return NextResponse.json({ ok: true });
}
