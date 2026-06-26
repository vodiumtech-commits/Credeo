import { headers } from "next/headers";
import { normalizeHost, resolveTenantByHost } from "@/lib/tenant-domain";
import MarketingLanding from "@/components/marketing-landing";
import { TenantHome } from "@/components/tenant-home";

export const dynamic = "force-dynamic";

const ROOT = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vodiumledger.com").toLowerCase();
const RESERVED = new Set([ROOT, `www.${ROOT}`, `app.${ROOT}`, "localhost"]);

export default async function HomePage() {
  const host = normalizeHost(headers().get("host"));

  // Apex / www / app / localhost → Vodium marketing site, no DB lookup needed.
  if (!host || RESERVED.has(host)) {
    return <MarketingLanding />;
  }

  // Tenant host: resolve the org, but never let a slow/unreachable DB hang the
  // page — fall back to the marketing site within a short budget.
  let org: Awaited<ReturnType<typeof resolveTenantByHost>> = null;
  try {
    org = await Promise.race([
      resolveTenantByHost(host),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
  } catch {
    org = null;
  }

  if (org && org.type !== "SOLO_VENDOR") {
    return <TenantHome name={org.name} brandColor={org.brandColor} logoUrl={org.logoUrl} />;
  }

  return <MarketingLanding />;
}
