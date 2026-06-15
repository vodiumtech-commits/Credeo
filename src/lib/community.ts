/**
 * Community name normalisation — shared by web registration and WhatsApp bot.
 *
 * Vendors type their community name in any case.
 * We normalise to lowercase before every DB write so that:
 *
 *   "YABA MARKET"  →  stored as  "yaba market"
 *   "Yaba Market"  →  stored as  "yaba market"
 *   "yaba market"  →  stored as  "yaba market"  ← same row, upserted
 *
 * Community.name is @unique and always lowercase — no extra column needed.
 */

export interface CommunityMeta {
  /** Lowercase name — used as the unique key for upserts and all DB lookups */
  name:       string;
  /** Optional short code, e.g. "UNILAG". Extracted from parentheses if present. */
  shortName?: string;
  city:       string;
  state:      string;
}

// Best-effort city/state enrichment keyed by uppercase short code.
const COMM_META: Record<string, { city: string; state: string }> = {
  UNILAG:    { city: "Lagos",         state: "Lagos"    },
  OAU:       { city: "Ile-Ife",       state: "Osun"     },
  UI:        { city: "Ibadan",        state: "Oyo"      },
  COVENANT:  { city: "Ota",           state: "Ogun"     },
  FUTA:      { city: "Akure",         state: "Ondo"     },
  LASU:      { city: "Lagos",         state: "Lagos"    },
  UNIBEN:    { city: "Benin City",    state: "Edo"      },
  ABU:       { city: "Zaria",         state: "Kaduna"   },
  UNN:       { city: "Nsukka",        state: "Enugu"    },
  UNILORIN:  { city: "Ilorin",        state: "Kwara"    },
  BABCOCK:   { city: "Ilishan-Remo",  state: "Ogun"     },
  PAU:       { city: "Lagos",         state: "Lagos"    },
  DOMINION:  { city: "Ibadan",        state: "Oyo"      },
  ABUAD:     { city: "Ado-Ekiti",     state: "Ekiti"    },
  CALEB:     { city: "Lagos",         state: "Lagos"    },
  BOWEN:     { city: "Iwo",           state: "Osun"     },
  LAUTECH:   { city: "Ogbomoso",      state: "Oyo"      },
  FUNAAB:    { city: "Abeokuta",      state: "Ogun"     },
  NOUN:      { city: "Abuja",         state: "FCT"      },
  UNIZIK:    { city: "Awka",          state: "Anambra"  },
  UNIPORT:   { city: "Port Harcourt", state: "Rivers"   },
};

/**
 * Normalise a free-text community name into its DB-ready form.
 *
 * @example
 *   parseCommunity("YABA MARKET")
 *   // → { name: "yaba market", shortName: "YM", city: "Lagos", state: "Lagos" }
 *
 *   parseCommunity("University of Lagos (UNILAG)")
 *   // → { name: "university of lagos (unilag)", shortName: "UNILAG", city: "Lagos", state: "Lagos" }
 */
export function parseCommunity(raw: string): CommunityMeta {
  // Collapse whitespace and lowercase the whole thing.
  const name = raw.trim().replace(/\s+/g, " ").toLowerCase();

  if (!name) {
    return { name: "unknown", city: "Nigeria", state: "Nigeria" };
  }

  // Extract short code from parentheses: "university of lagos (unilag)" → "UNILAG"
  const parenMatch = name.match(/\(([^)]+)\)$/);
  const parenCode  = parenMatch?.[1]?.trim().toUpperCase();

  // Acronym from first letters of each word (ignoring articles): "dominion university" → "DU"
  const acronym = name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  // Single all-letters word typed in any case: "unilag" → "UNILAG"
  const singleWord = /^\w+$/.test(name.replace(/\s/g, ""))
    ? name.replace(/\s/g, "").toUpperCase()
    : undefined;

  // Resolve city/state: paren code wins, then single-word, then acronym
  const meta =
    (parenCode  && COMM_META[parenCode])                       ? COMM_META[parenCode]!       :
    (singleWord && COMM_META[singleWord])                      ? COMM_META[singleWord]!      :
    (acronym.length <= 10 && COMM_META[acronym])               ? COMM_META[acronym]!         :
    { city: "Nigeria", state: "Nigeria" };

  const shortName =
    parenCode ??
    (singleWord && COMM_META[singleWord] ? singleWord : undefined) ??
    (acronym.length <= 8 ? acronym : undefined);

  return { name, shortName, ...meta };
}
