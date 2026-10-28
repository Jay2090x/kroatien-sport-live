import { cachedSource } from "../cache";
import { mapLimit } from "../async";
import { loadSquadBase } from "./players";
import { trackedSoccer } from "./live-bar";
import { getGame } from "./game";

/**
 * "Kroatische Torschützen heute": Tore und Vorlagen der Nationalspieler (ESPN-Athleten-ID)
 * in Vereinsspielen der letzten 24 h – aus den ESPN-Spielberichten, die auch die Spielseiten nutzen.
 */
export interface ScorerRow {
  playerId: string;
  name: string;
  what: "goal" | "penalty" | "assist";
  minute: string;
  league: string;
  gameId: string;
  competition: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  live: boolean;
  kickoff: string;
}

const H = 3600_000;

async function load(now: number): Promise<ScorerRow[]> {
  const [b, tracked] = await Promise.all([loadSquadBase(now, { withHnl: false }), trackedSoccer(now)]);
  const seen = new Set<string>();
  const games: Array<{ slug: string; id: string }> = [];
  for (const [t, gs] of b.clubGames) {
    if (!tracked.soccer.get(t)?.length) continue;
    for (const g of gs) {
      const k = Date.parse(g.kickoff);
      if (g.source !== "espn" || !g.slug || g.isNationalTeam || g.state === "pre" || k > now || now - k > 24 * H) continue;
      const key = `${g.slug}/${g.id}`;
      if (!seen.has(key)) (seen.add(key), games.push({ slug: g.slug, id: g.id }));
    }
  }
  const out: ScorerRow[] = [];
  await mapLimit(games, 4, async ({ slug, id }) => {
    const g = await getGame(slug, id);
    if (!g || g.state === "pre") return;
    for (const e of g.events) {
      if (e.kind !== "goal" && e.kind !== "penalty") continue;
      const roles: Array<[number, ScorerRow["what"]]> = [[0, e.kind], [1, "assist"]];
      for (const [i, what] of roles) {
        const pid = e.ids[i];
        if (!pid || !tracked.croatById.has(pid)) continue;
        out.push({
          playerId: pid,
          name: e.names[i],
          what,
          minute: e.minute,
          league: slug,
          gameId: id,
          competition: g.competition,
          home: g.home.name,
          away: g.away.name,
          homeScore: g.home.score,
          awayScore: g.away.score,
          live: g.state === "in",
          kickoff: g.kickoff ?? "",
        });
      }
    }
  });
  return out.sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff) || parseInt(a.minute) - parseInt(b.minute));
}

export async function getCroScorersToday(now = Date.now()): Promise<ScorerRow[]> {
  const s = await cachedSource(["home", "cro-scorers"], 120, () => load(now)).catch(() => null);
  return s?.data ?? [];
}
