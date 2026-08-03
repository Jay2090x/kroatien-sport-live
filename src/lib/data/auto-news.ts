/**
 * Headlines pro UI-Sprache – strikt getrennt.
 * Nur Titel + Quelle + Link. Nie RSS-Description (HTML-Müll).
 */

import type { Locale } from "@/i18n/routing";
import type { NewsArticle, NewsLocaleText } from "@/lib/data/news";
import {
  isUsableHeadline,
  sanitizeNewsDisplay,
} from "@/lib/data/news-text";
import { themeImageForArticle, THEME_IMAGES } from "@/lib/data/news-images";

type FeedDef = {
  url: string;
  prefer?: string;
  label: string;
  lang: Locale;
};

/** Feeds strikt nach Sprache – DE sieht primär DE (+ HR optional separat) */
const FEEDS_BY_LANG: Record<Locale, FeedDef[]> = {
  de: [
    {
      url: "https://news.google.com/rss/search?q=%22Luka+Modri%C4%87%22+OR+Gvardiol+OR+Kova%C4%8Di%C4%87+OR+Vatreni+OR+%22kroatische+Nationalmannschaft%22+when:5d&hl=de&gl=DE&ceid=DE:de",
      label: "Google",
      lang: "de",
    },
    {
      url: "https://news.google.com/rss/search?q=HNL+OR+Hajduk+OR+%22Dinamo+Zagreb%22+OR+Rijeka+OR+Osijek+when:5d&hl=de&gl=AT&ceid=AT:de",
      label: "HNL",
      lang: "de",
    },
    {
      url: "https://news.google.com/rss/search?q=site:kicker.de+Modric+OR+Gvardiol+OR+Kroatien+when:7d&hl=de&gl=DE&ceid=DE:de",
      prefer: "kicker.de",
      label: "Kicker",
      lang: "de",
    },
    {
      url: "https://news.google.com/rss/search?q=site:sport1.de+Kroatien+OR+Modric+when:7d&hl=de&gl=DE&ceid=DE:de",
      prefer: "sport1.de",
      label: "SPORT1",
      lang: "de",
    },
  ],
  hr: [
    {
      url: "https://news.google.com/rss/search?q=site:index.hr+(Vatreni+OR+Modri%C4%87+OR+HNL+OR+Hajduk+OR+Dinamo+OR+Bili%C4%87)&hl=hr&gl=HR&ceid=HR:hr",
      prefer: "index.hr",
      label: "Index",
      lang: "hr",
    },
    {
      url: "https://news.google.com/rss/search?q=site:sportske.jutarnji.hr+(Hrvatska+OR+Vatreni+OR+HNL+OR+Modri%C4%87)&hl=hr&gl=HR&ceid=HR:hr",
      prefer: "jutarnji.hr",
      label: "Sportske",
      lang: "hr",
    },
    {
      url: "https://news.google.com/rss/search?q=site:gol.dnevnik.hr+(Vatreni+OR+HNL+OR+Modri%C4%87)&hl=hr&gl=HR&ceid=HR:hr",
      prefer: "gol.dnevnik.hr",
      label: "Gol",
      lang: "hr",
    },
    {
      url: "https://www.hrt.hr/rss/sport",
      prefer: "hrt.hr",
      label: "HRT",
      lang: "hr",
    },
    {
      url: "https://news.google.com/rss/search?q=site:hns.team+(Vatreni+OR+reprezentacija)&hl=hr&gl=HR&ceid=HR:hr",
      prefer: "hns.team",
      label: "HNS",
      lang: "hr",
    },
  ],
  en: [
    {
      url: "https://news.google.com/rss/search?q=%22Luka+Modric%22+OR+Gvardiol+OR+Kovacic+OR+%22Croatia+national%22+football+when:5d&hl=en-GB&gl=GB&ceid=GB:en",
      label: "Google",
      lang: "en",
    },
    {
      url: "https://news.google.com/rss/search?q=site:espn.com+Croatia+football+OR+Modric+OR+Gvardiol+when:7d&hl=en-GB&gl=GB&ceid=GB:en",
      prefer: "espn.com",
      label: "ESPN",
      lang: "en",
    },
    {
      url: "https://news.google.com/rss/search?q=site:bbc.com+Croatia+football+OR+Modric+when:7d&hl=en-GB&gl=GB&ceid=GB:en",
      prefer: "bbc.com",
      label: "BBC",
      lang: "en",
    },
  ],
};

const BLACKLIST =
  /pinterest\.|facebook\.com\/groups|reddit\.com|tiktok\.com|doubleclick|outbrain|taboola|blogspot\.|quiz|clickbait|transfermarkt\.[a-z.]+\/.*seite|gemeinsame spiele|bilanz gegen/i;

const RELEVANCE =
  /croat|hrvat|modri|bili[cć]|vatren|hnl|hajduk|dinam|rijeka|osijek|gvardiol|kova[cč]|peri[sš]|livakovi|budimir|nogomet|football|soccer|reprezent|izbornik|transfer|nations|liga\s*nacija|serie\s*a|milan|premier|bundesliga|kroatien/i;

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_VER = "v3-locale";
type CacheBucket = { at: number; articles: NewsArticle[] };
const cacheStore = globalThis as unknown as {
  __kslNewsCache?: Record<string, CacheBucket>;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
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

function extractTitleAndSource(titleRaw: string): {
  title: string;
  source: string;
} {
  let t = sanitizeNewsDisplay(titleRaw, 160);
  if (!t) return { title: "", source: "" };
  const parts = t.split(/\s+[-–|]\s+/);
  if (parts.length >= 2) {
    const maybe = parts[parts.length - 1]!.trim();
    if (maybe.length > 1 && maybe.length < 40) {
      return {
        title: parts.slice(0, -1).join(" – ").trim() || t,
        source: maybe,
      };
    }
  }
  return { title: t, source: "" };
}

function scoreTitle(
  title: string,
  pubDate: string,
  link: string,
  prefer?: string
): number {
  let score = 10;
  if (/modri|gvardiol|kova[cč]|bili[cć]|vatren|izbornik/i.test(title))
    score += 40;
  if (/hnl|hajduk|dinam|rijeka/i.test(title)) score += 25;
  if (/transfer|ugovor|verläng|contract|return|oprostit/i.test(title))
    score += 18;
  if (prefer && link.toLowerCase().includes(prefer)) score += 20;

  const age =
    (Date.now() - new Date(pubDate).getTime()) / (24 * 3600_000);
  if (Number.isNaN(age)) return score;
  if (age <= 1) score += 45;
  else if (age <= 2) score += 35;
  else if (age <= 4) score += 20;
  else if (age <= 7) score += 8;
  else score -= 40;
  return score;
}

function categorize(title: string): NewsArticle["category"] {
  if (/transfer|ugovor|contract|verläng|return|oprostit/i.test(title))
    return "transfer";
  if (/hnl|hajduk|dinam|rijeka|osijek/i.test(title)) return "hnl";
  if (/vatren|reprezent|nations|bilic|bili[cć]|izbornik|national/i.test(title))
    return "vatreni";
  return "clubs";
}

/** Summary: nur lokalisierter Hinweis – nie fremdsprachiger HTML-Müll */
function localizedTeaser(
  source: string,
  lang: Locale
): NewsLocaleText {
  const src = source || "Media";
  return {
    de: `Meldung von ${src}. Volltext nur in der Originalquelle (kein Framing, kein Volltext-Hosting).`,
    en: `Report via ${src}. Full story only on the original site (no framing, no full-text hosting).`,
    hr: `Vijest putem ${src}. Puni tekst samo na izvoru (bez framanja, bez hostanja full teksta).`,
  };
}

function tagFor(source: string, lang: Locale): NewsLocaleText {
  const s = source || "Feed";
  return { de: s, en: s, hr: s };
}

type Raw = {
  title: string;
  link: string;
  pubDate: string;
  score: number;
  source: string;
  lang: Locale;
};

function parseFeed(xml: string, feed: FeedDef, limit: number): Raw[] {
  const out: Raw[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    if (out.length >= limit) break;
    const titleEnc =
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? "";
    const { title, source: fromTitle } = extractTitleAndSource(titleEnc);
    if (!isUsableHeadline(title)) continue;
    if (BLACKLIST.test(title)) continue;
    if (!RELEVANCE.test(title)) continue;

    let link =
      (block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ?? [])[1] ??
      (block.match(/<link>([\s\S]*?)<\/link>/i) ?? [])[1] ??
      "";
    if (!link.startsWith("http")) {
      const m = block.match(/https?:\/\/[^\s<>"']+/i);
      if (m) link = m[0]!;
    }
    link = link.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    if (!link.startsWith("http")) continue;
    if (BLACKLIST.test(link)) continue;

    const pubDate =
      (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ?? [])[1] ?? "";
    const source = feed.label || fromTitle || "Feed";
    const score = scoreTitle(title, pubDate, link, feed.prefer);
    if (score < 15) continue;

    out.push({
      title,
      link,
      pubDate: pubDate.trim(),
      score,
      source,
      lang: feed.lang,
    });
  }
  return out;
}

async function fetchOne(feed: FeedDef, limit: number): Promise<Raw[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KroatienSportLive/2.0; +https://kroatien-sport-live.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    return parseFeed(await res.text(), feed, limit);
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

/**
 * Headlines nur für eine UI-Sprache.
 * @param locale UI-Locale
 * @param max max items
 * @param includeRelatedHR for DE: also pull a few HR headlines (optional)
 */
export async function fetchAutoNews(
  max = 16,
  locale: Locale = "de",
  includeRelatedHR = false
): Promise<NewsArticle[]> {
  const cacheKey = `${CACHE_VER}:${locale}:${includeRelatedHR ? "hr+" : ""}`;
  if (!cacheStore.__kslNewsCache) cacheStore.__kslNewsCache = {};
  const hit = cacheStore.__kslNewsCache[cacheKey];
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.articles.slice(0, max);
  }

  const feeds = [...(FEEDS_BY_LANG[locale] ?? FEEDS_BY_LANG.de)];
  // DE: optional 2 HR feeds for Croatian media (titles stay HR – marked)
  if (locale === "de" && includeRelatedHR) {
    feeds.push(...FEEDS_BY_LANG.hr.slice(0, 2));
  }

  const batches = await Promise.all(feeds.map((f) => fetchOne(f, 12)));
  const flat = batches.flat();

  const byKey = new Map<string, Raw>();
  for (const item of flat) {
    // Strict: only keep items whose feed language matches UI,
    // except optional HR for DE
    if (item.lang !== locale) {
      if (!(locale === "de" && item.lang === "hr" && includeRelatedHR)) {
        continue;
      }
    }
    const key = slugify(item.title);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || item.score > prev.score) byKey.set(key, item);
  }

  const ranked = Array.from(byKey.values()).sort((a, b) => b.score - a.score);
  const articles: NewsArticle[] = [];
  const seen = new Set<string>();

  // Cap HR extras on DE
  let hrCount = 0;
  const hrCap = includeRelatedHR ? 4 : 0;

  for (const item of ranked) {
    if (articles.length >= max) break;
    if (item.lang === "hr" && locale === "de") {
      if (hrCount >= hrCap) continue;
      hrCount += 1;
    }

    const id = `auto-${slugify(item.title)}`.slice(0, 96);
    if (seen.has(id)) continue;
    seen.add(id);

    const titleClean = sanitizeNewsDisplay(item.title, 140);
    if (!isUsableHeadline(titleClean)) continue;

    const teaser = localizedTeaser(item.source, locale);
    // Title in all locales = original (same language as feed)
    const title: NewsLocaleText = {
      de: titleClean,
      en: titleClean,
      hr: titleClean,
    };

    const age =
      (Date.now() - new Date(item.pubDate).getTime()) / (24 * 3600_000);
    articles.push({
      id,
      date: parseDate(item.pubDate),
      category: categorize(titleClean),
      tag: tagFor(item.source, item.lang),
      title,
      summary: teaser,
      body: {
        de: [
          titleClean,
          "",
          `Quelle: ${item.source}.`,
          teaser.de,
        ].join("\n\n"),
        en: [
          titleClean,
          "",
          `Source: ${item.source}.`,
          teaser.en,
        ].join("\n\n"),
        hr: [
          titleClean,
          "",
          `Izvor: ${item.source}.`,
          teaser.hr,
        ].join("\n\n"),
      },
      image: {
        url: themeImageForArticle(id, titleClean) ?? THEME_IMAGES.croatia,
        alt: { de: "News", en: "News", hr: "Vijest" },
      },
      sourceUrl: item.link,
      sourceLang: item.lang,
      sourceName: item.source,
      isExternal: true,
      featured: item.score >= 70 && age <= 2,
    });
  }

  cacheStore.__kslNewsCache[cacheKey] = {
    at: Date.now(),
    articles,
  };
  return articles;
}
