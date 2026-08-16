/**
 * Strict club/team name matching.
 * Prevents: Union Berlin ↔ Unión (AR), Rangers ↔ Rangers de Talca, etc.
 */

const PREFIX_NOISE =
  /\b(fc|afc|sc|ssc|gnk|hnk|vfl|rb|ac|as|cf|fk|nk|sv|cd|ca|rc|ud|sd|1\.|the)\b/gi;

/** Single tokens that appear in many unrelated clubs worldwide */
const AMBIGUOUS_TOKENS = new Set([
  "union",
  "rangers",
  "united",
  "city",
  "sport",
  "sports",
  "real",
  "athletic",
  "atletico",
  "national",
  "sporting",
  "inter",
  "racing",
  "dynamo",
  "dinamo",
  "olympic",
  "olympique",
  "stadium",
  "club",
  "team",
  "deportes",
  "deportivo",
  "universidad",
  "university",
  "academy",
  "reserve",
  "reserves",
  "ii",
  "b",
  "u19",
  "u21",
  "u23",
]);

export function cleanTeamName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(PREFIX_NOISE, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return cleanTeamName(s)
    .split(" ")
    .filter((t) => t.length > 1);
}

function distinctiveTokens(s: string): string[] {
  return tokens(s).filter((t) => !AMBIGUOUS_TOKENS.has(t) && t.length > 2);
}

/**
 * True if club name and fixture team name refer to the same side.
 * Prefer clubId comparison at call site; this is name fallback.
 */
export function teamsMatch(clubOrTeamA: string, teamB: string): boolean {
  const ca = cleanTeamName(clubOrTeamA);
  const cb = cleanTeamName(teamB);
  if (!ca || !cb) return false;
  if (ca === cb) return true;

  // Single ambiguous token only matches exact (already handled)
  if (AMBIGUOUS_TOKENS.has(ca) || AMBIGUOUS_TOKENS.has(cb)) {
    // "union berlin" vs "union" — reject
    // "union berlin" vs "1 fc union berlin" — handled below
    if (ca === cb) return true;
  }

  const da = distinctiveTokens(clubOrTeamA);
  const db = distinctiveTokens(teamB);

  // Both have distinctive parts: require all of the shorter set ⊆ longer
  if (da.length && db.length) {
    const [short, long] =
      da.length <= db.length ? [da, new Set(db)] : [db, new Set(da)];
    if (short.every((t) => long.has(t))) return true;
    // strong single distinctive token (≥6) shared + same first distinctive
    const shared = da.filter((t) => db.includes(t) && t.length >= 5);
    if (shared.length >= 1 && (da.length === 1 || db.length === 1)) {
      // "atalanta" vs "atalanta bc" style
      if (shared.some((t) => t.length >= 6)) return true;
    }
    if (shared.length >= 2) return true;
  }

  // Substring only if shorter cleaned name is multi-word or long unique
  if (ca.includes(cb) || cb.includes(ca)) {
    const shorter = ca.length <= cb.length ? ca : cb;
    const longer = ca.length <= cb.length ? cb : ca;
    if (shorter.split(" ").length >= 2) {
      // multi-word shorter must appear as contiguous phrase
      return longer.includes(shorter);
    }
    // single word: only if long enough and not ambiguous
    if (shorter.length >= 8 && !AMBIGUOUS_TOKENS.has(shorter)) {
      return true;
    }
  }

  return false;
}

/** Player belongs to home or away of a fixture */
export function playerSideForMatch(
  club: string,
  clubId: string | undefined,
  home: string,
  away: string,
  homeId?: string | null,
  awayId?: string | null
): "home" | "away" | null {
  if (clubId && homeId && clubId === String(homeId)) return "home";
  if (clubId && awayId && clubId === String(awayId)) return "away";
  if (teamsMatch(club, home)) return "home";
  if (teamsMatch(club, away)) return "away";
  return null;
}
