import { cachedSource } from "../cache";
import { fetchJson } from "../http";
import { mapLimit } from "../async";
import { PLAYER_NAME, clubDe } from "../players-meta";
import { SITE_API, leagueSlugOf, loadEvents, stateOf } from "./espn";
import { loadSummary } from "./espn-summary";
import { loadSquadBase } from "./players";

/**
 * Talente-Radar – nur echte Zahlen aus ESPN (Athletenprofil + Saison-Übersicht).
 *
 * Kandidaten: Spieltagskader der kroatischen U21 (letzte Länderspielphase, ESPN-Team 19348)
 *             + Spieler des A-Kaders mit höchstens 23 Jahren.
 * Kriterium:  Alter ≤ 23 laut ESPN-Profil UND in der laufenden Vereinssaison (von ESPN
 *             erfasste Wettbewerbe) mind. 3 Startelf-Einsätze ODER mind. 2 Torbeteiligungen.
 * Sortierung: Torbeteiligungen (Tore + Vorlagen), dann Startelf-Einsätze.
 */

export const TALENT_RULES = { maxAge: 23, minStarts: 3, minInvolvements: 2 } as const;
const U21_TEAM = "19348";
const NT_TEAMS = new Set(["477", U21_TEAM]);
const WEB_API = "https://site.web.api.espn.com/apis/common/v3/sports/soccer";
const H = 3600_000;

/** Kroatische Schreibweise der U21-Spieler (HNS-Kaderliste vom 08.09.2026; ESPN ohne Diakritika). */
const U21_NAME: Record<string, string> = {
  "351364": "Anthony Pavlešić",
  "345752": "Dominik Prpić",
  "385941": "Ivano Kolarik",
  "342983": "Noel Bodetić",
  "385890": "Luka Hodak",
  "412300": "Ivan Katić",
  "384533": "Branko Pavić",
  "421154": "Ivan Canjuga",
  "409197": "Antonio Verinac",
  "364235": "Filip Mažar",
  "364290": "Domagoj Bukvić",
  "361788": "Fran Topić",
  "3115942": "Niko Šepić",
  "402292": "Adriano Jagušić",
  "362058": "Moreno Živković",
  "320459": "Adrian Segečić",
  "346760": "Lovro Zvonarek",
  "413776": "Raul Kumar",
  "402291": "Luka Savatović",
  "322096": "Toni Silić",
  "358087": "Luka Vrbančić",
  "345481": "Marin Šotiček",
  "406061": "Branimir Mlačić",
  "363661": "Šimun Hrgović",
};

export interface CompStat {
  competition: string;
  starts: number;
  goals: number;
  assists: number;
}

export interface Talent {
  id: string;
  name: string;
  age: number | null;
  club: string | null;
  team: "A" | "U21" | "A+U21";
  stats: CompStat[] | null; // null = Profil/Übersicht nicht abrufbar
  starts: number;
  goals: number;
  assists: number;
  onRadar: boolean;
}

export interface TalentsData {
  season: string; // "2026-27"
  radar: Talent[];
  others: Talent[];
  u21Matches: number;
  fetchedAt: string;
  gaps: string[];
}

/** Saisonlabel wie bei ESPN: Juli–Juni, z. B. "2026-27". */
export function seasonLabel(now: number): string {
  const d = new Date(now);
  const y = d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

interface Overview {
  statistics?: {
    names?: string[];
    splits?: Array<{ displayName?: string; teamId?: string; leagueSlug?: string; stats?: string[] }>;
  };
}

interface Profile {
  name: string;
  age: number | null;
  club: string | null;
  /** z. B. "2026-27 Serie A Stats" – fehlt die Saison, führt ESPN keine aktuellen Zahlen */
  statsLabel: string | null;
}

async function loadProfile(id: string): Promise<Profile> {
  const j = await fetchJson<{
    athlete?: { id?: string; displayName?: string; age?: number; team?: { displayName?: string }; statsSummary?: { displayName?: string } };
  }>(
    `${WEB_API}/athletes/${id}`
  );
  if (!j.athlete?.id || String(j.athlete.id) !== id) throw new Error(`ESPN athlete ${id}: unexpected format`);
  return {
    name: j.athlete.displayName ?? id,
    age: typeof j.athlete.age === "number" ? j.athlete.age : null,
    club: j.athlete.team?.displayName ? clubDe(j.athlete.team.displayName) : null,
    statsLabel: j.athlete.statsSummary?.displayName ?? null,
  };
}

async function loadSeasonStats(id: string, season: string): Promise<CompStat[]> {
  const j = await fetchJson<Overview>(`${WEB_API}/athletes/${id}/overview`);
  const names = j.statistics?.names;
  if (!names) return []; // ESPN führt für diesen Spieler keine Statistik
  const idx = (n: string) => names.indexOf(n);
  const num = (arr: string[] | undefined, n: string) => {
    const i = idx(n);
    const v = i >= 0 ? Number(arr?.[i]) : NaN;
    return Number.isFinite(v) ? v : 0;
  };
  return (j.statistics?.splits ?? [])
    .filter((s) => s.displayName?.startsWith(season) && s.teamId && !NT_TEAMS.has(s.teamId))
    .map((s) => ({
      competition: (s.displayName ?? "").replace(/^\d{4}-\d{2}\s+/, ""),
      starts: num(s.stats, "starts"),
      goals: num(s.stats, "totalGoals"),
      assists: num(s.stats, "goalAssists"),
    }));
}

/** U21-Spieltagskader der letzten U21-Länderspielphase (21 Tage vor dem letzten Spiel). */
async function loadU21Pool(): Promise<{ ids: Array<[string, string]>; matches: number }> {
  const events = await loadEvents(`${SITE_API}/all/teams/${U21_TEAM}/schedule`);
  const done = events
    .filter((e) => stateOf(e.competitions?.[0]?.status) === "post" && leagueSlugOf(e))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  if (!done.length) throw new Error("no finished U21 match");
  const last = Date.parse(done[0].date);
  const win = done.filter((e) => Date.parse(e.date) >= last - 21 * 24 * H);
  const ids = new Map<string, string>();
  let ok = 0;
  for (const e of win) {
    try {
      const s = await loadSummary(leagueSlugOf(e)!, e.id);
      ok++;
      for (const p of s.rosters[U21_TEAM] ?? []) if (!ids.has(p.id)) ids.set(p.id, p.name);
    } catch {
      /* einzelner Spielbericht fehlt – Rest reicht */
    }
  }
  if (ids.size < 11) throw new Error(`U21 pool too small (${ids.size})`);
  // Array statt Map: der Data-Cache serialisiert als JSON
  return { ids: [...ids.entries()], matches: ok };
}

export async function getTalents(now = Date.now()): Promise<TalentsData | null> {
  try {
    const season = seasonLabel(now);
    const gaps: string[] = [];
    const fetchedAts: string[] = [];
    const [u21, base] = await Promise.all([
      cachedSource(["talents", "u21pool2"], 12 * 3600, loadU21Pool),
      loadSquadBase(now, { withHnl: false }).catch(() => null),
    ]);
    if (!u21 && !base) throw new Error("no candidate pool");
    if (!u21) gaps.push("u21");
    if (!base) gaps.push("senior");
    if (u21) fetchedAts.push(u21.fetchedAt);

    const pool = new Map<string, { espnName: string; a: boolean; u: boolean }>();
    for (const [id, n] of u21?.data.ids ?? []) pool.set(id, { espnName: n, a: false, u: true });
    for (const [id, n] of base?.squad ?? []) {
      const e = pool.get(id);
      pool.set(id, { espnName: e?.espnName ?? n, a: true, u: e?.u ?? false });
    }

    const ids = [...pool.keys()];
    const rows = await mapLimit(ids, 4, async (id): Promise<Talent | null> => {
      const info = pool.get(id)!;
      const prof = await cachedSource(["talents", "profile2", id], 12 * 3600, () => loadProfile(id));
      // A-Kader-Spieler über 23 gar nicht erst weiter abfragen
      if (prof?.data.age != null && prof.data.age > TALENT_RULES.maxAge) return null;
      if (!prof && !info.u) return null;
      // Ohne aktuelle Saison im Profil hat ESPN keine Zahlen (Übersicht liefert dann HTTP 500)
      const noSeason = prof != null && !(prof.data.statsLabel ?? "").startsWith(season);
      const st = noSeason
        ? null
        : await cachedSource(["talents", "stats", id, season], 6 * 3600, () => loadSeasonStats(id, season));
      if (st) fetchedAts.push(st.fetchedAt);
      const stats = noSeason ? [] : st?.data ?? null;
      const sum = (k: keyof Omit<CompStat, "competition">) => (stats ?? []).reduce((n, s) => n + s[k], 0);
      const starts = sum("starts");
      const goals = sum("goals");
      const assists = sum("assists");
      const age = prof?.data.age ?? null;
      const onRadar =
        age != null &&
        age <= TALENT_RULES.maxAge &&
        (starts >= TALENT_RULES.minStarts || goals + assists >= TALENT_RULES.minInvolvements);
      return {
        id,
        name: PLAYER_NAME[id] ?? U21_NAME[id] ?? prof?.data.name ?? info.espnName,
        age,
        club: prof?.data.club ? clubDe(prof.data.club) : null,
        team: info.a && info.u ? "A+U21" : info.a ? "A" : "U21",
        stats,
        starts,
        goals,
        assists,
        onRadar,
      };
    });
    const all = rows.filter((r): r is Talent => r !== null);
    const radar = all
      .filter((r) => r.onRadar)
      .sort((x, y) => y.goals + y.assists - (x.goals + x.assists) || y.starts - x.starts || y.goals - x.goals);
    const others = all
      .filter((r) => !r.onRadar)
      .sort((x, y) => x.name.split(" ").at(-1)!.localeCompare(y.name.split(" ").at(-1)!, "hr"));
    return {
      season,
      radar,
      others,
      u21Matches: u21?.data.matches ?? 0,
      fetchedAt: fetchedAts.sort()[0] ?? new Date(now).toISOString(),
      gaps,
    };
  } catch (err) {
    console.error("[data] talents failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
