import { cachedSource, type Sourced } from "../cache";
import { fetchText } from "../http";
import { embeddable } from "./videos";

/**
 * Aktuelle Spieler-Clips (Tore, starke Aktionen) kroatischer Nationalspieler.
 * Nur offizielle YouTube-Kanäle (Vereine, Ligen, UEFA, HNS, Rechteinhaber), gelesen über das öffentliche RSS.
 * Kein Reupload-/Fan-Kanal, keine Interviews/Pressekonferenzen, keine Saison-Zusammenschnitte.
 */
export interface PlayerClip {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  player: string;
  club: string | null;
}

type Ch = { id: string; name: string; club?: RegExp };

/** Vereinskanäle: Nachname reicht (nur Spieler dieses Vereins). Wettbewerbskanäle: voller Name nötig. */
export const CHANNELS: Ch[] = [
  { id: "UCKcx1uK38H4AOkmfv4ywlrg", name: "AC Milan", club: /\bmilan\b/i },
  { id: "UC0R-isVeRhMDe3vFTWP5Spg", name: "Atalanta", club: /atalanta/i },
  { id: "UC14UlmYlSNiQCBe9Eookf_A", name: "FC Barcelona", club: /barcelona/i },
  { id: "UCZkcxFIsqW5htimoUQKA0iA", name: "FC Bayern", club: /bayern/i },
  { id: "UCf-cpC9WAdOsas19JHipukA", name: "Brighton & Hove Albion", club: /brighton/i },
  { id: "UCCSgBfz78cc9JmIN7a7MCSg", name: "Como 1907", club: /\bcomo\b/i },
  { id: "UCE2JDtOSy6R-9dwkGIWgyEA", name: "FC Dallas", club: /dallas/i },
  { id: "UCvXzEblUa0cfny4HAJ_ZOWw", name: "Inter", club: /\binter(nazionale)?\b/i },
  { id: "UCVtDCsB0UlIkDn2kjsva3WA", name: "SS Lazio", club: /lazio/i },
  { id: "UCE-f1Taamum6q2S-Ve4koSw", name: "RC Lens", club: /\blens\b/i },
  { id: "UCkzCjdRMrW2vXLx8mvPVLdQ", name: "Manchester City", club: /manchester city|man city/i },
  { id: "UCrCHG9q2F2U57_QSEKHWvIQ", name: "Orlando City SC", club: /orlando/i },
  { id: "UC1iCMq31GZ6Sv3qIIRhQ3Tg", name: "CA Osasuna", club: /osasuna/i },
  { id: "UCInZnZ8JYwmIvs8gtNriwSQ", name: "PAOK", club: /paok/i },
  { id: "UC_2ynsXrRrKP8zYrU7Hc06A", name: "PSV", club: /\bpsv\b/i },
  { id: "UCVaGyBPoEAZItDjlFPsRcSA", name: "Rangers FC", club: /rangers/i },
  { id: "UCkNMta6lLRCaOuXl3t9iG-w", name: "Real Sociedad", club: /sociedad/i },
  { id: "UC_atVJpGbIdjIa9OC6E3yJA", name: "SC Freiburg", club: /freiburg/i },
  { id: "UCX8HprRO1BYnQ6Mu2nB9VsQ", name: "AEK Athen", club: /\baek\b/i },
  { id: "UC6vpARgHA0oSqtBgYcVWdHg", name: "GNK Dinamo", club: /dinamo/i },
  { id: "UCN7oOG6iLGDXXhyxBKcbq7A", name: "HNK Hajduk", club: /hajduk/i },
  { id: "UCUezDU1Bm6Y0MetFjKUiw2w", name: "HNK Rijeka", club: /rijeka/i },
  { id: "UCzbn7dSIvN24cthbfTUEFBw", name: "NK Osijek", club: /osijek/i },
  { id: "UCsqWbe1Tp3ZkobTmcKqZmjg", name: "HNS" },
  { id: "UCdZuGHA8fV0oKQRCE4AYV0A", name: "MAXSport" },
  { id: "UCyGa1YEx9ST66rYrJTGIKOw", name: "UEFA" },
  { id: "UCTv-XvfzLX3i4IGWAm4sbmA", name: "LALIGA" },
  { id: "UCBJeMCIeLQos7wacox4hmLQ", name: "Lega Serie A" },
  { id: "UC6UL29enLNe4mqwTfAyeNuw", name: "Bundesliga" },
  { id: "UCG5qGWdu8nIRZqJ_GgDwQ-w", name: "Premier League" },
];

const DAYS = 21;
const D = 24 * 3600_000;

/** Interviews, Pressekonferenzen, Zusammenschnitte, Training usw. ausschließen */
const EXCLUDE =
  /\b(interview|intervju|press|presser|conference|konferencij|comments?|thoughts|reaction|reakcij|izjav|pre-?match|post-?match|training|trening|behind the scenes|unboxing|podcast|all goals|every goal|top \d+|best goals of|compilation|career|season review|rewind|years?|throwback|on this day|reupload|fan cam|stadium tour|interjú|pressekonferenz|stimmen)\b/i;
/** Hinweis auf Tor / Aktion */
const PLAY =
  /(\bgoals?\b|\bgol\w*|\btor\b|\btore\b|\btreffer|\bstrike\b|\bfinish|\bheader|\bvolley|free.?kick|\bstunner|\bworldie|\bbanger|\bassist|\bsave[sd]?\b|\bobrana|\bparad|\bskills?\b|\bbest of\b|\bhighlights?\b|\bvs\.?\b|🎯|⚽|🔥|🧱|🚀)/iu;

export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function wordRe(phrase: string): RegExp {
  const esc = fold(phrase).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])#?${esc}(?=$|[^\\p{L}\\p{N}])`, "u");
}

function decode(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

type Entry = { id: string; title: string; publishedAt: string };

export async function feed(id: string, now: number): Promise<Entry[]> {
  try {
    const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    const out: Entry[] = [];
    for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
      const e = m[1];
      const vid = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
      const title = decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
      const pub = e.match(/<published>([^<]+)<\/published>/)?.[1];
      if (!vid || !title || !pub) continue;
      if (now - Date.parse(pub) > DAYS * D) continue;
      out.push({ id: vid, title, publishedAt: new Date(pub).toISOString() });
    }
    return out;
  } catch {
    return [];
  }
}

export interface ClipPlayerRef {
  name: string;
  club: string | null;
}

/** Nachname (inkl. Mehrteiliges wie "Drena Beljo" bleibt voller Name). Doppelte Nachnamen → nur voller Name. */
export function matchers(players: ClipPlayerRef[]) {
  const last = (n: string) => fold(n.trim().split(/\s+/).at(-1) ?? n);
  return players.map((p) => ({
    p,
    full: wordRe(p.name),
    short: last(p.name).length >= 4 ? wordRe(last(p.name)) : null,
    last: last(p.name),
  }));
}

export function matchClip(
  title: string,
  ch: Ch,
  ms: ReturnType<typeof matchers>
): ClipPlayerRef | null {
  if (EXCLUDE.test(title) || !PLAY.test(title)) return null;
  const t = fold(title);
  // Kurzform nur, wenn der Nachname im Verein dieses Kanals eindeutig ist (z. B. Sučić bei Inter = Petar)
  const sameClub = ms.filter(({ p }) => !!ch.club && !!p.club && ch.club.test(p.club));
  const hits = ms.filter(({ p, full, short }) => {
    if (full.test(t)) return ch.club ? !!p.club && ch.club.test(p.club) : true;
    // Kurzform nur auf dem Kanal des eigenen Vereins
    return (
      !!short && !!ch.club && !!p.club && ch.club.test(p.club) && short.test(t) &&
      sameClub.filter((m) => m.last === fold(p.name.trim().split(/\s+/).at(-1) ?? "")).length === 1
    );
  });
  return hits.length === 1 ? hits[0].p : null;
}

async function load(players: ClipPlayerRef[]): Promise<PlayerClip[]> {
  const now = Date.now();
  const ms = matchers(players);
  const relevant = CHANNELS.filter((c) => !c.club || players.some((p) => p.club && c.club!.test(p.club)));
  const feeds = await Promise.all(relevant.map((c) => feed(c.id, now)));
  const seen = new Set<string>();
  const found: PlayerClip[] = [];
  relevant.forEach((ch, i) => {
    for (const e of feeds[i]) {
      const p = matchClip(e.title, ch, ms);
      if (!p || seen.has(e.id)) continue;
      seen.add(e.id);
      found.push({ id: e.id, title: e.title, channel: ch.name, publishedAt: e.publishedAt, player: p.name, club: p.club });
    }
  });
  found.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const pool = found.slice(0, 24);
  const ok = await Promise.all(pool.map((c) => embeddable(c.id)));
  return pool.filter((_, i) => ok[i]);
}

export async function getPlayerClips(players: ClipPlayerRef[]): Promise<Sourced<PlayerClip[]> | null> {
  const key = fold(players.map((p) => `${p.name}@${p.club ?? ""}`).sort().join("|"));
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) | 0;
  return cachedSource(["pclips-v1", String(h)], 3600, () => load(players));
}
