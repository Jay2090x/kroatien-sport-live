/**
 * Einheitliche, vergleichbare Spieler-Statistik.
 * Jeder Spieler: gleiche Blöcke – Club (aktuelle Liga-Saison) + Nationalteam (letztes Großturnier/Zyklus).
 * Keine gemischten Highlight-Labels (WM vs. Premier League).
 */

import type { LocaleText, PlayerProfileData, CareerSeasonStat } from "@/types/player-profile";

export type UniformStatLine = {
  /** club | national */
  kind: "club" | "national";
  /** z.B. "Club · Serie A · 2025-26" */
  label: LocaleText;
  competition: LocaleText;
  season: string;
  apps: number | null;
  goals: number | null;
  assists: number | null;
  yellow: number | null;
};

const NT_TAB = /croatia|hrvat|national|vatren/i;
const LEAGUE_HINT =
  /serie\s*a|premier|bundesliga|la\s*liga|ligue|hnl|eredivisie|saudi|championship|liga/i;
const MAJOR_NT =
  /wm|world\s*cup|svjetsko|em\b|euro|nations|liga\s*nacija|qualif|kvalif/i;

function loc(de: string, en: string, hr: string): LocaleText {
  return { de, en, hr };
}

function isNtTab(id: string, label: LocaleText): boolean {
  return NT_TAB.test(`${id} ${label.de} ${label.en} ${label.hr}`);
}

function seasonRank(season: string): number {
  // "2025-26" → 2025.26, "2026" → 2026
  const m = season.match(/(\d{4})(?:-(\d{2}))?/);
  if (!m) return 0;
  const y = Number(m[1]);
  const tail = m[2] ? Number(m[2]) / 100 : 0;
  return y + tail;
}

function pickClubLine(profile: PlayerProfileData): CareerSeasonStat | null {
  const clubTabs = profile.teams.filter((t) => !isNtTab(t.id, t.label));
  // Prefer first club tab (current club), then league-like rows, newest season
  for (const tab of clubTabs) {
    const leagueRows = tab.stats.filter((s) =>
      LEAGUE_HINT.test(
        `${s.competition.de} ${s.competition.en} ${s.competition.hr}`
      )
    );
    const pool = leagueRows.length ? leagueRows : tab.stats;
    if (!pool.length) continue;
    return [...pool].sort(
      (a, b) => seasonRank(b.season) - seasonRank(a.season)
    )[0]!;
  }
  return null;
}

function pickNtLine(profile: PlayerProfileData): CareerSeasonStat | null {
  const ntTabs = profile.teams.filter((t) => isNtTab(t.id, t.label));
  const rows = ntTabs.flatMap((t) => t.stats);
  if (!rows.length) return null;
  // Prefer latest major tournament (WM/EM/NL), else newest season
  const major = rows.filter((s) =>
    MAJOR_NT.test(
      `${s.competition.de} ${s.competition.en} ${s.competition.hr}`
    )
  );
  const pool = major.length ? major : rows;
  return [...pool].sort(
    (a, b) => seasonRank(b.season) - seasonRank(a.season)
  )[0]!;
}

function toLine(
  kind: "club" | "national",
  row: CareerSeasonStat | null,
  emptyLabel: LocaleText
): UniformStatLine {
  if (!row) {
    return {
      kind,
      label: emptyLabel,
      competition: emptyLabel,
      season: "–",
      apps: null,
      goals: null,
      assists: null,
      yellow: null,
    };
  }
  const prefix =
    kind === "club"
      ? loc("Club", "Club", "Klub")
      : loc("Nationalteam", "National team", "Reprezentacija");
  return {
    kind,
    label: {
      de: `${prefix.de} · ${row.competition.de} · ${row.season}`,
      en: `${prefix.en} · ${row.competition.en} · ${row.season}`,
      hr: `${prefix.hr} · ${row.competition.hr} · ${row.season}`,
    },
    competition: row.competition,
    season: row.season,
    apps: row.apps,
    goals: row.goals,
    assists: row.assists,
    yellow: row.yellow,
  };
}

/**
 * Immer genau 2 Zeilen – Club + Nationalteam – gleiche Struktur für jeden Spieler.
 */
export function getUniformStatLines(
  profile: PlayerProfileData | null | undefined
): UniformStatLine[] {
  if (!profile) {
    return [
      toLine("club", null, loc("Club · keine Daten", "Club · no data", "Klub · nema podataka")),
      toLine(
        "national",
        null,
        loc("Nationalteam · keine Daten", "National team · no data", "Reprezentacija · nema podataka")
      ),
    ];
  }
  return [
    toLine(
      "club",
      pickClubLine(profile),
      loc("Club · keine Daten", "Club · no data", "Klub · nema podataka")
    ),
    toLine(
      "national",
      pickNtLine(profile),
      loc(
        "Nationalteam · keine Daten",
        "National team · no data",
        "Reprezentacija · nema podataka"
      )
    ),
  ];
}

export function fmtStat(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "–";
  return String(n);
}
