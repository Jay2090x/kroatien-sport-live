import { cachedSource, type Sourced } from "../cache";
import { fetchJson, fetchText } from "../http";
import type { Sport } from "../sport-meta";

/**
 * Highlight-Videos – ausschließlich offizielle YouTube-Kanäle (Rechteinhaber):
 *  - Hrvatski nogometni savez (HNS) – Vatreni-Zusammenfassungen
 *  - MAXSport (Hrvatski Telekom, TV-Rechteinhaber SuperSport HNL) – Spielzusammenfassungen
 *  - UFC – nur Videos mit kroatischem Bezug (Soldić)
 * Quelle: öffentliche Kanal-RSS-Feeds (kein API-Key). Jedes Video wird per oEmbed
 * geprüft (nur einbettbare Videos). Eingebettet wird erst nach Klick
 * (youtube-nocookie.com), vorher werden keine Daten an YouTube übertragen.
 * Gibt es keine passenden Clips, wird der Block weggelassen – nichts aufgefüllt.
 */
export interface Video {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
  sport: Sport;
}

const CHANNELS: Array<{ id: string; name: string; accept: (t: string) => Sport | null }> = [
  {
    id: "UCsqWbe1Tp3ZkobTmcKqZmjg",
    name: "HNS",
    // nur Spielzusammenfassungen ("SAŽECI | HIGHLIGHTS"), keine Pressekonferenzen
    accept: (t) => (/sa[zž]e(ci|tak)|highlights/i.test(t) && /hrvatska|croatia/i.test(t) ? "football" : null),
  },
  {
    id: "UCdZuGHA8fV0oKQRCE4AYV0A",
    name: "MAXSport",
    accept: (t) => {
      // Match-Zusammenfassungen tragen das Ergebnis "A vs B 2:1 (...)"; keine Livestreams
      if (/u[zž]ivo|\blive\b/i.test(t) || !/\bvs\b.*\d+:\d+/i.test(t)) return null;
      if (/hmnl|futsal|u1[5-9]\b|u2[01]\b|hnl[zž]|žnk|znk/i.test(t)) return null;
      if (/fiba|aba liga|ko[sš]ark|premijer liga.*ko[sš]/i.test(t)) return "basketball";
      if (/ehf|seha|rukomet/i.test(t)) return "handball";
      if (/supersport ?hnl|\bhnk\b|kup|liga prvaka|europa|konferencijsk|kvalifikacij|prijateljsk/i.test(t)) return "football";
      return null;
    },
  },
  {
    id: "UCvgfXK4nTYKudb0rFR6noLA",
    name: "UFC",
    accept: (t) => (/soldi[cć]/i.test(t) ? "mma" : null),
  },
];

const MAX_AGE = 7 * 24 * 3600_000;

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function loadChannel(ch: (typeof CHANNELS)[number]): Promise<Video[]> {
  const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`);
  const out: Video[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const title = decode(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const published = e.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !title || !published) continue;
    const sport = ch.accept(title);
    if (!sport) continue;
    out.push({ id, title, channel: ch.name, publishedAt: new Date(published).toISOString(), sport });
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

async function loadVideos(): Promise<Video[]> {
  const settled = await Promise.allSettled(CHANNELS.map(loadChannel));
  if (settled.every((s) => s.status === "rejected")) throw new Error("videos: all channels failed");
  const now = Date.now();
  const all = settled
    .flatMap((s) => (s.status === "fulfilled" ? s.value : []))
    .filter((v) => now - Date.parse(v.publishedAt) <= MAX_AGE)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  // Vatreni zuerst, dann pro Kanal höchstens 2, gesamt max. 4
  const ranked = [...all.filter((v) => v.channel === "HNS"), ...all.filter((v) => v.channel !== "HNS")];
  const perChannel = new Map<string, number>();
  const out: Video[] = [];
  for (const v of ranked) {
    if (out.length >= 4) break;
    const c = perChannel.get(v.channel) ?? 0;
    if (c >= 2) continue;
    if (!(await embeddable(v.id))) continue;
    perChannel.set(v.channel, c + 1);
    out.push(v);
  }
  return out;
}

export async function getVideos(): Promise<Sourced<Video[]> | null> {
  return cachedSource(["videos"], 1800, loadVideos);
}
