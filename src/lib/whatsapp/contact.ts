/**
 * Pull a phone number out of a shared WhatsApp contact card.
 *
 * When a vendor taps 📎 → Contact and sends a card, Meta delivers a message of
 * type "contacts" whose shape is:
 *
 *   contacts: [{ name: {...}, phones: [{ phone: "+234 801…", wa_id: "234…", type }] }]
 *
 * Real cards vary: some phones carry a `wa_id` (the contact is on WhatsApp),
 * some only a formatted `phone`, some contacts list several numbers, and a few
 * (email-only) have none. We prefer the first entry that yields ≥7 digits,
 * favouring `wa_id` (already E.164-ish) over the human-formatted `phone`.
 *
 * Kept pure and dependency-free so it's unit-testable without the webhook.
 */

export interface SharedContact {
  name?: { formatted_name?: string };
  phones?: Array<{ phone?: string; wa_id?: string; type?: string }>;
}

/** The best phone number from the first shared contact, or undefined. */
export function contactPhoneFrom(contacts: SharedContact[] | undefined): string | undefined {
  const phones = contacts?.[0]?.phones;
  if (!phones?.length) return undefined;

  for (const p of phones) {
    // wa_id is the normalised WhatsApp id (digits only); fall back to the
    // display phone, which may carry spaces, dashes or a leading "+".
    const candidate = p.wa_id ?? p.phone;
    if (candidate && candidate.replace(/\D/g, "").length >= 7) {
      return candidate.trim();
    }
  }
  return undefined;
}

/** The contact's display name, if the card carried one. */
export function contactNameFrom(contacts: SharedContact[] | undefined): string | undefined {
  const name = contacts?.[0]?.name?.formatted_name?.trim();
  return name || undefined;
}
