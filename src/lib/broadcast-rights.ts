/**
 * Typische TV-/Mediathek-Hinweise nach Wettbewerb + Markt (ISO).
 * Legal-Launch: keine Sky/DAZN/Viaplay, kein VPN.
 * certainty: typical = branchenüblich, nicht pro Spiel bestätigt.
 */

import type { LeagueId, TvChannel } from "@/types";
import { TV_CHANNELS, isAllowedTvChannel } from "@/lib/constants";

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

const UPDATED = "2026-08-02";

/**
 * Nur HRT / Arena / Sportklub / MAX – regionale Hinweise.
 * DE/AT ohne Free-Rechte-Eintrag → leere Liste (ehrlich).
 */
const RIGHTS: RightsRow[] = [
  {
    competitions: ["hnl"],
    markets: ["HR"],
    channels: [
      { id: "hrt", certainty: "typical" },
      { id: "hrt2", certainty: "typical" },
      { id: "arena-sport", certainty: "typical" },
      { id: "sportklub", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  {
    competitions: ["premier-league", "bundesliga", "serie-a", "laliga", "ligue-1"],
    markets: ["HR", "BA", "SI", "RS", "ME"],
    channels: [
      { id: "arena-sport", certainty: "typical" },
      { id: "sportklub", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  {
    competitions: ["champions-league", "europa-league", "conference-league"],
    markets: ["HR", "BA", "SI", "RS", "ME"],
    channels: [
      { id: "arena-sport", certainty: "typical" },
      { id: "sportklub", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  {
    competitions: ["nations-league", "world-cup", "friendly"],
    markets: ["HR"],
    channels: [
      { id: "hrt", certainty: "typical" },
      { id: "hrt2", certainty: "typical" },
    ],
    updatedAt: UPDATED,
  },
  {
    competitions: ["nations-league", "world-cup", "friendly"],
    markets: ["BA", "SI", "RS", "ME"],
    channels: [{ id: "arena-sport", certainty: "typical" }],
    updatedAt: UPDATED,
  },
];

const channelById = new Map(
  TV_CHANNELS.filter((c) => isAllowedTvChannel(c.id)).map((c) => [c.id, c])
);

function toTvChannel(
  ref: ChannelRef,
  markets: string[]
): TvChannel | null {
  if (!isAllowedTvChannel(ref.id)) return null;
  const base = channelById.get(ref.id);
  if (!base) return null;
  return {
    ...base,
    markets: [...markets],
    region: markets.join("/"),
    certainty: ref.certainty ?? "typical",
  };
}

/** Alle erlaubten Kanäle für einen Wettbewerb (alle Märkte) */
export function channelsForCompetition(league: LeagueId): TvChannel[] {
  const out: TvChannel[] = [];
  const seen = new Set<string>();
  for (const row of RIGHTS) {
    if (!row.competitions.includes(league)) continue;
    for (const ref of row.channels) {
      const ch = toTvChannel(ref, row.markets);
      if (!ch) continue;
      const key = `${ch.id}:${row.markets.join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(ch);
    }
  }
  return out;
}

/** Nur Kanäle für ein ISO-Land */
export function filterChannelsForMarket(
  channels: TvChannel[] | undefined,
  market: string | null | undefined
): TvChannel[] {
  if (!channels?.length) return [];
  const allowed = channels.filter(
    (c) => isAllowedTvChannel(c.id) && isAllowedTvChannel(c.name)
  );
  if (!market) return [];
  const m = market.toUpperCase();
  return allowed.filter(
    (c) =>
      c.markets?.map((x) => x.toUpperCase()).includes(m) ||
      (c.region &&
        c.region
          .toUpperCase()
          .split(/[/,]/)
          .map((x) => x.trim())
          .includes(m))
  );
}

/** @deprecated VPN-Hinweise entfernt – immer leeres Array */
export function otherMarketFreeHints(): {
  market: string;
  channels: TvChannel[];
}[] {
  return [];
}

export function rightsUpdatedAt(league: LeagueId): string | null {
  const row = RIGHTS.find((r) => r.competitions.includes(league));
  return row?.updatedAt ?? null;
}

export function attachCompetitionTv(league: LeagueId): TvChannel[] {
  return channelsForCompetition(league);
}
