/**
 * Vodium Ledger — custom-domain DNS verification.
 *
 * Confirms that a tenant's custom domain actually points at the platform before
 * it can be marked VERIFIED. Checks for a CNAME to Vercel (cname.vercel-dns.com)
 * or an A record at Vercel's anycast IP (76.76.21.21).
 *
 * Subdomains of our own root domain are served by the wildcard and need no DNS
 * from the tenant, so they verify automatically.
 */

import { promises as dns } from "dns";

const VERCEL_CNAME = process.env.VERCEL_CNAME_TARGET ?? "cname.vercel-dns.com";
const VERCEL_ANYCAST_IP = "76.76.21.21";

export type DnsVerifyResult = { ok: boolean; detail: string };

export async function verifyDomainDns(host: string): Promise<DnsVerifyResult> {
  const rootDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vodiumledger.com").toLowerCase();
  if (host === rootDomain || host.endsWith(`.${rootDomain}`)) {
    return { ok: true, detail: "Served by the Vodium wildcard domain — no DNS change required." };
  }

  // CNAME → Vercel
  try {
    const cnames = await dns.resolveCname(host);
    if (cnames.some((c) => c.toLowerCase().includes("vercel"))) {
      return { ok: true, detail: `CNAME points to ${cnames[0]}.` };
    }
  } catch {
    // no CNAME record — fall through to A-record check
  }

  // A record → Vercel anycast
  try {
    const ips = await dns.resolve4(host);
    if (ips.includes(VERCEL_ANYCAST_IP)) {
      return { ok: true, detail: `A record points to ${VERCEL_ANYCAST_IP}.` };
    }
    return { ok: false, detail: `Host resolves to ${ips.join(", ") || "nothing"}, not the Vodium endpoint.` };
  } catch {
    return {
      ok: false,
      detail: `No DNS found. Add a CNAME for ${host} → ${VERCEL_CNAME} (or an A record → ${VERCEL_ANYCAST_IP}).`,
    };
  }
}
