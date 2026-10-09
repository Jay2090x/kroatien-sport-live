import { cachedSource, type Sourced } from "../cache";
import { fetchJson, fetchText } from "../http";
import type { Sport } from "../sport-meta";

/**
 * Highlight-Videos – ausschließlich offizielle YouTube-Kanäle (Rechteinhaber):
 *  - Hrvatski nogometni savez (HNS) – Vatreni-Zusammenfassungen
 *  - MAXSport (Hrvatski Telekom, TV-Rechteinhaber SuperSport HNL) – Spielzusammenfassungen
 *  - offizielle Vereinskanäle: GNK Dinamo, HNK Hajduk, HNK Rijeka, NK Osijek
 *    (nur Zusammenfassungen der ersten Mannschaft)
 *  - UFC – nur Videos mit kroatischem Bezug (Soldić)
 * Quelle: öffentliche Kanal-RSS-Feeds (kein API-Key). Jedes Video wird per oEmbed
 * geprüft (nur einbettbare Videos). Eingebettet wird erst nach Klick
 * (youtube-nocookie.com), vorher werden keine Daten an YouTube übertragen.
 * Aus dem Titel wird – wenn vorhanden – die Paarung samt Ergebnis gelesen, damit
 * der Clip im Feed neben dem passenden Spiel steht (siehe lib/feed.ts).
 * Gibt es keine passenden Clips, wird der Block weggelassen – nichts aufgefüllt.
 */
export interface Video {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  sport: Sport;
  /** aus dem Titel gelesene Paarung (Rohnamen, wie im Titel) */
  pairing?: { home: string; away: string; homeScore: number | null; awayScore: number | null };
  /** Spieltag aus dem Titel "(6.10.2026.)" als YYYY-MM-DD */
  dateHint?: string;
  /** Vatreni-Zusammenfassung (HNS, A-Nationalmannschaft) */
  vatreni?: boolean;
}

/** Jugend, Frauen, Futsal, Reserve, Testspiele – nicht Teil des Feeds */
const NOT_FIRST_TEAM =
  /\bii\b|u-?1[5-9]\b|u-?2[0-3]\b|junior|kadet|pionir|\bnl\b|3\. ?nl|hnl[zž]|[zž]nk|žene|women|futsal|hmnl|iyc|youth|pripremn/i;

type Accept = (t: string) => Sport | null;
const CHANNELS: Array<{ id: string; name: string; maxDays: number; accept: Accept }> = [
  {
    id: "UCsqWbe1Tp3ZkobTmcKqZmjg",
    name: "HNS",
    maxDays: 21,
    // nur Spielzusammenfassungen ("SAŽECI | HIGHLIGHTS") der A-Nationalmannschaft
    accept: (t) => (/sa[zž]e(ci|tak)|highlights/i.test(t) && /hrvatska|croatia/i.test(t) && !NOT_FIRST_TEAM.test(t) ? "football" : null),
  },
  {
    id: "UCdZuGHA8fV0oKQRCE4AYV0A",
    name: "MAXSport",
    maxDays: 21,
    accept: (t) => {
      // Match-Zusammenfassungen tragen das Ergebnis "A vs B 2:1 (...)"; keine Livestreams
      if (/u[zž]ivo|\blive\b/i.test(t) || !/\bvs\b.*\d+:\d+/i.test(t)) return null;
      if (NOT_FIRST_TEAM.test(t)) return null;
      if (/fiba|aba liga|ko[sš]ark|premijer liga.*ko[sš]/i.test(t)) return "basketball";
      if (/ehf|seha|rukomet/i.test(t)) return "handball";
      if (/supersport ?hnl|\bhnk\b|kup|liga prvaka|europa|konferencijsk|kvalifikacij|prijateljsk/i.test(t)) return "football";
      return null;
    },
  },
  {
    id: "UC6vpARgHA0oSqtBgYcVWdHg",
    name: "GNK Dinamo",
    maxDays: 21,
    accept: (t) => (/^\s*highlights\s*\|/i.test(t) && !NOT_FIRST_TEAM.test(t) ? "football" : null),
  },
  {
    id: "UCN7oOG6iLGDXXhyxBKcbq7A",
    name: "HNK Hajduk",
    maxDays: 21,
    accept: (t) => (/^\s*sa[zž]etak\s*\|/i.test(t) && !NOT_FIRST_TEAM.test(t) ? "football" : null),
  },
  {
    id: "UCUezDU1Bm6Y0MetFjKUiw2w",
    name: "HNK Rijeka",
    maxDays: 21,
    accept: (t) => (/sa[zž]etak/i.test(t) && !NOT_FIRST_TEAM.test(t) ? "football" : null),
  },
  {
    id: "UCzbn7dSIvN24cthbfTUEFBw",
    name: "NK Osijek",
    maxDays: 21,
    accept: (t) => (/^\s*sa[zž]etak\s*\|/i.test(t) && !NOT_FIRST_TEAM.test(t) ? "football" : null),
  },
  {
    id: "UCvgfXK4nTYKudb0rFR6noLA",
    name: "UFC",
    maxDays: 7,
    accept: (t) => (/soldi[cć]/i.test(t) ? "mma" : null),
  },
];

const D = 24 * 3600_000;

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function cleanTeam(s: string): string {
  return s
    .replace(/\(.*?\)/g, " ")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[-–.\s]+|[-–.,\s]+$/g, "");
}

/**
 * Paarung + Ergebnis aus dem Titel lesen, z. B.
 *  "SAŽETAK | Rijeka 3️⃣:0️⃣ Hajduk | 🔴🔵", "HIGHLIGHTS | Dinamo 3-2 Lokomotiva",
 *  "VUKOVAR 1991 vs DINAMO 0:4 (1/8 FINALA, …)", "HRVATSKA - ŠPANJOLSKA | SAŽECI | HIGHLIGHTS (6.10.2026.)"
 */
export function parsePairing(title: string): Video["pairing"] {
  const t = title.replace(/(\d)\uFE0F?\u20E3/g, "$1");
  for (const seg of t.split("|").map((s) => s.trim())) {
    // Ergebnis hinter der Paarung: "A vs B 0:4"
    let m = seg.match(/^(.+?)\s+(?:vs\.?|–|-)\s+(.+?)\s+(\d{1,2})\s*[:]\s*(\d{1,2})\b/i);
    if (m) return { home: cleanTeam(m[1]), away: cleanTeam(m[2]), homeScore: +m[3], awayScore: +m[4] };
    // Ergebnis zwischen den Teams: "Rijeka 3:0 Hajduk"
    m = seg.match(/^(.+?)\s+(\d{1,2})\s*[-:]\s*(\d{1,2})\s+(.+)$/);
    if (m && /\p{L}/u.test(m[1]) && /\p{L}/u.test(m[4]))
      return { home: cleanTeam(m[1]), away: cleanTeam(m[4]), homeScore: +m[2], awayScore: +m[3] };
  }
  // ohne Ergebnis: "HRVATSKA - ŠPANJOLSKA | SAŽECI …"
  const first = t.split("|")[0].trim();
  const m = first.match(/^(.+?)\s+[-–]\s+(.+)$/);
  if (m && !/\d/.test(first)) return { home: cleanTeam(m[1]), away: cleanTeam(m[2]), homeScore: null, awayScore: null };
  return undefined;
}

function dateHintOf(title: string): string | undefined {
  const m = title.match(/\((\d{1,2})\.(\d{1,2})\.(\d{4})\.?\)/);
  if (!m) return undefined;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

async function loadChannel(ch: (typeof CHANNELS)[number], now: number): Promise<Video[]> {
  const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`);
  const out: Video[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const title = decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !title || !published) continue;
    const iso = new Date(published).toISOString();
    if (now - Date.parse(iso) > ch.maxDays * D) continue;
    const sport = ch.accept(title);
    if (!sport) continue;
    const v: Video = { id, title, channel: ch.name, publishedAt: iso, sport };
    if (sport === "football") {
      v.pairing = parsePairing(title);
      v.dateHint = dateHintOf(title);
      if (ch.name === "HNS") v.vatreni = true;
    }
    out.push(v);
  }
  return out;
}

/** nur einbettbare Videos (oEmbed liefert 401/404, wenn Einbetten deaktiviert ist) */
async function embeddable(id: string): Promise<boolean> {
  try {
    await fetchJson(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { retries: 0 });
    return true;
  } catch {
    return false;
  }
}

const MAX_POOL = 14;

async function loadVideos(): Promise<Video[]> {
  const now = Date.now();
  const settled = await Promise.allSettled(CHANNELS.map((c) => loadChannel(c, now)));
  if (settled.every((s) => s.status === "rejected")) throw new Error("videos: all channels failed");
  const all = settled
    .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  // Vatreni zuerst, dann der Rest neueste zuerst; pro Kanal höchstens 4 im Pool
  const ranked = [...all.filter((v) => v.vatreni), ...all.filter((v) => !v.vatreni)];
  const perChannel = new Map<string, number>();
  const candidates = ranked.filter((v) => {
    const c = perChannel.get(v.channel) ?? 0;
    perChannel.set(v.channel, c + 1);
    return c < 4;
  });
  const checks = await Promise.all(candidates.slice(0, MAX_POOL + 4).map((v) => embeddable(v.id)));
  return candidates
    .slice(0, MAX_POOL + 4)
    .filter((_, i) => checks[i])
    .slice(0, MAX_POOL)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/** Pool (bis 21 Tage, Feed verknüpft mit Spielen); für reine Listen `recentVideos` nutzen. */
export async function getVideos(): Promise<Sourced<Video[]> | null> {
  return cachedSource(["videos-v2"], 1800, loadVideos);
}

/** nur Clips der letzten `days` Tage (für Listen ohne Spielbezug) */
export function recentVideos(videos: Video[], now = Date.now(), days = 7): Video[] {
  return videos.filter((v) => now - Date.parse(v.publishedAt) <= days * D);
}
