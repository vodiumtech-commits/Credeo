import { NextResponse } from "next/server";
import { sendNewsletterWelcome } from "@/lib/email/newsletter";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    await sendNewsletterWelcome(email.trim().toLowerCase());

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });
  }
}
