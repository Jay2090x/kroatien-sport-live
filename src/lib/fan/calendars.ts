import { cachedSource, REVALIDATE } from "../cache";
import { dataLabel, type Lang } from "../i18n";
import { SITE } from "../site";
import { formatKickoff } from "../time";
import { loadEspnCroatiaMatches } from "../sources/espn";
import { getCroClubEuropeGames } from "../sources/abroad";
import { buildIcs, type IcsEvent } from "./ics";

const DAY = 86_400_000;

export interface CalendarFeed {
  ics: string;
  upcoming: Array<{ start: string; summary: string }>;
}

export async function vatreniCalendar(lang: Lang, now = Date.now()): Promise<CalendarFeed | null> {
  const nt = await cachedSource(["nt", "espn"], REVALIDATE.default, loadEspnCroatiaMatches);
  if (!nt) return null;
  const de = lang === "de";
  const events: IcsEvent[] = nt.data.matches
    .filter((m) => Date.parse(m.kickoff) >= now - 180 * DAY)
    .map((m) => {
      const score = m.state === "post" && m.homeScore != null ? ` ${m.homeScore}:${m.awayScore}` : "";
      const comp = dataLabel(m.competition, lang);
      return {
        uid: `${m.id}@kroatien-sport-live`,
        start: m.kickoff,
        durationMin: 120,
        summary: `${dataLabel(m.home, lang)} – ${dataLabel(m.away, lang)}${score} (${comp})`,
        location: m.venue,
        description: de
          ? `${comp} · Anstoß ${formatKickoff(m.kickoff, "de")} Uhr (Wiener Zeit). Live-Ticker: ${SITE.url}/live · Quelle: ESPN. Alle Angaben ohne Gewähr.`
          : `${comp} · Početak ${formatKickoff(m.kickoff, "hr")} (bečko vrijeme). Prijenos uživo: ${SITE.url}/hr/live · Izvor: ESPN. Bez jamstva točnosti.`,
        url: `${SITE.url}${de ? "/live" : "/hr/live"}`,
        status: m.state === "cancelled" ? "CANCELLED" : m.state === "postponed" ? "TENTATIVE" : "CONFIRMED",
      } satisfies IcsEvent;
    });
  const ics = buildIcs({
    name: de ? "Vatreni – Länderspiele" : "Vatreni – utakmice reprezentacije",
    description: de
      ? "Alle Spiele der kroatischen Nationalmannschaft (Kroatien Sport Live, Quelle: ESPN)"
      : "Sve utakmice hrvatske reprezentacije (Kroatien Sport Live, izvor: ESPN)",
    events,
    now,
  });
  return {
    ics,
    upcoming: events.filter((e) => Date.parse(e.start) > now).slice(0, 5).map((e) => ({ start: e.start, summary: e.summary })),
  };
}

export async function europeCalendar(now = Date.now()): Promise<CalendarFeed | null> {
  const data = await getCroClubEuropeGames(now);
  if (!data) return null;
  const events: IcsEvent[] = data.games.map((g) => ({
    uid: `espn-${g.id}@kroatien-sport-live`,
    start: g.kickoff,
    durationMin: 120,
    summary: `${g.home} – ${g.away}${g.state === "post" && g.homeScore != null ? ` ${g.homeScore}:${g.awayScore}` : ""} (${g.competition})`,
    description: `${g.competition} · Quelle/izvor: ESPN · ${SITE.url}/legionaere#europacup`,
    url: `${SITE.url}/legionaere#europacup`,
    status: g.state === "cancelled" ? "CANCELLED" : g.state === "postponed" ? "TENTATIVE" : "CONFIRMED",
  }));
  return {
    ics: buildIcs({
      name: "Kroatische Klubs im Europacup / Hrvatski klubovi u Europi",
      description: "Dinamo, Hajduk, Rijeka & Co. in Champions League, Europa League und Conference League (Quelle: ESPN)",
      events,
      now,
    }),
    upcoming: events.filter((e) => Date.parse(e.start) > now).slice(0, 5).map((e) => ({ start: e.start, summary: e.summary })),
  };
}
