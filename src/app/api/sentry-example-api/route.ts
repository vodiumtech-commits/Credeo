import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  Sentry.logger.info("Sentry example API called");
  throw new SentryExampleAPIError(
    "This error is raised on the backend called by the example page.",
  );
}
