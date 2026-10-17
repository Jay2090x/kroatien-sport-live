import { cachedSource, REVALIDATE } from "../cache";
import { fetchJson } from "../http";
import { countryDe } from "../names";
import { ESPN_CROATIA_ID, loadEspnCroatiaMatches } from "./espn";
import type { GroupRow, NtMatch } from "./types";

/**
 * EM-2028-Qualifikation.
 * Fixe Eckdaten (UEFA, geprüft am 17.10.2026):
 *   https://www.uefa.com/euro2028/news/029f-1f2ff991e87b-345fffcd69c3-1000--uefa-euro-2028-qualifying-draw-to-take-place-in-belfast/
 *   https://www.uefa.com/euro2028/news/028f-1b599fe02d18-0c758142f5e4-1000--euro-2028-all-you-need-to-know/
 * Gruppe, Tabelle und Spiele kommen erst nach der Auslosung – dann automatisch aus ESPN
 * (Kroatien-Spielplan mit Wettbewerb "uefa.euroq", Tabelle aus uefa.euroq/standings,
 * aber nur, wenn ESPN dort schon die Saison "2028" führt).
 */
export const EURO2028 = {
  drawDate: "2026-12-06", // Sonntag, Belfast (ICC); Uhrzeit von UEFA noch nicht genannt
  qualiFrom: "2027-03",
  qualiTo: "2027-11",
  playoffs: "2028-03",
  tournamentStart: "2028-06-09",
  tournamentEnd: "2028-07-09",
  sources: [
    {
      label: "UEFA.com, 17.09.2026",
      url: "https://www.uefa.com/euro2028/news/029f-1f2ff991e87b-345fffcd69c3-1000--uefa-euro-2028-qualifying-draw-to-take-place-in-belfast/",
    },
    {
      label: "UEFA.com – EURO 2028: All you need to know",
      url: "https://www.uefa.com/euro2028/news/028f-1b599fe02d18-0c758142f5e4-1000--euro-2028-all-you-need-to-know/",
    },
  ],
} as const;

export interface EuroQualiData {
  fixtures: NtMatch[];
  group: { name: string; rows: GroupRow[] } | null;
  fetchedAt: string | null;
}

interface Standings {
  children?: Array<{
    name?: string;
    standings?: {
      seasonDisplayName?: string;
      entries?: Array<{ team?: { id?: string; displayName?: string }; stats?: Array<{ name?: string; value?: number }> }>;
    };
  }>;
}

async function loadGroup(): Promise<EuroQualiData["group"]> {
  const j = await fetchJson<Standings>("https://site.api.espn.com/apis/v2/sports/soccer/uefa.euroq/standings");
  if (!Array.isArray(j.children)) throw new Error("ESPN euroq standings: unexpected format");
  const g = j.children.find(
    (c) =>
      (c.standings?.seasonDisplayName ?? "").includes("2028") &&
      c.standings?.entries?.some((e) => e.team?.id === ESPN_CROATIA_ID)
  );
  if (!g?.standings?.entries) return null; // Auslosung noch nicht erfolgt bzw. ESPN noch ohne neue Saison
  const rows = g.standings.entries.map((e) => {
    const st = (n: string) => Number(e.stats?.find((s) => s.name === n)?.value ?? 0);
    return {
      rank: st("rank"),
      team: countryDe(e.team?.displayName ?? "?"),
      isCroatia: e.team?.id === ESPN_CROATIA_ID,
      played: st("gamesPlayed"),
      won: st("wins"),
      drawn: st("ties"),
      lost: st("losses"),
      goalsFor: st("pointsFor"),
      goalsAgainst: st("pointsAgainst"),
      points: st("points"),
    };
  });
  rows.sort((a, b) => a.rank - b.rank);
  return { name: (g.name ?? "").replace(/^Group/i, "Gruppe"), rows };
}

export async function getEuroQuali(): Promise<EuroQualiData> {
  const [nt, group] = await Promise.all([
    cachedSource(["nt", "espn"], REVALIDATE.default, loadEspnCroatiaMatches),
    cachedSource(["euro2028", "group"], 6 * 3600, loadGroup),
  ]);
  const slugOf = new Map((nt?.data.raw ?? []).map((r) => [`espn-${r.id}`, r.slug]));
  const fixtures = (nt?.data.matches ?? []).filter(
    (m) => slugOf.get(m.id) === "uefa.euroq" && m.kickoff >= "2027-01-01"
  );
  return {
    fixtures,
    group: group?.data ?? null,
    fetchedAt: [nt?.fetchedAt, group?.fetchedAt].filter((x): x is string => !!x).sort()[0] ?? null,
  };
}
