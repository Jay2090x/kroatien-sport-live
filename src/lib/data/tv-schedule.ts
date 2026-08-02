/**
 * Builds a "today on TV" schedule from:
 * 1) Live/upcoming matches with known channels (derived – real fixtures)
 * 2) Editorial channel blocks (HRT/Arena/Sportklub programme scaffolding)
 *
 * Export for /api/tv-guide and the UI.
 */

import type { Match } from "@/types";
import type { TvGuideSlot } from "@/types/guide";
import { isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { filterChannelsForMarket } from "@/lib/broadcast-rights";
import { isAllowedTvChannel } from "@/lib/constants";

function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function isToday(iso: string): boolean {
  const t = new Date(iso).getTime();
  return t >= startOfLocalDay().getTime() && t <= endOfLocalDay().getTime();
}

function channelIdFromName(name: string): string {
  if (/hrt\s*2/i.test(name)) return "hrt2";
  if (/hrt/i.test(name)) return "hrt";
  if (/arena/i.test(name)) return "arena1";
  if (/sport\s*klub|sportklub/i.test(name)) return "sportklub";
  if (/dazn/i.test(name)) return "dazn";
  if (/sky/i.test(name)) return "sky";
  return name.toLowerCase().replace(/\s+/g, "-").slice(0, 20);
}

/**
 * Editorial scaffolding – typical dayparts when we lack a full EPG feed.
 * Marked isScaffold so UI can label "Programm-Hinweis".
 */
function scaffoldSlots(locale: string): (TvGuideSlot & { scaffold?: boolean })[] {
  const base = startOfLocalDay();
  const at = (h: number, m = 0) => {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const titles =
    locale === "hr"
      ? {
          news: "Sportski dnevnik",
          mag: "Vatreni magazin",
          high: "HNL sažetak",
        }
      : locale === "en"
        ? {
            news: "Sports bulletin",
            mag: "Vatreni magazine",
            high: "HNL highlights",
          }
        : {
            news: "Sportski dnevnik",
            mag: "Vatreni Magazin",
            high: "HNL Highlights",
          };

  return [
    {
      id: "sc-hrt2-news",
      channelId: "hrt2",
      channelName: "HRT 2",
      start: at(18, 0),
      end: at(18, 30),
      title: titles.news,
      sport: "football",
      scaffold: true,
    },
    {
      id: "sc-hrt-mag",
      channelId: "hrt",
      channelName: "HRT 1",
      start: at(22, 15),
      end: at(22, 55),
      title: titles.mag,
      sport: "football",
      scaffold: true,
    },
    {
      id: "sc-sk-high",
      channelId: "sportklub",
      channelName: "Sport Klub",
      start: at(23, 0),
      end: at(23, 45),
      title: titles.high,
      sport: "football",
      scaffold: true,
    },
  ];
}

/**
 * Real schedule rows derived from matches airing today (or live).
 */
export function slotsFromMatches(
  matches: Match[],
  locale: string,
  market: string | null
): TvGuideSlot[] {
  const slots: TvGuideSlot[] = [];

  for (const m of matches) {
    const live = isLiveStatus(m.status);
    const today = isToday(m.kickoff) || live;
    if (!today) continue;
    if (m.status === "finished" || m.status === "cancelled") continue;

    const safeChannels = (m.tvChannels ?? []).filter(
      (c) => isAllowedTvChannel(c.id) && isAllowedTvChannel(c.name)
    );
    const channels = filterChannelsForMarket(safeChannels, market);
    let list =
      channels.length > 0
        ? [...channels]
        : [...safeChannels].slice(0, 2);

    if (list.length === 0) {
      // still show match on "Arena Sport" placeholder for HNL/NT so guide isn't empty
      if (m.league === "hnl" || m.league === "nations-league") {
        list = [
          {
            id: "arena-sport",
            name: "Arena Sport",
            type: "paid" as const,
            url: "https://www.arenasport.tv",
            region: "HR",
          },
        ];
      } else continue;
    }

    const home = localizeTeamName(m.homeTeam, locale);
    const away = localizeTeamName(m.awayTeam, locale);
    const title = live
      ? `LIVE: ${home} – ${away}`
      : `${home} – ${away}`;
    const start = new Date(m.kickoff);
    const end = new Date(start.getTime() + 2 * 3600_000);

    for (const ch of list.slice(0, 2)) {
      slots.push({
        id: `match-${m.id}-${ch.id}`,
        channelId: channelIdFromName(ch.name),
        channelName: shortChannel(ch.name),
        start: start.toISOString(),
        end: end.toISOString(),
        title: `${title} · ${m.leagueName.replace(/ · .*$/, "")}`,
        sport: "football",
        isLive: live,
      });
    }
  }

  return slots;
}

function shortChannel(name: string): string {
  if (/hrt\s*2/i.test(name)) return "HRT 2";
  if (/hrt/i.test(name)) return "HRT 1";
  if (/arena/i.test(name)) return "Arena Sport 1";
  if (/sport\s*klub|sportklub/i.test(name)) return "Sport Klub";
  return name;
}

export function buildTvSchedule(opts: {
  matches: Match[];
  locale?: string;
  market?: string | null;
  includeScaffold?: boolean;
}): TvGuideSlot[] {
  const locale = opts.locale ?? "de";
  const market = opts.market ?? null;
  const fromMatches = slotsFromMatches(opts.matches, locale, market);
  const scaffold =
    opts.includeScaffold !== false ? scaffoldSlots(locale) : [];

  // Prefer real match slots; add scaffold only if not overlapping same channel+hour
  const used = new Set(
    fromMatches.map(
      (s) => `${s.channelId}|${new Date(s.start).getHours()}`
    )
  );
  const extra = scaffold.filter((s) => {
    const key = `${s.channelId}|${new Date(s.start).getHours()}`;
    return !used.has(key);
  });

  return [...fromMatches, ...extra].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
}
