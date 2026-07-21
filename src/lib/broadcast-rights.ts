/**
 * Typische TV-/Streaming-Rechte nach Wettbewerb + Markt (ISO).
 * certainty: typical = branchenüblich, nicht pro Spiel bestätigt.
 * updatedAt = redaktioneller Stand – UI soll das zeigen.
 *
 * Keine illegalen Streams. Kein Default „überall Sky/DAZN“.
 */

import type { LeagueId, TvChannel } from "@/types";
import { TV_CHANNELS } from "@/lib/constants";

export type RightsCertainty = "typical" | "confirmed";

type ChannelRef = {
  id: string;
  certainty?: RightsCertainty;
};

type RightsRow = {
  competitions: LeagueId[];
  markets: string[];
  channels: ChannelRef[];
  updatedAt: string;
};

const UPDATED = "2026-07-20";

/**
 * Rechte-Matrix (vereinfacht, Saison 2025/26–2026/27 typisch).
 * Pro Markt nur relevante Einträge – nicht jede Liga bekommt denselben Default.
 */
const RIGHTS: RightsRow[] = [
  // HNL – Kroatien
  {
    competitions: ["hnl"],
    markets: ["HR"],
    channels: [
      { id: "hrt", certainty: "typical" },
      { id: "arena-sport", certainty: "typical" },
      { id: "sportklub", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  // Premier League
  {
    competitions: ["premier-league"],
    markets: ["DE", "AT", "CH"],
    channels: [
      { id: "sky-de", certainty: "typical" },
      { id: "dazn", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  {
    competitions: ["premier-league"],
    markets: ["HR", "BA", "SI", "RS"],
    channels: [
      { id: "arena-sport", certainty: "typical" },
      { id: "sportklub", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  // Bundesliga
  {
    competitions: ["bundesliga"],
    markets: ["DE", "AT"],
    channels: [
      { id: "sky-de", certainty: "typical" },
      { id: "dazn", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  {
    competitions: ["bundesliga"],
    markets: ["HR", "BA", "SI"],
    channels: [{ id: "sportklub", certainty: "typical" }],
    updatedAt: UPDATED,
  },
  // Serie A
  {
    competitions: ["serie-a"],
    markets: ["DE", "AT", "CH"],
    channels: [{ id: "dazn", certainty: "typical" }],
    updatedAt: UPDATED,
  },
  {
    competitions: ["serie-a"],
    markets: ["HR", "BA", "RS", "SI"],
    channels: [
      { id: "arena-sport", certainty: "typical" },
      { id: "sportklub", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  // La Liga
  {
    competitions: ["laliga"],
    markets: ["DE", "AT", "CH"],
    channels: [{ id: "dazn", certainty: "typical" }],
    updatedAt: UPDATED,
  },
  {
    competitions: ["laliga"],
    markets: ["HR"],
    channels: [{ id: "arena-sport", certainty: "typical" }],
    updatedAt: UPDATED,
  },
  // Ligue 1
  {
    competitions: ["ligue-1"],
    markets: ["DE", "AT"],
    channels: [{ id: "dazn", certainty: "typical" }],
    updatedAt: UPDATED,
  },
  // UEFA club competitions
  {
    competitions: ["champions-league", "europa-league", "conference-league"],
    markets: ["DE", "AT"],
    channels: [
      { id: "dazn", certainty: "typical" },
      { id: "sky-de", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  {
    competitions: ["champions-league", "europa-league", "conference-league"],
    markets: ["HR", "BA", "SI", "RS"],
    channels: [
      { id: "arena-sport", certainty: "typical" },
      { id: "sportklub", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  // National team / NL / WC / friendly – HR market: HRT often carries Vatreni
  {
    competitions: ["nations-league", "world-cup", "friendly"],
    markets: ["HR"],
    channels: [
      { id: "hrt", certainty: "typical" },
      { id: "hrt2", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  // DE/AT: public free only when rights exist – we do NOT list ARD/ZDF as live default
  // (rights vary). Paid typically Sky/DAZN for some windows – keep sparse.
  {
    competitions: ["nations-league", "world-cup", "friendly"],
    markets: ["DE", "AT"],
    channels: [
      { id: "dazn", certainty: "typical" },
      { id: "sky-de", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
];

const channelById = new Map(TV_CHANNELS.map((c) => [c.id, c]));

function toTvChannel(
  ref: ChannelRef,
  markets: string[],
  updatedAt: string
): TvChannel | null {
  const base = channelById.get(ref.id);
  if (!base) return null;
  return {
    ...base,
    markets: [...markets],
    region: markets.join("/"),
    certainty: ref.certainty ?? "typical",
  };
}

/** Alle typischen Kanäle für einen Wettbewerb (alle Märkte), mit market-Tags */
export function channelsForCompetition(league: LeagueId): TvChannel[] {
  const out: TvChannel[] = [];
  const seen = new Set<string>();
  for (const row of RIGHTS) {
    if (!row.competitions.includes(league)) continue;
    for (const ref of row.channels) {
      const ch = toTvChannel(ref, row.markets, row.updatedAt);
      if (!ch) continue;
      const key = `${ch.id}:${row.markets.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(ch);
    }
  }
  return out;
}

/** Nur Kanäle für ein ISO-Land (oder leeres Array) */
export function filterChannelsForMarket(
  channels: TvChannel[] | undefined,
  market: string | null | undefined
): TvChannel[] {
  if (!channels?.length) return [];
  if (!market) {
    // Ohne Geo: nichts vortäuschen – leer
    return [];
  }
  const m = market.toUpperCase();
  return channels.filter(
    (c) =>
      c.markets?.map((x) => x.toUpperCase()).includes(m) ||
      // legacy region string "DE/AT"
      (c.region && c.region.toUpperCase().split(/[/,]/).includes(m))
  );
}

/** Andere Märkte (für VPN-Hinweis), free-lastige Einträge priorisieren */
export function otherMarketFreeHints(
  league: LeagueId,
  userMarket: string | null
): { market: string; channels: TvChannel[] }[] {
  const byMarket = new Map<string, TvChannel[]>();
  for (const row of RIGHTS) {
    if (!row.competitions.includes(league)) continue;
    for (const market of row.markets) {
      if (userMarket && market.toUpperCase() === userMarket.toUpperCase())
        continue;
      const list = row.channels
        .map((ref) => toTvChannel(ref, [market], row.updatedAt))
        .filter((c): c is TvChannel => !!c && c.type === "free");
      if (!list.length) continue;
      const prev = byMarket.get(market) ?? [];
      byMarket.set(market, [...prev, ...list]);
    }
  }
  return [...byMarket.entries()].map(([market, channels]) => ({
    market,
    channels: dedupeChannels(channels),
  }));
}

function dedupeChannels(channels: TvChannel[]): TvChannel[] {
  const map = new Map<string, TvChannel>();
  for (const c of channels) map.set(c.id, c);
  return [...map.values()];
}

export function rightsUpdatedAt(league: LeagueId): string | null {
  const row = RIGHTS.find((r) => r.competitions.includes(league));
  return row?.updatedAt ?? null;
}

/**
 * Server-side: alle markierten Kanäle am Match speichern (Client filtert nach Geo).
 * Ersetzt guessTv / pickTv.
 */
export function attachCompetitionTv(league: LeagueId): TvChannel[] {
  return channelsForCompetition(league);
}
