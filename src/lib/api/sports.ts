/**
 * LIVE Sport-Daten – TheSportsDB (immer) + optional football-data.org + OpenLigaDB
 * Keine Platzhalter-Matches: nur echte API-Ergebnisse.
 *
 * Free Key TheSportsDB: "3"
 * Caching: Next.js fetch revalidate (120s Events, 3600s Spieler)
 */

import type { LeagueId, Match, MatchStatus, Player, PlayerPosition } from "@/types";
import {
  FALLBACK_PLAYERS,
  PLAYER_SEARCH_NAMES,
} from "@/lib/data/fallback-players";
import { TV_CHANNELS } from "@/lib/constants";
import {
  enrichNationalTeamMatch,
  CROATIA_NT_TEAM_ID,
  isNationalTeamMatch,
} from "@/lib/data/national-team";
import { applySystemAvailability } from "@/lib/player-availability";
import { fetchCroatiaNationalTeamMatches } from "@/lib/api/croatia-nt";

export interface LiveBundle {
  players: Player[];
  matches: Match[];
  source: "api" | "partial" | "empty";
  errors: string[];
  fetchedAt: string;
}

const TSDB = "https://www.thesportsdb.com/api/v1/json";

function apiKey(override?: string) {
  return (
    override ||
    process.env.THESPORTSDB_API_KEY ||
    process.env.NEXT_PUBLIC_THESPORTSDB_KEY ||
    "3"
  );
}

export async function fetchFromExternalApis(apiKeys?: {
  theSportsDbKey?: string;
  footballDataKey?: string;
}): Promise<LiveBundle> {
  try {
    return await fetchFromExternalApisInner(apiKeys);
  } catch (e) {
    return {
      players: FALLBACK_PLAYERS.map((p) => ({ ...p })),
      matches: [],
      source: "empty",
      errors: [e instanceof Error ? e.message : "external apis failed"],
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function fetchFromExternalApisInner(apiKeys?: {
  theSportsDbKey?: string;
  footballDataKey?: string;
}): Promise<LiveBundle> {
  const key = apiKey(apiKeys?.theSportsDbKey);
  const footballDataKey =
    apiKeys?.footballDataKey || process.env.FOOTBALL_DATA_API_KEY || "";
  const errors: string[] = [];

  // Players: Seed sofort, Live optional (Rate-Limit TheSportsDB)
  const [playersResult] = await Promise.allSettled([fetchLivePlayers(key)]);

  let players: Player[] =
    playersResult.status === "fulfilled" ? playersResult.value.players : [];
  if (playersResult.status === "rejected") {
    errors.push(`players: ${String(playersResult.reason)}`);
  } else if (playersResult.value.errors.length) {
    errors.push(...playersResult.value.errors);
  }

  // Stammdaten mergen (IDs, Fallback-Bilder nur wenn API kein Bild liefert)
  players = mergePlayersPreferLive(players, FALLBACK_PLAYERS);

  if (!players.length) {
    // Ohne Spieler keine Club-Events – kuratierte Liste als Player-Seed, Matches live
    players = FALLBACK_PLAYERS.map((p) => ({ ...p }));
    errors.push("player-lookup-empty: using seed roster for club matching only");
  }

  // Clubs + NT: Nationalteam-ID immer ZUERST (sonst cut bei slice)
  const clubIds = players
    .map((p) => p.clubId)
    .filter((id): id is string => Boolean(id));
  const teamIds = [
    ...new Set([CROATIA_NT_TEAM_ID, ...clubIds]),
  ];

  const [eventsResult, fdResult, olResult, croNtResult] = await Promise.allSettled([
    fetchTeamEvents(key, teamIds, players),
    footballDataKey
      ? fetchFootballData(footballDataKey, players)
      : Promise.resolve([] as Match[]),
    fetchOpenLigaDb(players),
    // ESPN: zuverlässige Vatreni-Spiele (WM, Quali, NL, Freundschaft)
    fetchCroatiaNationalTeamMatches(),
  ]);

  let matches: Match[] = [];

  // ESPN-Nationalteam zuerst (echte bekannte Spiele)
  if (croNtResult.status === "fulfilled") {
    matches.push(...croNtResult.value.matches);
    errors.push(...croNtResult.value.errors);
  } else {
    errors.push(`croatia-nt: ${String(croNtResult.reason)}`);
  }

  if (eventsResult.status === "fulfilled") {
    matches.push(...eventsResult.value.matches);
    errors.push(...eventsResult.value.errors);
  } else {
    errors.push(`events: ${String(eventsResult.reason)}`);
  }

  if (fdResult.status === "fulfilled") matches.push(...fdResult.value);
  else if (footballDataKey) errors.push(`football-data: ${String(fdResult.reason)}`);

  if (olResult.status === "fulfilled") matches.push(...olResult.value);
  else errors.push(`openligadb: ${String(olResult.reason)}`);

  matches = dedupeById(matches).sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  // Live-Scores: Tages-Events mergen (Status aktualisieren)
  try {
    const liveDay = await fetchSoccerDays(key, players, [-1, 0, 1, 2, 3]);
    matches = mergeMatchScores(matches, liveDay);
    // Day-Events die noch fehlen hinzufügen
    for (const m of liveDay) {
      if (!matches.some((x) => x.id === m.id || sameFixture(x, m))) {
        matches.push(m);
      }
    }
    matches = dedupeById(matches).sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
  } catch (e) {
    errors.push(`eventsday: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Nationalteam: Metadaten (ohne Spekulations-Kader)
  matches = matches.map((m) =>
    isNationalTeamMatch(m) ? enrichNationalTeamMatch(m) : m
  );

  // System-Status für alle Spieler
  players = applySystemAvailability(players);

  const source: LiveBundle["source"] =
    matches.length && players.length
      ? errors.length
        ? "partial"
        : "api"
      : matches.length || players.length
        ? "partial"
        : "empty";

  return {
    players,
    matches,
    source,
    errors: errors.filter(Boolean),
    fetchedAt: new Date().toISOString(),
  };
}

function sameFixture(a: Match, b: Match) {
  return (
    a.homeTeam === b.homeTeam &&
    a.awayTeam === b.awayTeam &&
    a.kickoff.slice(0, 10) === b.kickoff.slice(0, 10)
  );
}

function mergeMatchScores(base: Match[], updates: Match[]): Match[] {
  return base.map((m) => {
    const u = updates.find((x) => x.id === m.id || sameFixture(x, m));
    if (!u) return m;
    return {
      ...m,
      homeScore: u.homeScore ?? m.homeScore,
      awayScore: u.awayScore ?? m.awayScore,
      status: u.status !== "scheduled" ? u.status : m.status,
      minute: u.minute ?? m.minute,
      homeTeamLogo: m.homeTeamLogo || u.homeTeamLogo,
      awayTeamLogo: m.awayTeamLogo || u.awayTeamLogo,
    };
  });
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return Array.from(map.values());
}

function mergePlayersPreferLive(live: Player[], seed: Player[]): Player[] {
  const map = new Map<string, Player>();
  for (const s of seed) map.set(s.id, s);
  for (const p of live) {
    const existing = map.get(p.id) || seed.find((s) => s.name === p.name);
    if (existing) {
      map.set(existing.id, {
        ...existing,
        ...p,
        id: existing.id,
        imageUrl: p.imageUrl || existing.imageUrl,
        club: p.club && p.club !== "_Retired-Soccer" ? p.club : existing.club,
        clubId: p.clubId || existing.clubId,
        shirtNumber: p.shirtNumber ?? existing.shirtNumber,
      });
    } else {
      map.set(p.id, p);
    }
  }
  return Array.from(map.values()).filter((p) => p.isActive !== false);
}

async function fetchJson<T>(
  url: string,
  revalidate: number
): Promise<{ data: T | null; error?: string }> {
  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });
    if (res.status === 429) {
      return { data: null, error: `429 rate limit: ${url}` };
    }
    if (!res.ok) return { data: null, error: `HTTP ${res.status}: ${url}` };
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("json") && !ct.includes("text")) {
      return { data: null, error: `non-json: ${url}` };
    }
    const text = await res.text();
    if (text.startsWith("<") || text.includes("error code")) {
      return { data: null, error: `blocked: ${url}` };
    }
    return { data: JSON.parse(text) as T };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

interface TsdbPlayer {
  idPlayer: string;
  idTeam?: string;
  strPlayer: string;
  strTeam?: string;
  strTeam2?: string;
  strNationality?: string;
  strPosition?: string;
  dateBorn?: string;
  strThumb?: string | null;
  strCutout?: string | null;
  strNumber?: string | null;
  strStatus?: string | null;
}

async function fetchLivePlayers(key: string): Promise<{
  players: Player[];
  errors: string[];
}> {
  const errors: string[] = [];
  const players: Player[] = [];

  // 1) Lookup per TheSportsDB-ID (präzise, echte Club/Bilder)
  const ids = FALLBACK_PLAYERS.map((p) => p.externalIds?.theSportsDb).filter(
    Boolean
  ) as string[];

  for (let i = 0; i < ids.length; i += 6) {
    const batch = ids.slice(i, i + 6);
    const results = await Promise.all(
      batch.map(async (id) => {
        const { data, error } = await fetchJson<{ players: TsdbPlayer[] | null }>(
          `${TSDB}/${key}/lookupplayer.php?id=${id}`,
          3600
        );
        if (error) errors.push(error);
        return data?.players?.[0] ?? null;
      })
    );
    for (const raw of results) {
      if (!raw) continue;
      const mapped = toPlayer(raw);
      if (mapped) players.push(mapped);
    }
  }

  // 2) Fehlende per Name suchen
  const foundNames = new Set(players.map((p) => p.name.toLowerCase()));
  const missingSearches = PLAYER_SEARCH_NAMES.filter((name) => {
    const last = name.split(" ").slice(-1)[0].toLowerCase();
    return ![...foundNames].some((n) => n.includes(last));
  });

  for (let i = 0; i < missingSearches.length; i += 4) {
    const batch = missingSearches.slice(i, i + 4);
    const results = await Promise.all(
      batch.map(async (name) => {
        const { data, error } = await fetchJson<{ player: TsdbPlayer[] | null }>(
          `${TSDB}/${key}/searchplayers.php?p=${encodeURIComponent(name)}`,
          3600
        );
        if (error) errors.push(error);
        const list = data?.player ?? [];
        return (
          list.find(
            (p) =>
              p.strNationality === "Croatia" || p.strNationality === "Croatian"
          ) ?? null
        );
      })
    );
    for (const raw of results) {
      if (!raw) continue;
      const mapped = toPlayer(raw);
      if (mapped && !players.some((p) => p.name === mapped.name)) {
        players.push(mapped);
      }
    }
  }

  return { players: dedupeById(players), errors };
}

function toPlayer(p: TsdbPlayer): Player | null {
  if (
    p.strNationality &&
    p.strNationality !== "Croatia" &&
    p.strNationality !== "Croatian"
  ) {
    return null;
  }
  if (p.strStatus === "Retired") return null;

  const seed = FALLBACK_PLAYERS.find(
    (f) =>
      f.externalIds?.theSportsDb === p.idPlayer ||
      f.name === p.strPlayer ||
      normalize(f.name) === normalize(p.strPlayer)
  );

  const pos = mapPosition(p.strPosition);
  const team =
    p.strTeam && p.strTeam !== "_Retired-Soccer"
      ? p.strTeam
      : seed?.club || "Unknown";
  const league = mapLeagueFromTeam(team);

  return {
    id: seed?.id || slugifyId(p.strPlayer),
    name: p.strPlayer,
    shortName: seed?.shortName || p.strPlayer.split(" ").slice(-1)[0],
    club: team,
    clubId: p.idTeam || seed?.clubId,
    league: league.id,
    leagueName: league.name,
    position: pos.position,
    positionLabel: pos.label,
    nationality: "HR",
    shirtNumber: p.strNumber ? Number(p.strNumber) : seed?.shirtNumber,
    imageUrl: p.strCutout || p.strThumb || seed?.imageUrl || undefined,
    dateOfBirth: p.dateBorn || seed?.dateOfBirth,
    externalIds: { theSportsDb: p.idPlayer },
    isActive: true,
  };
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugifyId(name: string): string {
  return normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapPosition(raw?: string | null): { position: PlayerPosition; label: string } {
  const p = (raw || "").toLowerCase();
  if (p.includes("goalkeeper")) return { position: "GK", label: "Torwart" };
  if (p.includes("centre-back") || p.includes("center-back"))
    return { position: "CB", label: "Innenverteidiger" };
  if (p.includes("left-back")) return { position: "LB", label: "Linker Verteidiger" };
  if (p.includes("right-back")) return { position: "RB", label: "Rechter Verteidiger" };
  if (p.includes("defensive mid"))
    return { position: "CDM", label: "Defensives Mittelfeld" };
  if (p.includes("attacking mid"))
    return { position: "CAM", label: "Offensives Mittelfeld" };
  if (p.includes("left mid") || p.includes("left wing"))
    return { position: "LW", label: "Linksaußen" };
  if (p.includes("right mid") || p.includes("right wing"))
    return { position: "RW", label: "Rechtsaußen" };
  if (p.includes("forward") || p.includes("striker") || p.includes("centre-forward"))
    return { position: "ST", label: "Stürmer" };
  if (p.includes("midfield")) return { position: "CM", label: "Zentrales Mittelfeld" };
  if (p.includes("defender")) return { position: "CB", label: "Verteidiger" };
  return { position: "CM", label: raw || "Mittelfeld" };
}

function mapLeagueFromTeam(team: string, leagueHint?: string): { id: LeagueId; name: string } {
  const t = `${team} ${leagueHint || ""}`.toLowerCase();
  if (
    t.includes("premier league") ||
    t.includes("english premier") ||
    ["manchester city", "crystal palace", "arsenal", "chelsea", "liverpool"].some((x) =>
      t.includes(x)
    )
  )
    return { id: "premier-league", name: "Premier League" };
  if (
    t.includes("bundesliga") ||
    [
      "bayern",
      "wolfsburg",
      "union berlin",
      "augsburg",
      "hoffenheim",
      "hamburg",
      "dortmund",
      "leverkusen",
    ].some((x) => t.includes(x))
  )
    return { id: "bundesliga", name: "Bundesliga" };
  if (
    t.includes("serie a") ||
    t.includes("italian serie") ||
    ["milan", "atalanta", "como", "torino", "juventus", "inter", "roma"].some((x) =>
      t.includes(x)
    )
  )
    return { id: "serie-a", name: "Serie A" };
  if (
    t.includes("la liga") ||
    t.includes("spanish") ||
    ["osasuna", "real sociedad", "barcelona", "real madrid"].some((x) => t.includes(x))
  )
    return { id: "laliga", name: "La Liga" };
  if (
    t.includes("hnl") ||
    t.includes("croatian") ||
    ["rijeka", "dinamo", "hajduk"].some((x) => t.includes(x))
  )
    return { id: "hnl", name: "HNL" };
  if (t.includes("champions")) return { id: "champions-league", name: "Champions League" };
  if (t.includes("europa league")) return { id: "europa-league", name: "Europa League" };
  if (t.includes("nations")) return { id: "nations-league", name: "Nations League" };
  if (t.includes("friendly") || t.includes("club friendlies"))
    return { id: "friendly", name: "Freundschaftsspiel" };
  if (leagueHint) return { id: "other", name: leagueHint };
  return { id: "other", name: "Sonstige" };
}

interface TsdbEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  dateEvent: string;
  strTime?: string;
  strTimestamp?: string;
  strLeague?: string;
  strVenue?: string;
  strStatus?: string;
  strProgress?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strPostponed?: string;
}

async function fetchTeamEvents(
  key: string,
  teamIds: string[],
  players: Player[]
): Promise<{ matches: Match[]; errors: string[] }> {
  const errors: string[] = [];
  const matches: Match[] = [];
  // Rate-Limit: max 16 Teams – NT-ID (133912) bleibt durch Priorisierung vorn
  const ids = teamIds.slice(0, 16);

  for (let i = 0; i < ids.length; i += 4) {
    const chunk = ids.slice(i, i + 4);
    const results = await Promise.all(
      chunk.map(async (teamId) => {
        const [next, last] = await Promise.all([
          fetchJson<{ events: TsdbEvent[] | null }>(
            `${TSDB}/${key}/eventsnext.php?id=${teamId}`,
            120
          ),
          fetchJson<{ results: TsdbEvent[] | null }>(
            `${TSDB}/${key}/eventslast.php?id=${teamId}`,
            120
          ),
        ]);
        if (next.error) errors.push(next.error);
        if (last.error) errors.push(last.error);
        return [
          ...(last.data?.results ?? []).slice(0, 3),
          ...(next.data?.events ?? []).slice(0, 5),
        ];
      })
    );
    for (const list of results) {
      for (const e of list) {
        const m = mapEventToMatch(e, players);
        if (m) matches.push(m);
      }
    }
  }

  return { matches: dedupeById(matches), errors };
}

async function fetchSoccerDays(
  key: string,
  players: Player[],
  dayOffsets: number[]
): Promise<Match[]> {
  const matches: Match[] = [];
  for (const offset of dayOffsets) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    const day = d.toISOString().slice(0, 10);
    const { data } = await fetchJson<{ events: TsdbEvent[] | null }>(
      `${TSDB}/${key}/eventsday.php?d=${day}&s=Soccer`,
      120
    );
    for (const e of data?.events ?? []) {
      const m = mapEventToMatch(e, players);
      if (m) matches.push(m);
    }
  }
  return dedupeById(matches);
}

function isCroatiaTeamName(name: string): boolean {
  return /croatia|kroatien|hrvatska/i.test(name);
}

function mapEventToMatch(e: TsdbEvent, players: Player[]): Match | null {
  if (!e?.idEvent || !e.strHomeTeam || !e.strAwayTeam) return null;

  const home = e.strHomeTeam;
  const away = e.strAwayTeam;
  const isNt =
    isCroatiaTeamName(home) ||
    isCroatiaTeamName(away) ||
    e.idHomeTeam === CROATIA_NT_TEAM_ID ||
    e.idAwayTeam === CROATIA_NT_TEAM_ID;

  const croatianPlayers = players
    .filter((p) => {
      if (!p.club) return false;
      return (
        fuzzyTeamMatch(p.club, home) ||
        fuzzyTeamMatch(p.club, away) ||
        (p.clubId && (p.clubId === e.idHomeTeam || p.clubId === e.idAwayTeam))
      );
    })
    .map((p) => {
      const side: "home" | "away" =
        fuzzyTeamMatch(p.club, home) || p.clubId === e.idHomeTeam
          ? "home"
          : "away";
      return {
        playerId: p.id,
        playerName: p.name,
        teamSide: side,
        position: p.position,
        // Keine erfundenen Events – nur echte API-Daten (hier keine Player-Stats)
        isStarter: undefined,
        expectedToPlay: undefined,
      };
    });

  // NT: Match behalten auch ohne Kader (Kader oft noch nicht nominiert)
  // Club-Matches ohne kroatische Spieler weglassen
  if (!isNt && !croatianPlayers.length) return null;

  const kickoff = e.strTimestamp
    ? new Date(e.strTimestamp).toISOString()
    : new Date(`${e.dateEvent}T${(e.strTime || "15:00:00").slice(0, 8)}Z`).toISOString();

  const league = mapLeagueFromTeam("", e.strLeague);
  const status = mapTsdbStatus(e.strStatus, e.strProgress, e.intHomeScore, e.strPostponed);

  const homeScore =
    e.intHomeScore != null && e.intHomeScore !== ""
      ? Number(e.intHomeScore)
      : null;
  const awayScore =
    e.intAwayScore != null && e.intAwayScore !== ""
      ? Number(e.intAwayScore)
      : null;

  return {
    id: `tsdb-${e.idEvent}`,
    homeTeam: home,
    awayTeam: away,
    homeTeamLogo: e.strHomeTeamBadge,
    awayTeamLogo: e.strAwayTeamBadge,
    homeScore: Number.isFinite(homeScore as number) ? homeScore : null,
    awayScore: Number.isFinite(awayScore as number) ? awayScore : null,
    status,
    minute: parseMinute(e.strProgress),
    kickoff,
    league: league.id === "other" && e.strLeague ? "other" : league.id,
    leagueName: e.strLeague || league.name,
    venue: e.strVenue || undefined,
    croatianPlayers,
    tvChannels: guessTv(league.id),
    externalIds: { theSportsDb: e.idEvent },
  };
}

function fuzzyTeamMatch(a: string, b: string): boolean {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\b(fc|afc|sc|ssc|gnk|hnk|vfl|rb|ac|as|cf|fk|nk|sv|1\.)\b/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  const ca = clean(a);
  const cb = clean(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  if (ca.includes(cb) || cb.includes(ca)) return true;
  const a0 = ca.split(" ")[0];
  const b0 = cb.split(" ")[0];
  return a0.length > 3 && a0 === b0;
}

function mapTsdbStatus(
  status?: string | null,
  progress?: string | null,
  homeScore?: string | null,
  postponed?: string | null
): MatchStatus {
  if (postponed === "yes") return "postponed";
  const s = (status || "").toUpperCase();
  const p = (progress || "").toLowerCase();
  if (s === "FT" || s === "AET" || s === "PEN" || s.includes("FINISH")) return "finished";
  if (s === "PST" || s.includes("POSTPON")) return "postponed";
  if (s === "CANC" || s.includes("CANCEL")) return "cancelled";
  if (s === "HT" || p.includes("ht") || s.includes("HALF")) return "halftime";
  if (
    s === "LIVE" ||
    s === "1H" ||
    s === "2H" ||
    s === "ET" ||
    s === "BT" ||
    s === "P" ||
    /^\d/.test(p)
  )
    return "live";
  if (s === "NS" || s === "TBD" || s === "NOT STARTED" || !s) return "scheduled";
  // Score vorhanden + nicht FT → oft live
  if (homeScore != null && homeScore !== "" && s !== "FT") return "live";
  return "scheduled";
}

function parseMinute(progress?: string | null): number | null {
  if (!progress) return null;
  const m = progress.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

function guessTv(league: LeagueId) {
  switch (league) {
    case "hnl":
      return TV_CHANNELS.filter((c) => ["hrt", "hrt2", "arena-sport"].includes(c.id));
    case "bundesliga":
    case "premier-league":
      return TV_CHANNELS.filter((c) => ["sky-de", "dazn"].includes(c.id));
    case "serie-a":
    case "laliga":
      return TV_CHANNELS.filter((c) => ["dazn", "sky-de"].includes(c.id));
    default:
      return TV_CHANNELS.filter((c) => ["dazn", "sky-de"].includes(c.id));
  }
}

/** OpenLigaDB – echte Bundesliga-Daten, kein API-Key */
async function fetchOpenLigaDb(players: Player[]): Promise<Match[]> {
  const blPlayers = players.filter((p) => p.league === "bundesliga");
  if (!blPlayers.length) return [];

  const matches: Match[] = [];
  // Aktuelle + nächste Saison-Endpunkte
  const endpoints = [
    "https://api.openligadb.de/getmatchdata/bl1",
    "https://api.openligadb.de/getmatchdata/bl1/2026",
    "https://api.openligadb.de/getmatchdata/bl1/2025",
  ];

  for (const url of endpoints) {
    const { data } = await fetchJson<OpenLigaMatch[]>(url, 180);
    if (!Array.isArray(data)) continue;

    for (const m of data) {
      const home = m.team1?.teamName || "";
      const away = m.team2?.teamName || "";
      const croatianPlayers = blPlayers
        .filter((p) => fuzzyTeamMatch(p.club, home) || fuzzyTeamMatch(p.club, away))
        .map((p) => ({
          playerId: p.id,
          playerName: p.name,
          teamSide: (fuzzyTeamMatch(p.club, home) ? "home" : "away") as
            | "home"
            | "away",
          position: p.position,
        }));
      if (!croatianPlayers.length) continue;

      const result = m.matchResults?.find((r) => r.resultTypeId === 2) // Endstand
        || m.matchResults?.slice(-1)[0];
      const finished = Boolean(m.matchIsFinished);
      const kickoff = m.matchDateTimeUTC || m.matchDateTime;

      matches.push({
        id: `ol-${m.matchID}`,
        homeTeam: home,
        awayTeam: away,
        homeTeamLogo: m.team1?.teamIconUrl,
        awayTeamLogo: m.team2?.teamIconUrl,
        homeScore: result?.pointsTeam1 ?? null,
        awayScore: result?.pointsTeam2 ?? null,
        status: finished ? "finished" : "scheduled",
        kickoff: new Date(kickoff).toISOString(),
        league: "bundesliga",
        leagueName: m.leagueName || "Bundesliga",
        venue: undefined,
        croatianPlayers,
        tvChannels: guessTv("bundesliga"),
      });
    }
    if (matches.length) break;
  }

  return dedupeById(matches);
}

interface OpenLigaMatch {
  matchID: number;
  matchDateTime: string;
  matchDateTimeUTC?: string;
  leagueName?: string;
  matchIsFinished: boolean;
  team1?: { teamName: string; teamIconUrl?: string };
  team2?: { teamName: string; teamIconUrl?: string };
  matchResults?: Array<{
    resultTypeId: number;
    pointsTeam1: number;
    pointsTeam2: number;
  }>;
}

async function fetchFootballData(
  apiKeyFd: string,
  players: Player[]
): Promise<Match[]> {
  const competitions = ["SA", "PL", "BL1", "PD", "CL"];
  const matches: Match[] = [];

  for (const code of competitions) {
    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${code}/matches?status=SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED&limit=40`,
      {
        headers: { "X-Auth-Token": apiKeyFd },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) continue;
    const json = (await res.json()) as {
      matches?: Array<Record<string, unknown>>;
    };

    for (const m of json.matches ?? []) {
      const home = m.homeTeam as { name?: string } | undefined;
      const away = m.awayTeam as { name?: string } | undefined;
      const score = m.score as {
        fullTime?: { home?: number | null; away?: number | null };
        halfTime?: { home?: number | null; away?: number | null };
      } | undefined;
      const statusRaw = String(m.status ?? "SCHEDULED");
      const homeName = home?.name ?? "Home";
      const awayName = away?.name ?? "Away";

      const croatianPlayers = players
        .filter(
          (p) =>
            fuzzyTeamMatch(p.club, homeName) || fuzzyTeamMatch(p.club, awayName)
        )
        .map((p) => ({
          playerId: p.id,
          playerName: p.name,
          teamSide: (fuzzyTeamMatch(p.club, homeName) ? "home" : "away") as
            | "home"
            | "away",
          position: p.position,
        }));

      if (!croatianPlayers.length) continue;

      const homeScore =
        score?.fullTime?.home ?? score?.halfTime?.home ?? null;
      const awayScore =
        score?.fullTime?.away ?? score?.halfTime?.away ?? null;

      matches.push({
        id: `fd-${m.id}`,
        homeTeam: homeName,
        awayTeam: awayName,
        homeScore,
        awayScore,
        status: mapFdStatus(statusRaw),
        kickoff: String(m.utcDate),
        league: mapFdCompetition(code),
        leagueName: mapFdCompetitionName(code),
        croatianPlayers,
        tvChannels: guessTv(mapFdCompetition(code)),
      });
    }
  }

  return matches;
}

function mapFdStatus(status: string): MatchStatus {
  switch (status) {
    case "LIVE":
    case "IN_PLAY":
      return "live";
    case "PAUSED":
      return "halftime";
    case "FINISHED":
      return "finished";
    case "POSTPONED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled";
  }
}

function mapFdCompetition(code: string): LeagueId {
  switch (code) {
    case "PL":
      return "premier-league";
    case "BL1":
      return "bundesliga";
    case "SA":
      return "serie-a";
    case "PD":
      return "laliga";
    case "CL":
      return "champions-league";
    default:
      return "other";
  }
}

function mapFdCompetitionName(code: string): string {
  switch (code) {
    case "PL":
      return "Premier League";
    case "BL1":
      return "Bundesliga";
    case "SA":
      return "Serie A";
    case "PD":
      return "La Liga";
    case "CL":
      return "Champions League";
    default:
      return code;
  }
}
