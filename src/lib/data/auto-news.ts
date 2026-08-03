/**
 * Tägliche Headlines – Whitelist-Quellen + Google News (site:) + HRT RSS.
 * Rechtlich: nur Titel/Teaser + Link zur Originalquelle, kein Volltext-Hosting.
 */

import type { NewsArticle, NewsLocaleText } from "@/lib/data/news";
import {
  cleanNewsText,
  themeImageForArticle,
  THEME_IMAGES,
} from "@/lib/data/news-images";

type FeedDef = {
  url: string;
  /** Bevorzugte Domain im Score */
  prefer?: string;
  /** Soft-Label für Tag */
  label?: string;
};

/**
 * Gezielte Feeds: kroatische Sportmedien via Google site: + HRT + Stars DE/EN.
 */
const FEEDS: FeedDef[] = [
  // HR – Qualitätsmedien über Google News
  {
    url: "https://news.google.com/rss/search?q=site:index.hr+(Vatreni+OR+Modri%C4%87+OR+HNL+OR+Hajduk+OR+Dinamo+OR+Bili%C4%87)&hl=hr&gl=HR&ceid=HR:hr",
    prefer: "index.hr",
    label: "Index",
  },
  {
    url: "https://news.google.com/rss/search?q=site:sportske.jutarnji.hr+(Hrvatska+OR+Vatreni+OR+HNL+OR+Modri%C4%87)&hl=hr&gl=HR&ceid=HR:hr",
    prefer: "jutarnji.hr",
    label: "Sportske",
  },
  {
    url: "https://news.google.com/rss/search?q=site:gol.dnevnik.hr+(Vatreni+OR+HNL+OR+Modri%C4%87+OR+reprezentacija)&hl=hr&gl=HR&ceid=HR:hr",
    prefer: "gol.dnevnik.hr",
    label: "Gol",
  },
  {
    url: "https://news.google.com/rss/search?q=site:hns.team+(Vatreni+OR+reprezentacija+OR+izbornik)&hl=hr&gl=HR&ceid=HR:hr",
    prefer: "hns.team",
    label: "HNS",
  },
  // HRT Sport RSS (direkt)
  {
    url: "https://www.hrt.hr/rss/sport",
    prefer: "hrt.hr",
    label: "HRT",
  },
  // DE / EN Stars & NT
  {
    url: "https://news.google.com/rss/search?q=%22Luka+Modri%C4%87%22+OR+%22Luka+Modric%22+OR+Gvardiol+OR+Kova%C4%8Di%C4%87+OR+Kovacic+when:5d&hl=de&gl=DE&ceid=DE:de",
    label: "DE",
  },
  {
    url: "https://news.google.com/rss/search?q=Croatia+football+OR+Vatreni+OR+%22Slaven+Bilic%22+OR+%22Slaven+Bili%C4%87%22+when:5d&hl=en-GB&gl=GB&ceid=GB:en",
    label: "EN",
  },
  {
    url: "https://news.google.com/rss/search?q=HNL+OR+Hajduk+OR+%22Dinamo+Zagreb%22+OR+Rijeka+nogomet+when:5d&hl=de&gl=AT&ceid=AT:de",
    label: "HNL",
  },
  {
    url: "https://news.google.com/rss/search?q=site:espn.com+Croatia+football+OR+Modric+OR+Gvardiol+when:7d&hl=en-GB&gl=GB&ceid=GB:en",
    prefer: "espn.com",
    label: "ESPN",
  },
  {
    url: "https://news.google.com/rss/search?q=site:bbc.com+Croatia+football+OR+Modric+when:7d&hl=en-GB&gl=GB&ceid=GB:en",
    prefer: "bbc.com",
    label: "BBC",
  },
];

/** Domains die wir bevorzugen / als „verifiziert“ markieren */
const TRUSTED =
  /index\.hr|jutarnji\.hr|gol\.dnevnik\.hr|hrt\.hr|hns\.team|espn\.com|bbc\.|reuters\.|goal\.com|skysports\.com|theguardian\.com|transfermarkt\.|uefa\.com|fifa\.com|sportnet\.hr|vecernji\.hr|24sata\.hr/i;

const RELEVANCE =
  /croat|hrvat|modri|bili[cć]|vatren|hnl|hajduk|dinam|rijeka|osijek|vukovar|gvardiol|kova[cč]i[cć]|peri[sš]i[cć]|livakovi[cć]|budimir|pa[sš]ali[cć]|brozovi[cć]|vu[sš]kovi[cć]|baturina|su[cč]i[cć]|stan[ií][sš]i[cć]|nogomet|football|soccer|serie\s*a|premier|bundesliga|nations|liga\s*nacija|reprezent|izbornik|transfer|ugovor|world\s*cup|svjetsko|konferencijsk|liga\s*prvaka|champions/i;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function decodeXml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
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

function extractSourceFromTitle(title: string): {
  cleanTitle: string;
  source: string;
} {
  let t = cleanNewsText(title, 160);
  const parts = t.split(/\s+[-–|]\s+/);
  if (parts.length >= 2) {
    const maybe = parts[parts.length - 1]!.trim();
    if (maybe.length > 1 && maybe.length < 48) {
      return {
        cleanTitle: parts.slice(0, -1).join(" – ").trim() || t,
        source: maybe,
      };
    }
  }
  return { cleanTitle: t, source: "" };
}

function scoreItem(
  title: string,
  desc: string,
  pubDate: string,
  link: string,
  prefer?: string
): number {
  const text = `${title} ${desc}`;
  let score = 0;

  if (/modri|gvardiol|kova[cč]|bili[cć]|vatren|izbornik/i.test(text))
    score += 45;
  if (/hnl|hajduk|dinam|rijeka|osijek/i.test(text)) score += 28;
  if (/transfer|contract|ugovor|verläng|extends|produž|oprostit|retire/i.test(text))
    score += 22;
  if (/nations|liga\s*nacija|euro|world\s*cup|svjetsko|konferencijsk/i.test(text))
    score += 18;

  if (prefer && link.toLowerCase().includes(prefer.replace(/^www\./, "")))
    score += 25;
  if (TRUSTED.test(link) || TRUSTED.test(title)) score += 20;

  const ageMs = Date.now() - new Date(pubDate).getTime();
  const ageDays = Number.isNaN(ageMs) ? 5 : ageMs / (24 * 3600_000);
  if (ageDays <= 0.5) score += 55;
  else if (ageDays <= 1) score += 48;
  else if (ageDays <= 2) score += 38;
  else if (ageDays <= 3) score += 28;
  else if (ageDays <= 5) score += 15;
  else if (ageDays <= 7) score += 5;
  else score -= 50;

  // Noise
  if (/transfermarkt.*gemeinsame|bilanz gegen|seite \d/i.test(title))
    score -= 80;
  if (/u19|u17|u21/i.test(title) && !/vatren|a\s*reprezent/i.test(title))
    score -= 10;

  return score;
}

function categorize(title: string, desc: string): NewsArticle["category"] {
  const t = `${title} ${desc}`;
  if (/transfer|ugovor|contract|verläng|extends|produž|sign|oprostit|retire/i.test(t))
    return "transfer";
  if (/hnl|hajduk|dinam|rijeka|osijek|vukovar/i.test(t)) return "hnl";
  if (
    /vatren|reprezent|nations|bilic|bili[cć]|izbornik|croatia\s+vs|hrvatska/i.test(
      t
    )
  )
    return "vatreni";
  if (/preview|vorschau|najava|play-off|playoff/i.test(t)) return "preview";
  return "clubs";
}

function tagFor(
  cat: NewsArticle["category"],
  source: string
): NewsLocaleText {
  const src = source.slice(0, 24) || "";
  switch (cat) {
    case "transfer":
      return {
        de: src ? `Transfer · ${src}` : "Transfer",
        en: src ? `Transfer · ${src}` : "Transfer",
        hr: src ? `Transfer · ${src}` : "Transfer",
      };
    case "hnl":
      return {
        de: src ? `HNL · ${src}` : "HNL",
        en: src ? `HNL · ${src}` : "HNL",
        hr: src ? `HNL · ${src}` : "HNL",
      };
    case "vatreni":
      return {
        de: src ? `Vatreni · ${src}` : "Vatreni",
        en: src ? `Vatreni · ${src}` : "Vatreni",
        hr: src ? `Vatreni · ${src}` : "Vatreni",
      };
    case "preview":
      return {
        de: src ? `Vorschau · ${src}` : "Vorschau",
        en: src ? `Preview · ${src}` : "Preview",
        hr: src ? `Najava · ${src}` : "Najava",
      };
    default:
      return {
        de: src ? `Clubs · ${src}` : "Clubs",
        en: src ? `Clubs · ${src}` : "Clubs",
        hr: src ? `Klubovi · ${src}` : "Klubovi",
      };
  }
}

function buildTexts(
  titleRaw: string,
  descRaw: string,
  source: string
): {
  title: NewsLocaleText;
  summary: NewsLocaleText;
  body: NewsLocaleText;
} {
  const { cleanTitle, source: fromTitle } = extractSourceFromTitle(titleRaw);
  const src = source || fromTitle;

  let summary = cleanNewsText(decodeXml(descRaw).replace(/<[^>]+>/g, " "), 280);
  if (!summary || summary.length < 24 || summary === cleanTitle) {
    summary =
      src
        ? `${cleanTitle} – Meldung über ${src}. Volltext nur in der Originalquelle.`
        : `${cleanTitle} – aktuelle Meldung aus öffentlichem News-Feed. Volltext in der Originalquelle.`;
  }

  const legalDe =
    "Aggregation öffentlicher Headlines. Wir hosten keine Volltexte Dritter. Bitte Originalquelle und Nutzungsrechte prüfen.";
  const legalEn =
    "Public headline aggregation. We do not host third-party full articles. Check the original source and its terms.";
  const legalHr =
    "Agregacija javnih naslova. Ne hostamo tuđe full tekstove. Provjeri izvorni članak i uvjete korištenja.";

  return {
    title: { de: cleanTitle, en: cleanTitle, hr: cleanTitle },
    summary: { de: summary, en: summary, hr: summary },
    body: {
      de: [summary, "", src ? `Quelle: ${src}` : "", legalDe]
        .filter(Boolean)
        .join("\n\n"),
      en: [summary, "", src ? `Source: ${src}` : "", legalEn]
        .filter(Boolean)
        .join("\n\n"),
      hr: [summary, "", src ? `Izvor: ${src}` : "", legalHr]
        .filter(Boolean)
        .join("\n\n"),
    },
  };
}

type RawItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  score: number;
  sourceHint: string;
};

function parseRssItems(
  xml: string,
  limit: number,
  prefer?: string,
  sourceHint = ""
): RawItem[] {
  const items: RawItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    if (items.length >= limit) break;
    const titleRaw = decodeXml(
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? ""
    );
    const title = cleanNewsText(titleRaw, 160);
    let link =
      (block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ?? [])[1] ??
      (block.match(/<link>([\s\S]*?)<\/link>/i) ?? [])[1] ??
      (block.match(/<link[^>]+href=["']([^"']+)["']/i) ?? [])[1] ??
      "";
    // Google often puts URL in guid
    if (!link || !link.startsWith("http")) {
      const guid =
        (block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) ?? [])[1] ?? "";
      const g = decodeXml(guid).replace(/<[^>]+>/g, "").trim();
      if (g.startsWith("http")) link = g;
    }
    link = decodeXml(link).replace(/<[^>]+>/g, "").trim();

    const pubDate =
      (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ?? [])[1] ?? "";
    const description =
      (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ??
        [])[1] ?? "";

    if (!title || title.length < 10) continue;
    if (!RELEVANCE.test(`${title} ${description}`)) continue;

    const score = scoreItem(title, description, pubDate, link, prefer);
    if (score < 8) continue;

    items.push({
      title: titleRaw,
      link: link.startsWith("http") ? link : "",
      pubDate: pubDate.trim(),
      description,
      score,
      sourceHint,
    });
  }
  return items;
}

async function fetchFeed(
  feed: FeedDef,
  limit: number
): Promise<RawItem[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KroatienSportLive/1.1; +https://kroatien-sport-live.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 1200 },
    });
    if (!res.ok) return [];
    return parseRssItems(
      await res.text(),
      limit,
      feed.prefer,
      feed.label ?? ""
    );
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Holt und rankt frische Headlines. Standard bis 24 Items.
 */
export async function fetchAutoNews(max = 24): Promise<NewsArticle[]> {
  const perFeed = 10;
  const results = await Promise.all(
    FEEDS.map((f) => fetchFeed(f, perFeed))
  );

  const flat = results.flat();
  const byKey = new Map<string, RawItem>();
  for (const item of flat) {
    const key = slugify(extractSourceFromTitle(item.title).cleanTitle).slice(
      0,
      52
    );
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || item.score > prev.score) byKey.set(key, item);
  }

  const ranked = Array.from(byKey.values()).sort((a, b) => b.score - a.score);
  const articles: NewsArticle[] = [];
  const seenIds = new Set<string>();

  for (const item of ranked) {
    if (articles.length >= max) break;
    const { cleanTitle, source: fromTitle } = extractSourceFromTitle(
      item.title
    );
    const source = item.sourceHint || fromTitle;
    const baseSlug = slugify(cleanTitle) || `auto-${articles.length}`;
    const id = `auto-${baseSlug}`.slice(0, 96);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const cat = categorize(item.title, item.description);
    const texts = buildTexts(item.title, item.description, source);
    const themeUrl =
      themeImageForArticle(id, item.title) ?? THEME_IMAGES.croatia;
    const ageDays =
      (Date.now() - new Date(item.pubDate).getTime()) / (24 * 3600_000);
    const featured = item.score >= 75 && ageDays <= 2;

    articles.push({
      id,
      date: parseDate(item.pubDate),
      category: cat,
      tag: tagFor(cat, source),
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
