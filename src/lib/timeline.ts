import { dataLabel, dict, type Dict, type Lang } from "./i18n";

export type TlLabels = Pick<Dict, "live" | "win" | "loss" | "draw" | "winShort" | "lossShort" | "drawShort">;

export function tlLabels(t: Dict): TlLabels {
  return { live: t.live, win: t.win, loss: t.loss, draw: t.draw, winShort: t.winShort, lossShort: t.lossShort, drawShort: t.drawShort };
}
import { SPORT_EMOJI, type Sport, type BoxFight } from "./sport-meta";
import { formatLongDay, formatTime, viennaYmd } from "./time";
import type { SportData, SportItem } from "./sources/sport";
import type { VatreniData } from "./sources/vatreni";
import type { HnlData } from "./sources/hnl";
import type { NtMatch } from "./sources/types";
import type { BoxerStatus } from "./sources/boxing";
import type { Sourced } from "./cache";

/** Ein Eintrag der gemeinsamen Zeitleiste (fertig formatiert, serialisierbar). */
export interface TlItem {
  key: string;
  sport: Sport;
  emoji: string;
  who: string;
  title: string;
  meta: string;
  ymd: string;
  dayLabel: string;
  /** "20:45" oder "Uhrzeit offen" */
  timeLabel: string;
  iso: string | null;
  timeKnown: boolean;
  live: boolean;
  result?: string;
  outcome?: "W" | "L" | "D";
  detail?: string;
}

export interface Timeline {
  upcoming: TlItem[];
  results: TlItem[];
}

const D = 24 * 3600_000;
const RESULT_WINDOW = 14 * D;

interface Raw {
  key: string;
  sport: Sport;
  who: string;
  title: string;
  meta: string;
  /** ISO-Zeitpunkt; bei reinen Datumsangaben 12:00 UTC */
  start: string;
  /** Kalendertag, falls nur Datum bekannt (Ortszeit der Quelle) */
  ymd?: string;
  timeKnown: boolean;
  live?: boolean;
  result?: string;
  outcome?: "W" | "L" | "D";
  detail?: string;
}

/** Deutsche Ergebnis-Texte der Quellen-Module für HR übersetzen (nur feste Begriffe). */
const RESULT_HR: Array<[RegExp, string]> = [
  [/^Unentschieden\/kein Ergebnis/, "Neriješeno/bez odluke"],
  [/^Sieg/, "Pobjeda"],
  [/^Niederlage/, "Poraz"],
  [/^Ende/, "Kraj"],
  [/einstimmige Punktentscheidung/, "jednoglasna odluka sudaca"],
  [/geteilte Punktentscheidung/, "podijeljena odluka sudaca"],
  [/Mehrheitsentscheidung/, "većinska odluka sudaca"],
  [/Aufgabe \(Submission\)/, "predaja (submission)"],
  [/K\.o\./, "nokaut"],
  [/Runde (\d+)/, "runda $1"],
  [/Aufgabe/, "predaja"],
  [/(\d+) Pkt\./g, "$1 poena"],
  [/(\d+) Reb\./g, "$1 skokova"],
  [/(\d+) Ass\./g, "$1 asistencija"],
  [/(\d+) Min\./g, "$1 min"],
  [/Einzel/, "pojedinačno"],
  [/Doppel/, "parovi"],
  [/Viertelfinale/, "četvrtfinale"],
  [/Halbfinale/, "polufinale"],
  [/Achtelfinale/, "osmina finala"],
  [/Finale/, "finale"],
  [/(\d+)\. Runde/, "$1. kolo"],
  [/Quali (\d+)\. Runde/, "kvalifikacije, $1. kolo"],
  [/NBA-Vorbereitung/, "NBA predsezona"],
  [/NBA-Playoffs/, "NBA doigravanje"],
];
function tr(s: string | undefined, lang: Lang): string | undefined {
  if (!s || lang === "de") return s;
  let out = dataLabel(s, lang);
  for (const [rx, rep] of RESULT_HR) out = out.replace(rx, rep);
  return out;
}

function fromSportItem(i: SportItem, who?: string): Raw | null {
  if (!i.start || i.dateKnown === false) return null;
  return {
    key: i.key,
    sport: i.sport,
    who: who ?? i.who,
    title: i.vs,
    meta: i.competition,
    start: i.start,
    timeKnown: i.timeKnown,
    live: i.state === "in",
    result: i.result,
    outcome: i.outcome,
    detail: i.detail,
  };
}

function ntOutcome(m: NtMatch): "W" | "L" | "D" | undefined {
  if (m.homeScore == null || m.awayScore == null) return undefined;
  const cro = m.croatiaIsHome ? m.homeScore : m.awayScore;
  const opp = m.croatiaIsHome ? m.awayScore : m.homeScore;
  if (m.extra?.startsWith("n. E.")) {
    const [h, a] = m.extra.replace("n. E. ", "").split(":").map(Number);
    return (m.croatiaIsHome ? h > a : a > h) ? "W" : "L";
  }
  return cro > opp ? "W" : cro < opp ? "L" : "D";
}

function fromNt(m: NtMatch, lang: Lang): Raw {
  const scored = m.homeScore != null && m.awayScore != null;
  return {
    key: `nt-${m.id}`,
    sport: "football",
    who: "Vatreni",
    title: `${m.home} – ${m.away}`,
    meta: [m.competition, m.venue].filter(Boolean).join(" · "),
    start: m.kickoff,
    timeKnown: true,
    live: m.state === "in",
    result: scored ? `${m.homeScore}:${m.awayScore}${m.extra ? ` (${lang === "hr" ? m.extra.replace("n. E.", "nakon penala") : m.extra})` : ""}` : undefined,
    outcome: m.state === "post" ? ntOutcome(m) : undefined,
  };
}

function fromBox(b: BoxerStatus, f: BoxFight, lang: Lang, kind: "next" | "last"): Raw {
  const t = dict(lang);
  const res =
    kind === "last" && f.outcome
      ? [
          f.outcome === "W" ? t.win : f.outcome === "L" ? t.loss : t.draw,
          f.method,
          f.round ? (lang === "hr" ? `${f.round}. runda` : `Runde ${f.round}`) : undefined,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;
  return {
    key: `box-${b.id}-${f.date}`,
    sport: "boxing",
    who: b.name,
    title: `${t.sport.vs} ${f.opponent}`,
    meta: [f.event, f.place].filter(Boolean).join(" · "),
    start: `${f.date}T12:00:00Z`,
    ymd: f.date,
    timeKnown: false,
    result: res,
    outcome: kind === "last" ? f.outcome : undefined,
    detail: kind === "last" && f.note ? f.note[lang] : undefined,
  };
}

function finish(r: Raw, lang: Lang, now: number): TlItem {
  const t = dict(lang);
  const ymd = r.ymd ?? viennaYmd(r.start);
  const today = viennaYmd(new Date(now).toISOString());
  const tomorrow = viennaYmd(new Date(now + D).toISOString());
  const long = formatLongDay(`${ymd}T12:00:00Z`, lang);
  const dayLabel = ymd === today ? `${t.today} · ${long}` : ymd === tomorrow ? `${t.tomorrow} · ${long}` : long;
  return {
    key: r.key,
    sport: r.sport,
    emoji: SPORT_EMOJI[r.sport],
    who: r.who,
    title: dataLabel(r.title, lang),
    meta: tr(r.meta, lang) ?? "",
    ymd,
    dayLabel,
    timeLabel: r.timeKnown ? formatTime(r.start, lang) : t.timeOpen,
    iso: r.timeKnown ? r.start : null,
    timeKnown: r.timeKnown,
    live: Boolean(r.live),
    result: tr(r.result, lang),
    outcome: r.outcome,
    detail: tr(r.detail, lang),
  };
}

/** Aufsteigend: Live zuerst, dann Tag, innerhalb des Tages Uhrzeit; "Uhrzeit offen" ans Tagesende. */
export function sortUpcoming(a: TlItem, b: TlItem): number {
  if (a.live !== b.live) return a.live ? -1 : 1;
  if (a.ymd !== b.ymd) return a.ymd < b.ymd ? -1 : 1;
  if (a.timeKnown !== b.timeKnown) return a.timeKnown ? -1 : 1;
  return (a.iso ?? "").localeCompare(b.iso ?? "") || a.key.localeCompare(b.key);
}

/** Absteigend nach Tag, dann Uhrzeit. */
export function sortResults(a: TlItem, b: TlItem): number {
  if (a.ymd !== b.ymd) return a.ymd > b.ymd ? -1 : 1;
  return (b.iso ?? "").localeCompare(a.iso ?? "") || a.key.localeCompare(b.key);
}

export function buildTimeline(
  {
    vatreni,
    hnl,
    sport,
    boxers,
  }: { vatreni: VatreniData | null; hnl: Sourced<HnlData> | null; sport: SportData | null; boxers: BoxerStatus[] },
  lang: Lang,
  now = Date.now()
): Timeline {
  const up: Raw[] = [];
  const res: Raw[] = [];
  const recent = (iso: string) => {
    const t = Date.parse(iso);
    return t <= now && t >= now - RESULT_WINDOW;
  };

  // Fußball: Vatreni
  if (vatreni) {
    if (vatreni.live) up.push(fromNt(vatreni.live, lang));
    if (vatreni.next) up.push(fromNt(vatreni.next, lang));
    for (const m of vatreni.last) if (recent(m.kickoff)) res.push(fromNt(m, lang));
  }
  // Fußball: SuperSport HNL
  if (hnl) {
    const round = (n: number) => (lang === "hr" ? `SuperSport HNL · ${n}. kolo` : `SuperSport HNL · ${n}. Runde`);
    for (const m of hnl.data.matches) {
      if (!m.kickoff) continue;
      const t = Date.parse(m.kickoff);
      const base: Raw = {
        key: `hnl-${m.id}`,
        sport: "football",
        who: "HNL",
        title: `${m.home} – ${m.away}`,
        meta: round(m.round),
        start: m.kickoff,
        timeKnown: !/T00:00:00/.test(m.kickoff),
      };
      if ((m.state === "scheduled" && t >= now && t <= now + 14 * D) || m.state === "live") {
        up.push({ ...base, live: m.state === "live", result: m.state === "live" && m.homeScore != null ? `${m.homeScore}:${m.awayScore}` : undefined });
      } else if (m.state === "finished" && recent(m.kickoff)) {
        res.push({ ...base, result: `${m.homeScore}:${m.awayScore}` });
      }
    }
  }
  // Andere Sportarten
  if (sport) {
    for (const i of [...sport.upcoming, ...sport.national]) {
      const r = fromSportItem(i);
      if (r) up.push(r);
    }
    for (const i of sport.results) {
      const r = fromSportItem(i);
      if (r) res.push(r);
    }
    for (const f of sport.fighters) {
      const n = f.next && fromSportItem(f.next, f.name);
      if (n) up.push({ ...n, title: `${dict(lang).sport.vs} ${f.next!.vs}` });
      const l = f.last && fromSportItem(f.last, f.name);
      if (l && recent(l.start)) res.push({ ...l, title: `${dict(lang).sport.vs} ${f.last!.vs}` });
    }
    for (const t of sport.tournaments) {
      for (const g of t.games) {
        if (Date.parse(g.start) < now - 3 * 3600_000) continue;
        up.push({
          key: `tour-${t.sport}-${g.start}`,
          sport: t.sport,
          who: "Kroatien",
          title: `${g.home} – ${g.away}`,
          meta: [t.title, g.note].filter(Boolean).join(" · "),
          start: g.start,
          timeKnown: true,
        });
      }
    }
  }
  // Boxen
  for (const b of boxers) {
    if (b.next) up.push(fromBox(b, b.next, lang, "next"));
    if (b.last && b.last.outcome && Date.parse(`${b.last.date}T12:00:00Z`) >= now - RESULT_WINDOW) res.push(fromBox(b, b.last, lang, "last"));
  }

  const uniq = (xs: Raw[]) => [...new Map(xs.map((x) => [x.key, x])).values()];
  return {
    upcoming: uniq(up)
      .map((r) => finish(r, lang, now))
      .map((i) => ({ ...i, who: dataLabel(i.who, lang) }))
      .sort(sortUpcoming),
    results: uniq(res)
      .map((r) => finish(r, lang, now))
      .map((i) => ({ ...i, who: dataLabel(i.who, lang) }))
      .sort(sortResults),
  };
}
