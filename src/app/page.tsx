import { resolveTenantByHost } from "@/lib/tenant-domain";
import MarketingLanding from "@/components/marketing-landing";
import { TenantHome } from "@/components/tenant-home";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const org = await resolveTenantByHost();

  // On a supermarket's own subdomain / verified domain, show their branded home.
  if (org && org.type !== "SOLO_VENDOR") {
    return (
      <TenantHome
        name={org.name}
        brandColor={org.brandColor}
        logoUrl={org.logoUrl}
      />
    );
  }

  // Apex domain (vodiumledger.com), localhost, www/app → Vodium marketing site.
  return <MarketingLanding />;
}
