/**
 * TV-Hinweise: nur bestätigte Live-Übertragungen (confirmed-broadcasts).
 * Keine „typischen Rechte“-Matrix mehr.
 */

import type { LeagueId, Match, TvChannel } from "@/types";
import {
  confirmedTvForMatch,
  attachCompetitionTv as attachEmpty,
} from "@/lib/confirmed-broadcasts";
import { isAllowedTvChannel } from "@/lib/constants";

export type RightsCertainty = "typical" | "confirmed";

/** @deprecated Always empty – use resolveMatchTvChannels(match) */
export function channelsForCompetition(_league: LeagueId): TvChannel[] {
  return [];
}

export function filterChannelsForMarket(
  channels: TvChannel[] | undefined,
  market: string | null | undefined
): TvChannel[] {
  if (!channels?.length) return [];
  const allowed = channels.filter(
    (c) =>
      isAllowedTvChannel(c.id) &&
      isAllowedTvChannel(c.name) &&
      c.certainty === "confirmed"
  );
  if (!market) {
    // Ohne Geo: bestätigte Kanäle trotzdem zeigen (selten, redaktionell)
    return allowed;
  }
  const m = market.toUpperCase();
  const geo = allowed.filter(
    (c) =>
      !c.markets?.length ||
      c.markets.map((x) => x.toUpperCase()).includes(m) ||
      (c.region &&
        c.region
          .toUpperCase()
          .split(/[/,]/)
          .map((x) => x.trim())
          .includes(m))
  );
  return geo;
}

export function otherMarketFreeHints(): {
  market: string;
  channels: TvChannel[];
}[] {
  return [];
}

export function rightsUpdatedAt(_league: LeagueId): string | null {
  return "2026-08-02";
}

export function attachCompetitionTv(league?: LeagueId): TvChannel[] {
  return attachEmpty(league);
}

export function resolveMatchTvChannels(m: Match): TvChannel[] {
  return confirmedTvForMatch(m);
}
