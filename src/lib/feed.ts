/**
 * Fußball-Feed: verknüpft Spiele, offizielle Highlight-Clips und Schlagzeilen.
 *
 *  - Ein Clip wird einem echten Spiel zugeordnet, wenn Datum (Vatreni, HNS-Titel)
 *    bzw. Paarung + Ergebnis (HNL, Vereins-/MAXSport-Titel) mit den Spieldaten
 *    (ESPN / TheSportsDB) übereinstimmen. Ohne Übereinstimmung bleibt der Clip
 *    ein eigener Eintrag (nur ≤ 7 Tage alt) – es wird nichts zugeordnet, was nicht passt.
 *  - Schlagzeilen hängen an einem Spiel, wenn beide Teams (bzw. Gegner + Kroatien-Bezug)
 *    im Titel vorkommen und die Meldung zeitlich zum Spiel passt.
 *  - Bevorstehende Spiele erscheinen nur, wenn es dazu Schlagzeilen gibt (z. B. Derby).
 *  - Reihenfolge: neueste zuerst.
 */
import type { NewsItem } from "./sources/news";
import { pickNews } from "./sources/news";
import type { Video } from "./sources/videos";
import type { VatreniData } from "./sources/vatreni";
import type { HnlData, HnlMatch } from "./sources/hnl";
import type { NtMatch } from "./sources/types";
import type { Lang } from "./i18n";
import { viennaYmd } from "./time";

const H = 3600_000;
const D = 24 * H;

export interface FeedMatch {
  /** Anker-ID, z. B. "m-hnl-123" */
  key: string;
  kind: "vatreni" | "hnl";
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoff: string;
  competition: string;
  round?: number;
  croatiaIsHome?: boolean;
  upcoming: boolean;
}

export type FeedEntry =
  | { type: "story"; id: string; at: string; match?: FeedMatch; clip?: Video; news: NewsItem[] }
  | { type: "news"; id: string; at: string; item: NewsItem };

export interface Feed {
  entries: FeedEntry[];
  /** Match-Key → Anker der Story (für 🎬-Links in Vatreni/HNL) */
  clipFor: Record<string, string>;
}

function fold(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

const CLUBS: Array<[string, RegExp]> = [
  ["Dinamo Zagreb", /dinam/],
  ["Hajduk Split", /hajduk/],
  ["Rijeka", /rijek/],
  ["Osijek", /osijek/],
  ["Varaždin", /varazdin/],
  ["Gorica", /gorica|gorici/],
  ["Istra 1961", /\bistr[aeiu]\b/],
  ["Lokomotiva", /lokomotiv|lokosi/],
  ["Slaven Belupo", /slaven|belupo/],
  ["Rudeš", /rudes/],
];
function clubRx(name: string): RegExp | null {
  const f = fold(name);
  return CLUBS.find(([, rx]) => rx.test(f))?.[1] ?? null;
}
function clubKey(name: string): string | null {
  const f = fold(name);
  return CLUBS.find(([, rx]) => rx.test(f))?.[0] ?? null;
}

/** Gegner (deutsche ESPN-Namen) → Wortstämme DE/HR */
const OPP: Record<string, RegExp> = {
  Spanien: /spanj|spanien|spanier/,
  England: /englesk|england|englez|wembley|three lions/,
  Tschechien: /cesk|tschech/,
  Portugal: /portugal/,
  Deutschland: /njemack|deutschland|\bdfb\b/,
  Frankreich: /francus|frankreich|franzos/,
  Italien: /talij|italien/,
  Niederlande: /nizozem|niederland|oranje/,
  Belgien: /belgij|belgien/,
  Schottland: /skotsk|schottland|schotten/,
  Serbien: /srbij|serbien/,
  Österreich: /austrij|osterreich|oesterreich|ofb/,
  Slowenien: /slovenij|slowenien/,
  Litauen: /litv|litauen/,
  Polen: /poljsk|polen/,
  Dänemark: /dansk|danemark|daenemark/,
};
const CRO = /hrvatsk|kroat|vatren|reprezentac|dalic|bilic/;

function oppRx(name: string): RegExp {
  return OPP[name] ?? new RegExp(fold(name).replace(/[^a-z ]/g, "").slice(0, 6) || "^$");
}

function fromNt(m: NtMatch, upcoming: boolean): FeedMatch {
  return {
    key: `m-nt-${m.id}`,
    kind: "vatreni",
    home: m.home,
    away: m.away,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    kickoff: m.kickoff,
    competition: m.competition,
    croatiaIsHome: m.croatiaIsHome,
    upcoming,
  };
}
function fromHnl(m: HnlMatch, upcoming: boolean): FeedMatch {
  return {
    key: `m-hnl-${m.id}`,
    kind: "hnl",
    home: m.home,
    away: m.away,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    kickoff: m.kickoff!,
    competition: "SuperSport HNL",
    round: m.round,
    upcoming,
  };
}

/** passt die Schlagzeile zum Spiel? (Teams im Titel + Zeitfenster) */
function relates(n: NewsItem, m: FeedMatch, now: number): boolean {
  const t = fold(n.title);
  const pub = Date.parse(n.publishedAt);
  const ko = Date.parse(m.kickoff);
  const inWindow = m.upcoming ? now - pub <= 3 * D : pub >= ko - 2 * D && pub <= ko + 4 * D;
  if (!inWindow) return false;
  if (m.kind === "vatreni") {
    const opp = m.croatiaIsHome ? m.away : m.home;
    return CRO.test(t) && oppRx(opp).test(t);
  }
  const a = clubRx(m.home);
  const b = clubRx(m.away);
  return Boolean(a && b && a.test(t) && b.test(t));
}

/** Clip → Spiel (nur bei eindeutiger Übereinstimmung mit den Spieldaten) */
function matchClip(v: Video, vatreni: VatreniData, hnl: HnlData | null): FeedMatch | null {
  if (v.vatreni) {
    if (!v.dateHint) return null;
    const hrFirst = v.pairing ? /hrvatska|croatia/i.test(v.pairing.home) : null;
    const m = vatreni.last.find((x) => {
      const ymd = viennaYmd(x.kickoff);
      const dd = Math.abs(Date.parse(`${ymd}T12:00:00Z`) - Date.parse(`${v.dateHint}T12:00:00Z`));
      return dd <= D && (hrFirst == null || hrFirst === x.croatiaIsHome);
    });
    return m ? fromNt(m, false) : null;
  }
  const p = v.pairing;
  if (!hnl || !p || p.homeScore == null) return null;
  const hk = clubKey(p.home);
  const ak = clubKey(p.away);
  if (!hk || !ak || hk === ak) return null;
  const pub = Date.parse(v.publishedAt);
  const m = hnl.matches.find(
    (x) =>
      x.state === "finished" &&
      x.kickoff &&
      clubKey(x.home) === hk &&
      clubKey(x.away) === ak &&
      x.homeScore === p.homeScore &&
      x.awayScore === p.awayScore &&
      Date.parse(x.kickoff) <= pub + H &&
      pub - Date.parse(x.kickoff) <= 10 * D
  );
  return m ? fromHnl(m, false) : null;
}

const CHANNEL_PREF: Record<string, number> = { HNS: 0, MAXSport: 1 };

export function buildFeed(
  {
    vatreni,
    hnl,
    news,
    videos,
  }: { vatreni: VatreniData; hnl: HnlData | null; news: NewsItem[]; videos: Video[] },
  { lang, now = Date.now(), maxClips = 5, maxNews = 8 }: { lang: Lang; now?: number; maxClips?: number; maxNews?: number }
): Feed {
  const footballNews = news.filter((n) => n.sport === "football");
  const used = new Set<string>();
  const takeRelated = (m: FeedMatch, max = 2): NewsItem[] => {
    const rel = footballNews
      .filter((n) => !used.has(n.url) && relates(n, m, now))
      .sort((a, b) => b.interest - a.interest || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, max);
    rel.forEach((n) => used.add(n.url));
    return rel;
  };

  // 1) Clips mit Spielbezug
  const linked = new Map<string, { clip: Video; match: FeedMatch }>();
  const unlinked: Video[] = [];
  for (const v of videos.filter((x) => x.sport === "football")) {
    const m = matchClip(v, vatreni, hnl);
    if (!m) {
      if (now - Date.parse(v.publishedAt) <= 7 * D) unlinked.push(v);
      continue;
    }
    const prev = linked.get(m.key);
    if (!prev || (CHANNEL_PREF[v.channel] ?? 9) < (CHANNEL_PREF[prev.clip.channel] ?? 9)) linked.set(m.key, { clip: v, match: m });
  }
  const goals = (m: FeedMatch) => (m.homeScore ?? 0) + (m.awayScore ?? 0);
  const linkedList = [...linked.values()].sort(
    (a, b) =>
      (a.match.kind === "vatreni" ? 0 : 1) - (b.match.kind === "vatreni" ? 0 : 1) ||
      goals(b.match) - goals(a.match) ||
      Date.parse(b.match.kickoff) - Date.parse(a.match.kickoff)
  );
  // doppelte Clips ohne Spielbezug (gleicher Titel/Paarung) entfernen
  const seen = new Set<string>();
  const unlinkedList = unlinked.filter((v) => {
    const k = v.pairing ? `${fold(v.pairing.home)}|${fold(v.pairing.away)}|${v.pairing.homeScore}` : v.id;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const entries: FeedEntry[] = [];
  const clipFor: Record<string, string> = {};
  let clips = 0;
  for (const { clip, match } of linkedList) {
    if (clips >= maxClips) break;
    const rel = takeRelated(match);
    const at = [clip.publishedAt, ...rel.map((n) => n.publishedAt)].sort().at(-1)!;
    const id = `story-${match.key}`;
    entries.push({ type: "story", id, at, match, clip, news: rel });
    clipFor[match.key] = id;
    clips++;
  }
  for (const clip of unlinkedList) {
    if (clips >= maxClips) break;
    entries.push({ type: "story", id: `story-v-${clip.id}`, at: clip.publishedAt, clip, news: [] });
    clips++;
  }

  // 2) Bevorstehende Spiele mit Schlagzeilen (z. B. Derby, Vatreni-Vorschau)
  const upcoming: FeedMatch[] = [];
  if (vatreni.next && Date.parse(vatreni.next.kickoff) - now <= 7 * D) upcoming.push(fromNt(vatreni.next, true));
  for (const m of hnl?.matches ?? []) {
    if (m.state !== "scheduled" || !m.kickoff) continue;
    const dt = Date.parse(m.kickoff) - now;
    if (dt > -2 * H && dt <= 3 * D) upcoming.push(fromHnl(m, true));
  }
  for (const m of upcoming) {
    const rel = takeRelated(m, 3);
    if (rel.length === 0) continue;
    entries.push({ type: "story", id: `story-${m.key}`, at: rel.map((n) => n.publishedAt).sort().at(-1)!, match: m, news: rel });
  }

  // 3) weitere Schlagzeilen (interessant zuerst ausgewählt, dann chronologisch)
  const rest = pickNews(
    footballNews.filter((n) => !used.has(n.url)),
    { lang, now, max: maxNews, min: Math.min(4, maxNews) }
  );
  for (const n of rest) entries.push({ type: "news", id: `n-${n.url}`, at: n.publishedAt, item: n });

  entries.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return { entries, clipFor };
}
