import { fetchJson } from "../http";
import type { NtMatch } from "./types";

/**
 * OpenLigaDB (frei, ohne Key) – Fallback für Nations-League-Spiele Kroatiens,
 * falls ESPN nicht erreichbar ist.
 */
interface OldbMatch {
  matchID: number;
  matchDateTimeUTC: string;
  matchIsFinished: boolean;
  leagueName?: string;
  team1: { teamName: string };
  team2: { teamName: string };
  matchResults?: Array<{ resultTypeID: number; pointsTeam1: number; pointsTeam2: number }>;
  location?: { locationCity?: string; locationStadium?: string } | null;
}

function seasonYear(now = new Date()): number {
  // Nations-League-Saison startet im Herbst (z. B. 2026/27 → 2026)
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

export async function loadOpenLigaCroatiaMatches(): Promise<NtMatch[]> {
  const year = seasonYear();
  const leagues = ["nla", "nlb"];
  const settled = await Promise.allSettled(
    leagues.map((l) => fetchJson<OldbMatch[]>(`https://api.openligadb.de/getmatchdata/${l}/${year}`))
  );
  const out: NtMatch[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled" || !Array.isArray(s.value)) continue;
    for (const m of s.value) {
      const isHome = /kroatien/i.test(m.team1.teamName);
      const isAway = /kroatien/i.test(m.team2.teamName);
      if (!isHome && !isAway) continue;
      const final = m.matchResults?.find((r) => r.resultTypeID === 2);
      const kickoff = new Date(m.matchDateTimeUTC).toISOString();
      const sinceKickoff = Date.now() - Date.parse(kickoff);
      const started = sinceKickoff >= 0;
      // Angepfiffen, aber >3 h ohne Endstand → Status unklar, nicht als "live" zeigen
      if (!m.matchIsFinished && sinceKickoff > 3 * 3600_000) continue;
      out.push({
        id: `oldb-${m.matchID}`,
        kickoff,
        home: m.team1.teamName,
        away: m.team2.teamName,
        croatiaIsHome: isHome,
        homeScore: final ? final.pointsTeam1 : null,
        awayScore: final ? final.pointsTeam2 : null,
        state: m.matchIsFinished ? "post" : started ? "in" : "pre",
        clock: !m.matchIsFinished && started ? "live" : undefined,
        competition: "UEFA Nations League",
        venue: m.location?.locationStadium || m.location?.locationCity || undefined,
      });
    }
  }
  if (out.length === 0) throw new Error("OpenLigaDB: no Croatia matches");
  return out.sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
}
