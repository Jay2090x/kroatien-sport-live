/**
 * TheSportsDB Timeline + Lineup → echte Spieler-Events.
 * Zeigt: gespielt ja/nein, Minuten, Startelf/Bank, Ein-/Auswechslung, Tore, Karten.
 * Nur API-Daten – wenn Timeline fehlt: eventsKnown=false (kein Raten).
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
  const partsA = na.split(" ").filter((p) => p.length > 2);
  const partsB = nb.split(" ").filter((p) => p.length > 2);
  if (partsA.length && partsB.length) {
    const lastA = partsA[partsA.length - 1]!;
    const lastB = partsB[partsB.length - 1]!;
    if (lastA.length > 3 && lastA === lastB) return true;
    // shared significant token
    if (partsA.some((p) => partsB.includes(p) && p.length > 3)) return true;
  }
  return na.includes(nb) || nb.includes(na);
}

function parseMin(raw?: string | null): number | null {
  if (raw == null || raw === "") return null;
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function isGoal(type: string, detail: string): boolean {
  const t = `${type} ${detail}`.toLowerCase();
  if (t.includes("missed") || t.includes("saved") || t.includes("disallowed"))
    return false;
  return (
    /\bgoal\b/.test(t) ||
    t.includes("scored") ||
    t.includes("penalty scored") ||
    (t.includes("penalty") && t.includes("goal"))
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
  return /subst|substitution|\bsub\b/i.test(type);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 90 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function applyLineup(
  croats: MatchPlayerAppearance[],
  rows: LineupRow[]
): MatchPlayerAppearance[] {
  const anyHit = croats.some((c) =>
    rows.some((r) => r.strPlayer && namesMatch(r.strPlayer, c.playerName))
  );

  return croats.map((c) => {
    const hit = rows.find(
      (r) => r.strPlayer && namesMatch(r.strPlayer, c.playerName)
    );
    if (!hit) {
      // Lineup known but player not listed → likely not in squad
      if (anyHit || rows.length >= 11) {
        return {
          ...c,
          isStarter: false,
          didPlay: false,
          minutesPlayed: 0,
          eventsKnown: true,
        };
      }
      return { ...c, eventsKnown: c.eventsKnown };
    }
    const sub = (hit.strSubstitute || "").toLowerCase() === "yes";
    return {
      ...c,
      isStarter: !sub,
      // bench until timeline says subbed on
      didPlay: !sub ? true : c.didPlay,
      eventsKnown: true,
    };
  });
}

function applyTimeline(
  croats: MatchPlayerAppearance[],
  rows: TimelineRow[],
  matchFinished: boolean
): MatchPlayerAppearance[] {
  return croats.map((c) => {
    let goals = 0;
    let assists = 0;
    let yellowCards = 0;
    let redCard = false;
    let substitutedOn = c.substitutedOn ?? null;
    let substitutedOff = c.substitutedOff ?? null;
    let mentioned = false;

    for (const row of rows) {
      const player = row.strPlayer || "";
      const assist = row.strAssist || "";
      const type = row.strTimeline || "";
      const detail = row.strTimelineDetail || "";
      const min = parseMin(row.intTime);

      const isPlayer = player && namesMatch(player, c.playerName);
      const isAssistName = assist && namesMatch(assist, c.playerName);
      const isDetail = detail && namesMatch(detail, c.playerName);

      if (isPlayer) {
        mentioned = true;
        if (isGoal(type, detail)) goals += 1;
        if (isYellow(type, detail)) yellowCards += 1;
        if (isRed(type, detail)) redCard = true;
        if (isSub(type) && min != null) {
          // strPlayer on subst = usually player going OFF
          if (substitutedOff == null) substitutedOff = min;
        }
      }
      if (isAssistName) {
        mentioned = true;
        if (isGoal(type, detail)) assists += 1;
        if (isSub(type) && min != null && substitutedOn == null) {
          // strAssist often = player coming ON
          substitutedOn = min;
        }
      }
      if (isDetail && isSub(type) && min != null && substitutedOn == null) {
        mentioned = true;
        substitutedOn = min;
      }
    }

    // Participation
    let didPlay = c.didPlay;
    if (c.isStarter === true) didPlay = true;
    if (substitutedOn != null) didPlay = true;
    if (substitutedOff != null) didPlay = true;
    if (goals > 0 || assists > 0 || yellowCards > 0 || redCard) didPlay = true;
    if (mentioned && didPlay == null) didPlay = true;
    // Explicit bench + no sub on + finished → did not play
    if (
      matchFinished &&
      c.isStarter === false &&
      substitutedOn == null &&
      !mentioned &&
      c.eventsKnown
    ) {
      didPlay = false;
    }

    let minutesPlayed = c.minutesPlayed;
    if (didPlay === false) minutesPlayed = 0;
    else if (minutesPlayed == null) {
      if (substitutedOn != null && substitutedOff != null) {
        minutesPlayed = Math.max(0, substitutedOff - substitutedOn);
      } else if (substitutedOn != null) {
        minutesPlayed = Math.max(1, 90 - substitutedOn);
      } else if (substitutedOff != null) {
        minutesPlayed = substitutedOff;
      } else if (c.isStarter === true && matchFinished) {
        minutesPlayed = 90;
      } else if (c.isStarter === true && !matchFinished) {
        // live: unknown exact minutes
        minutesPlayed = undefined;
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
      minutesPlayed,
      didPlay: didPlay ?? undefined,
      eventsKnown: true,
    };
  });
}

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

  let croats: MatchPlayerAppearance[] = match.croatianPlayers.map((c) => ({
    ...c,
    eventsKnown: false,
  }));

  const hasLineup = Boolean(lu?.lineup?.length);
  const hasTimeline = Boolean(tl?.timeline?.length);

  if (hasLineup) croats = applyLineup(croats, lu!.lineup!);
  if (hasTimeline) {
    croats = applyTimeline(
      croats,
      tl!.timeline!,
      match.status === "finished"
    );
  }

  // If we got neither, mark unknown
  if (!hasLineup && !hasTimeline) {
    croats = croats.map((c) => ({ ...c, eventsKnown: false }));
  }

  return { ...match, croatianPlayers: croats };
}

export async function enrichMatchesPlayerEvents(
  matches: Match[],
  key?: string,
  max = 18
): Promise<Match[]> {
  const now = Date.now();
  const candidates = matches
    .filter(
      (m) =>
        m.externalIds?.theSportsDb &&
        m.croatianPlayers?.length &&
        (m.status === "live" ||
          m.status === "halftime" ||
          (m.status === "finished" &&
            now - new Date(m.kickoff).getTime() < 10 * 24 * 3600_000))
    )
    .sort((a, b) => {
      const score = (m: Match) => {
        if (m.status === "live" || m.status === "halftime") return 100;
        if (m.status === "finished") {
          const age = now - new Date(m.kickoff).getTime();
          return 50 - age / (24 * 3600_000);
        }
        return 0;
      };
      return score(b) - score(a);
    })
    .slice(0, max);

  if (!candidates.length) return matches;

  // sequential batches of 4 to ease free-tier limits
  const enriched: Match[] = [];
  for (let i = 0; i < candidates.length; i += 4) {
    const batch = candidates.slice(i, i + 4);
    const part = await Promise.all(
      batch.map((m) => enrichMatchPlayerEvents(m, key))
    );
    enriched.push(...part);
  }

  const byId = new Map(enriched.map((m) => [m.id, m]));
  return matches.map((m) => byId.get(m.id) ?? m);
}
