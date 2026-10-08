import { cachedSource, REVALIDATE, type Sourced } from "../cache";
import { fetchText } from "../http";
import { parseRss } from "./rss";

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

const HRT_FEED = "https://feed.hrt.hr/sport/page.xml";

const GOOGLE_FEEDS = [
  // Deutschsprachig: Nationalmannschaft
  "https://news.google.com/rss/search?q=(Kroatien+OR+Vatreni+OR+Modri%C4%87+OR+Dali%C4%87)+Fu%C3%9Fball+when:3d&hl=de&gl=AT&ceid=AT:de",
  // Kroatisch: HNL + Reprezentacija
  "https://news.google.com/rss/search?q=(HNL+OR+Vatreni+OR+Hajduk+OR+%22Dinamo+Zagreb%22+OR+%22HNK+Rijeka%22)+nogomet+when:3d&hl=hr&gl=HR&ceid=HR:hr",
];

const FOOTBALL =
  /nogomet|\bhnl\b|vatren|hajduk|dinamo|rijek|osijek|vara[zž]din|gorica|istra 1961|lokomotiv|slaven belupo|rude[sš]|reprezentacij|modri[cć]|gvardiol|kova[cč]i[cć]|dali[cć]|kroatien|fu(ss|ß)ball|nations league|liga nacija|liga prvaka|konferencijsk|poljud|maksimir|livakovi[cć]|kramari[cć]|peri[sš]i[cć]|budimir|baturina|su[cč]i[cć]|stani[sš]i[cć]|vatreni/i;
const CROATIAN =
  /hrvat|kroat|croat|vatren|modri[cć]|gvardiol|kova[cč]i[cć]|dali[cć]|\bhnl\b|hajduk|dinamo|rijek|osijek|livakovi[cć]|kramari[cć]|peri[sš]i[cć]|budimir|baturina|su[cč]i[cć]|stani[sš]i[cć]|pa[sš]ali[cć]/i;
const EXCLUDE =
  /rukomet|ko[sš]ark|vaterpol|futsal|tenis|handball|basketball|wasserball|tennis|\bu-?1[5-9]\b|\bu-?2[01]\b|junior|kadet|transfermarkt|ora[sš]je|negotin|\bnba\b|formula|\bski\b/i;

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): Set<string> {
  return new Set(norm(s).split(" ").filter((t) => t.length > 2));
}

function similar(a: Set<string>, b: Set<string>): boolean {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union > 0 && inter / union >= 0.5;
}

function toIso(pub: string | null): string | null {
  if (!pub) return null;
  const t = Date.parse(pub);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

async function loadHrt(): Promise<NewsItem[]> {
  const items = parseRss(await fetchText(HRT_FEED));
  const out: NewsItem[] = [];
  for (const it of items) {
    let path = "";
    try {
      const u = new URL(it.link);
      if (u.hostname !== "sport.hrt.hr") continue; // keine Video-Dateien etc.
      path = u.pathname.split("/")[1] ?? "";
    } catch {
      continue;
    }
    const iso = toIso(it.pubDate);
    if (!iso || EXCLUDE.test(it.title)) continue;
    const ok =
      path === "hrvatski-nogomet" ||
      (path === "medunarodni-nogomet" && CROATIAN.test(it.title)) ||
      (path === "vise-sportova" && FOOTBALL.test(it.title) && CROATIAN.test(it.title));
    if (!ok) continue;
    out.push({ title: it.title, url: it.link, source: "HRT Sport", publishedAt: iso });
  }
  return out;
}

async function loadGoogle(url: string): Promise<NewsItem[]> {
  const items = parseRss(await fetchText(url));
  const out: NewsItem[] = [];
  for (const it of items) {
    const iso = toIso(it.pubDate);
    if (!iso) continue;
    const source = it.source?.trim() || "Google News";
    // Google hängt " - Quelle" an den Titel an
    let title = it.title;
    if (it.source && title.endsWith(` - ${it.source}`)) title = title.slice(0, -(it.source.length + 3)).trim();
    if (!FOOTBALL.test(title) || !CROATIAN.test(title) || EXCLUDE.test(title) || EXCLUDE.test(source)) continue;
    out.push({ title, url: it.link, source, publishedAt: iso });
  }
  return out;
}

export function selectNews(all: NewsItem[], now = Date.now(), max = 8): NewsItem[] {
  const fresh = (days: number) =>
    all.filter((n) => {
      const t = Date.parse(n.publishedAt);
      return t <= now + 3600_000 && now - t <= days * 86400_000;
    });
  let pool = fresh(3);
  if (pool.length < 4) pool = fresh(7);
  // HRT zuerst (direkter Link), dann nach Zeit – fürs Dedupe
  pool.sort((a, b) =>
    a.source === b.source
      ? Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      : a.source === "HRT Sport"
        ? -1
        : b.source === "HRT Sport"
          ? 1
          : Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  );
  const kept: Array<{ item: NewsItem; tok: Set<string> }> = [];
  for (const item of pool) {
    const tok = tokens(item.title);
    if (tok.size === 0 || kept.some((k) => k.item.url === item.url || similar(k.tok, tok))) continue;
    kept.push({ item, tok });
  }
  return kept
    .map((k) => k.item)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, max);
}

async function loadNews(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled([loadHrt(), ...GOOGLE_FEEDS.map(loadGoogle)]);
  const ok = settled.filter((s): s is PromiseFulfilledResult<NewsItem[]> => s.status === "fulfilled");
  if (ok.length === 0) throw new Error("news: all feeds failed");
  const items = selectNews(ok.flatMap((s) => s.value));
  if (items.length === 0) throw new Error("news: no relevant items");
  return items;
}

export function getNews(): Promise<Sourced<NewsItem[]> | null> {
  return cachedSource(["news"], REVALIDATE.news, loadNews);
}
