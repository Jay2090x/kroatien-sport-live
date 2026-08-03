/**
 * Tägliche Headlines aus öffentlichen News-RSS-Feeds (Google News u. a.).
 * Rechtlich: nur Aggregation + Link zur Quelle, keine Volltext-Übernahme.
 * Ranking: Relevanz (Vatreni/Clubs) × Frische.
 */

import type { NewsArticle, NewsLocaleText } from "@/lib/data/news";
import {
  cleanNewsText,
  themeImageForArticle,
  THEME_IMAGES,
} from "@/lib/data/news-images";

/** Gezielte Queries – Fokus kroatischer Fußball, täglich frisch */
const FEEDS = [
  // DE / AT
  "https://news.google.com/rss/search?q=Hrvatska+nogomet+OR+Vatreni+OR+%22Slaven+Bili%C4%87%22+when:7d&hl=de&gl=AT&ceid=AT:de",
  "https://news.google.com/rss/search?q=%22Luka+Modri%C4%87%22+OR+Modric+Milan+OR+Gvardiol+OR+Kova%C4%8Di%C4%87+when:7d&hl=de&gl=DE&ceid=DE:de",
  "https://news.google.com/rss/search?q=HNL+Dinamo+OR+Hajduk+OR+Rijeka+nogomet+when:7d&hl=de&gl=AT&ceid=AT:de",
  // EN
  "https://news.google.com/rss/search?q=Croatia+football+OR+Vatreni+OR+%22Slaven+Bilic%22+when:7d&hl=en-GB&gl=GB&ceid=GB:en",
  "https://news.google.com/rss/search?q=%22Luka+Modric%22+OR+Gvardiol+OR+Kovacic+Croatia+when:7d&hl=en-GB&gl=GB&ceid=GB:en",
  // HR
  "https://news.google.com/rss/search?q=Vatreni+OR+Hrvatska+reprezentacija+nogomet+when:7d&hl=hr&gl=HR&ceid=HR:hr",
  "https://news.google.com/rss/search?q=HNL+OR+Dinamo+OR+Hajduk+OR+Rijeka+when:7d&hl=hr&gl=HR&ceid=HR:hr",
];

const RELEVANCE =
  /croat|hrvat|modri|bili[cć]|vatren|hnl|hajduk|dinam|rijeka|osijek|gvardiol|kova[cč]i[cć]|peri[sš]i[cć]|livakovi[cć]|budimir|pa[sš]ali[cć]|brozovi[cć]|vu[sš]kovi[cć]|football|nogomet|soccer|serie\s*a|premier|bundesliga|brighton|milan|city|nations\s*league|liga\s*nacija|transfer|world\s*cup|svjetsko/i;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {
    /* ignore */
  }
  return new Date().toISOString().slice(0, 10);
}

function scoreItem(title: string, desc: string, pubDate: string): number {
  const text = `${title} ${desc}`;
  let score = 0;
  if (/modri|gvardiol|kova[cč]|bili[cć]|vatren/i.test(text)) score += 40;
  if (/hnl|hajduk|dinam|rijeka/i.test(text)) score += 25;
  if (/transfer|contract|ugovor|verläng|extends|produž/i.test(text)) score += 20;
  if (/live|result|rezultat|sieg|pobjed|defeat|poraz/i.test(text)) score += 15;
  if (/nations|liga\s*nacija|euro|em\b|world\s*cup|sp\b/i.test(text)) score += 18;

  const ageMs = Date.now() - new Date(pubDate).getTime();
  const ageDays = Number.isNaN(ageMs) ? 7 : ageMs / (24 * 3600_000);
  if (ageDays <= 1) score += 50;
  else if (ageDays <= 2) score += 40;
  else if (ageDays <= 3) score += 30;
  else if (ageDays <= 5) score += 15;
  else if (ageDays <= 7) score += 5;
  else score -= 40;

  return score;
}

function categorize(title: string, desc: string): NewsArticle["category"] {
  const t = `${title} ${desc}`;
  if (/transfer|ugovor|contract|verläng|extends|produž|sign/i.test(t))
    return "transfer";
  if (/hnl|hajduk|dinam|rijeka|osijek/i.test(t)) return "hnl";
  if (/vatren|reprezent|nations|bilic|bili[cć]|croatia\s+vs|hrvatska\s+–/i.test(t))
    return "vatreni";
  if (/preview|vorschau|najava|preview/i.test(t)) return "preview";
  return "clubs";
}

function tagFor(
  cat: NewsArticle["category"]
): NewsLocaleText {
  switch (cat) {
    case "transfer":
      return { de: "Transfer", en: "Transfer", hr: "Transfer" };
    case "hnl":
      return { de: "HNL", en: "HNL", hr: "HNL" };
    case "vatreni":
      return { de: "Vatreni", en: "Vatreni", hr: "Vatreni" };
    case "preview":
      return { de: "Vorschau", en: "Preview", hr: "Najava" };
    default:
      return { de: "Clubs", en: "Clubs", hr: "Klubovi" };
  }
}

function buildTexts(
  titleRaw: string,
  descRaw: string,
  sourceHint: string
): {
  title: NewsLocaleText;
  summary: NewsLocaleText;
  body: NewsLocaleText;
} {
  let title = cleanNewsText(titleRaw, 120);
  const parts = title.split(/\s+[-–|]\s+/);
  let source = sourceHint;
  if (parts.length >= 2) {
    const maybeSource = parts[parts.length - 1]!;
    if (maybeSource.length < 40) {
      source = maybeSource;
      title = parts.slice(0, -1).join(" – ");
    }
  }

  let summary = cleanNewsText(descRaw, 280);
  if (!summary || summary.length < 30 || summary === title) {
    summary =
      source
        ? `${title} (${source}). Kurzfassung aus öffentlichem News-Feed – Originalquelle öffnen.`
        : `${title}. Kurzfassung aus öffentlichem News-Feed – Originalquelle öffnen.`;
  }

  const footerDe =
    "Aggregation öffentlicher Headlines. Wir hosten keine Volltexte Dritter. Bitte Originalquelle prüfen.";
  const footerEn =
    "Public headline aggregation. We do not host third-party full articles. Please check the original source.";
  const footerHr =
    "Agregacija javnih naslova. Ne hostamo tuđe full tekstove. Provjeri izvorni članak.";

  return {
    title: { de: title, en: title, hr: title },
    summary: { de: summary, en: summary, hr: summary },
    body: {
      de: [summary, "", source ? `Quelle/Feed: ${source}` : "", footerDe]
        .filter(Boolean)
        .join("\n\n"),
      en: [summary, "", source ? `Source/feed: ${source}` : "", footerEn]
        .filter(Boolean)
        .join("\n\n"),
      hr: [summary, "", source ? `Izvor/feed: ${source}` : "", footerHr]
        .filter(Boolean)
        .join("\n\n"),
    },
  };
}

function parseRssItems(xml: string, limit: number): Array<{
  title: string;
  link: string;
  pubDate: string;
  description: string;
  score: number;
}> {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
    score: number;
  }> = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    if (items.length >= limit) break;
    const titleRaw =
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? "";
    const title = cleanNewsText(titleRaw, 160);
    let link =
      (block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ?? [])[1] ??
      (block.match(/<link>([\s\S]*?)<\/link>/i) ?? [])[1] ??
      (block.match(/<link[^>]+href=["']([^"']+)["']/i) ?? [])[1] ??
      "";
    link = link.replace(/<[^>]+>/g, "").trim();
    const pubDate =
      (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ?? [])[1] ?? "";
    const description =
      (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ??
        [])[1] ?? "";
    if (!title || title.length < 12) continue;
    if (!RELEVANCE.test(`${title} ${description}`)) continue;
    const score = scoreItem(title, description, pubDate);
    if (score < 10) continue;
    items.push({
      title: titleRaw,
      link: link.startsWith("http") ? link : "",
      pubDate: pubDate.trim(),
      description,
      score,
    });
  }
  return items;
}

async function fetchFeed(
  url: string,
  limit: number
): Promise<ReturnType<typeof parseRssItems>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "KroatienSportLive/1.0 (news aggregator; +https://kroatien-sport-live.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    return parseRssItems(await res.text(), limit);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Holt und rankt frische Headlines. Standard: bis 16 Items für den Tages-Feed.
 */
export async function fetchAutoNews(max = 16): Promise<NewsArticle[]> {
  const perFeed = Math.min(12, Math.ceil(max / 2) + 3);
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f, perFeed)));

  type Raw = {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    score: number;
  };
  const flat: Raw[] = [];
  for (const batch of results) flat.push(...batch);

  // Dedup by normalized title stem
  const byKey = new Map<string, Raw>();
  for (const item of flat) {
    const key = slugify(cleanNewsText(item.title, 60)).slice(0, 48);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || item.score > prev.score) byKey.set(key, item);
  }

  const ranked = Array.from(byKey.values()).sort((a, b) => b.score - a.score);

  const articles: NewsArticle[] = [];
  const seenIds = new Set<string>();

  for (const item of ranked) {
    if (articles.length >= max) break;
    const baseSlug =
      slugify(cleanNewsText(item.title, 80)) || `auto-${articles.length}`;
    const id = `auto-${baseSlug}`.slice(0, 96);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const cat = categorize(item.title, item.description);
    const texts = buildTexts(item.title, item.description, "");
    const themeUrl =
      themeImageForArticle(id, item.title) ?? THEME_IMAGES.croatia;
    const ageDays =
      (Date.now() - new Date(item.pubDate).getTime()) / (24 * 3600_000);
    const featured = item.score >= 70 && ageDays <= 2;

    articles.push({
      id,
      date: parseDate(item.pubDate),
      category: cat,
      tag: tagFor(cat),
      ...texts,
      image: {
        url: themeUrl,
        alt: { de: "News", en: "News", hr: "Vijest" },
      },
      sourceUrl: item.link || undefined,
      featured,
    });
  }

  return articles;
}
