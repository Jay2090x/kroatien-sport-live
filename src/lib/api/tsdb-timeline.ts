/**
 * TheSportsDB Timeline + Lineup → Spieler-Events (Tore, Karten, Wechsel).
 * Nur echte API-Daten, keine Spekulation. Rate-Limit-freundlich (parallel begrenzt).
 */

import type { Match, MatchPlayerAppearance } from "@/types";

const TSDB = "https://www.thesportsdb.com/api/v1/json";

type TimelineRow = {
  strTimeline?: string | null;
  strTimelineDetail?: string | null;
  strPlayer?: string | null;
  strAssist?: string | null;
  intTime?: string | null;
  idPlayer?: string | null;
};

type LineupRow = {
  strPlayer?: string | null;
  idPlayer?: string | null;
  strSubstitute?: string | null;
  strPosition?: string | null;
};

function apiKey(override?: string) {
  return (
    override ||
    process.env.THESPORTSDB_API_KEY ||
    process.env.NEXT_PUBLIC_THESPORTSDB_KEY ||
    "3"
  );
}

function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normName(a);
  const nb = normName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Nachname
  const la = na.split(" ").pop() || na;
  const lb = nb.split(" ").pop() || nb;
  if (la.length > 3 && la === lb) return true;
  return na.includes(nb) || nb.includes(na);
}

function parseMin(raw?: string | null): number | null {
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function isGoal(type: string, detail: string): boolean {
  const t = `${type} ${detail}`.toLowerCase();
  return (
    /\bgoal\b/.test(t) ||
    t.includes("scored") ||
    t.includes("penalty scored") ||
    (t.includes("penalty") && !t.includes("missed") && !t.includes("saved"))
  );
}

function isYellow(type: string, detail: string): boolean {
  const t = `${type} ${detail}`.toLowerCase();
  return t.includes("yellow") && !t.includes("second yellow");
}

function isRed(type: string, detail: string): boolean {
  const t = `${type} ${detail}`.toLowerCase();
  return t.includes("red") || t.includes("second yellow");
}

function isSub(type: string): boolean {
  return /subst|substitution|sub\b/i.test(type);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function applyTimeline(
  croats: MatchPlayerAppearance[],
  rows: TimelineRow[]
): MatchPlayerAppearance[] {
  return croats.map((c) => {
    let goals = c.goals ?? 0;
    let assists = c.assists ?? 0;
    let yellowCards = c.yellowCards ?? 0;
    let redCard = c.redCard ?? false;
    let substitutedOn = c.substitutedOn ?? null;
    let substitutedOff = c.substitutedOff ?? null;

    for (const row of rows) {
      const player = row.strPlayer || "";
      const assist = row.strAssist || "";
      const type = row.strTimeline || "";
      const detail = row.strTimelineDetail || "";
      const min = parseMin(row.intTime);

      if (player && namesMatch(player, c.playerName)) {
        if (isGoal(type, detail)) goals += 1;
        if (isYellow(type, detail)) yellowCards += 1;
        if (isRed(type, detail)) redCard = true;
        if (isSub(type)) {
          // Player leaving: strPlayer is often the one going off
          if (substitutedOff == null && min != null) substitutedOff = min;
        }
      }
      if (assist && namesMatch(assist, c.playerName)) {
        if (isGoal(type, detail) || isSub(type)) {
          // Assist on goal
          if (isGoal(type, detail)) assists += 1;
        }
        // On subst, strAssist is often the player coming ON
        if (isSub(type) && substitutedOn == null && min != null) {
          substitutedOn = min;
        }
      }
      // Some feeds put incoming player in strTimelineDetail on subst
      if (
        isSub(type) &&
        detail &&
        namesMatch(detail, c.playerName) &&
        substitutedOn == null &&
        min != null
      ) {
        substitutedOn = min;
      }
    }

    // Minutes estimate
    let minutesPlayed = c.minutesPlayed;
    if (minutesPlayed == null) {
      if (substitutedOn != null && substitutedOff != null) {
        minutesPlayed = Math.max(0, substitutedOff - substitutedOn);
      } else if (substitutedOn != null) {
        minutesPlayed = Math.max(0, 90 - substitutedOn);
      } else if (substitutedOff != null) {
        minutesPlayed = substitutedOff;
      } else if (c.isStarter) {
        minutesPlayed = 90;
      }
    }

    return {
      ...c,
      goals: goals || undefined,
      assists: assists || undefined,
      yellowCards: yellowCards || undefined,
      redCard: redCard || undefined,
      substitutedOn,
      substitutedOff,
      minutesPlayed: minutesPlayed ?? undefined,
    };
  });
}

function applyLineup(
  croats: MatchPlayerAppearance[],
  rows: LineupRow[]
): MatchPlayerAppearance[] {
  return croats.map((c) => {
    const hit = rows.find(
      (r) => r.strPlayer && namesMatch(r.strPlayer, c.playerName)
    );
    if (!hit) return c;
    const sub = (hit.strSubstitute || "").toLowerCase() === "yes";
    return {
      ...c,
      isStarter: !sub,
      position: c.position,
    };
  });
}

/**
 * Reichert ein Match mit Timeline/Lineup an (wenn TheSportsDB-ID vorhanden).
 */
export async function enrichMatchPlayerEvents(
  match: Match,
  key?: string
): Promise<Match> {
  const id = match.externalIds?.theSportsDb;
  if (!id || !match.croatianPlayers?.length) return match;
  if (
    match.status !== "live" &&
    match.status !== "halftime" &&
    match.status !== "finished"
  ) {
    return match;
  }

  const k = apiKey(key);
  const [tl, lu] = await Promise.all([
    fetchJson<{ timeline?: TimelineRow[] | null }>(
      `${TSDB}/${k}/lookuptimeline.php?id=${id}`
    ),
    fetchJson<{ lineup?: LineupRow[] | null }>(
      `${TSDB}/${k}/lookuplineup.php?id=${id}`
    ),
  ]);

  let croats = [...match.croatianPlayers];
  if (lu?.lineup?.length) croats = applyLineup(croats, lu.lineup);
  if (tl?.timeline?.length) croats = applyTimeline(croats, tl.timeline);

  return { ...match, croatianPlayers: croats };
}

/**
 * Parallel begrenzt (Free-API-Limits).
 */
export async function enrichMatchesPlayerEvents(
  matches: Match[],
  key?: string,
  max = 8
): Promise<Match[]> {
  const candidates = matches
    .filter(
      (m) =>
        m.externalIds?.theSportsDb &&
        m.croatianPlayers?.length &&
        (m.status === "live" ||
          m.status === "halftime" ||
          m.status === "finished")
    )
    // Live first, then finished recent
    .sort((a, b) => {
      const score = (m: Match) =>
        m.status === "live" || m.status === "halftime" ? 2 : 1;
      return score(b) - score(a);
    })
    .slice(0, max);

  if (!candidates.length) return matches;

  const enriched = await Promise.all(
    candidates.map((m) => enrichMatchPlayerEvents(m, key))
  );
  const byId = new Map(enriched.map((m) => [m.id, m]));
  return matches.map((m) => byId.get(m.id) ?? m);
}
