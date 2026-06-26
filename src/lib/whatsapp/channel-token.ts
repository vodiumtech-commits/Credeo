/**
 * Vodium Ledger — per-tenant WhatsApp credential resolution.
 *
 * Token storage strategy (per the build brief): the raw long-lived access token
 * is NEVER stored in the database. A `WhatsAppChannel.accessTokenRef` holds the
 * NAME of an environment variable; the actual token is read from that env var at
 * send time. This is the "environment variables first" strategy that an
 * encrypted secret store can later replace without changing call sites.
 *
 * Resolution order (for an ACTIVE channel with a phoneNumberId):
 *   1. The channel's encrypted token (accessTokenEnc), decrypted at use time.
 *   2. The env var named by the channel's accessTokenRef.
 *   3. The global Vodium-managed number (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID).
 */

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto/secrets";
import type { WhatsAppChannel } from "@prisma/client";

export type ChannelCredentials = { token: string; phoneId: string };

type ChannelLike = Pick<WhatsAppChannel, "accessTokenRef" | "accessTokenEnc" | "phoneNumberId" | "status">;

export function resolveChannelCredentials(channel: ChannelLike | null): ChannelCredentials | null {
  if (channel && channel.status === "ACTIVE" && channel.phoneNumberId) {
    const decrypted = decryptSecret(channel.accessTokenEnc);
    if (decrypted) return { token: decrypted, phoneId: channel.phoneNumberId };

    if (channel.accessTokenRef) {
      const token = process.env[channel.accessTokenRef];
      if (token) return { token, phoneId: channel.phoneNumberId };
    }
  }

  const globalToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const globalPhone = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (globalToken && globalPhone) return { token: globalToken, phoneId: globalPhone };

  return null;
}

/** Resolve outbound credentials for an organization (falls back to the global number). */
export async function getOrgChannelCredentials(
  organizationId: string | null | undefined
): Promise<ChannelCredentials | null> {
  if (!organizationId) return resolveChannelCredentials(null);
  const channel = await prisma.whatsAppChannel.findFirst({
    where: { organizationId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  return resolveChannelCredentials(channel);
}
