import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export function normalizeHost(host: string | null): string | null {
  if (!host) return null;
  return host.split(":")[0]?.trim().toLowerCase() || null;
}

export async function resolveTenantByHost(host?: string | null) {
  const normalized = normalizeHost(host ?? headers().get("host"));
  if (!normalized) return null;

  const domain = await prisma.tenantDomain.findUnique({
    where: { host: normalized },
    include: { organization: true },
  });
  if (domain?.status === "VERIFIED") return domain.organization;

  const rootDomain = normalizeHost(process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vodiumledger.com");
  if (rootDomain && normalized.endsWith(`.${rootDomain}`)) {
    const slug = normalized.slice(0, -(rootDomain.length + 1));
    if (slug && !["www", "app", "admin"].includes(slug)) {
      return prisma.organization.findUnique({ where: { slug } });
    }
  }

  return null;
}
