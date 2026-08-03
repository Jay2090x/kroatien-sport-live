/**
 * Tägliche Headlines – Whitelist-Quellen + Google News (site:) + HRT RSS.
 * Rechtlich: nur bereinigter Titel + Link zur Originalquelle, kein HTML/Volltext.
 */

import type { Locale } from "@/i18n/routing";
import type { NewsArticle, NewsLocaleText } from "@/lib/data/news";
import {
  cleanNewsText,
  isUsableNewsTeaser,
  themeImageForArticle,
  THEME_IMAGES,
} from "@/lib/data/news-images";

type FeedDef = {
  url: string;
  prefer?: string;
  label?: string;
  /** Sprache der Headlines in diesem Feed */
  lang: Locale;
};

const FEEDS: FeedDef[] = [
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
    url: "https://news.google.com/rss/search?q=site:gol.dnevnik.hr+(Vatreni+OR+HNL+OR+Modri%C4%87+OR+reprezentacija)&hl=hr&gl=HR&ceid=HR:hr",
    prefer: "gol.dnevnik.hr",
    label: "Gol",
    lang: "hr",
  },
  {
    url: "https://news.google.com/rss/search?q=site:hns.team+(Vatreni+OR+reprezentacija+OR+izbornik)&hl=hr&gl=HR&ceid=HR:hr",
    prefer: "hns.team",
    label: "HNS",
    lang: "hr",
  },
  {
    url: "https://www.hrt.hr/rss/sport",
    prefer: "hrt.hr",
    label: "HRT",
    lang: "hr",
  },
  {
    url: "https://news.google.com/rss/search?q=%22Luka+Modri%C4%87%22+OR+Gvardiol+OR+Kova%C4%8Di%C4%87+OR+Vatreni+OR+HNL+when:5d&hl=de&gl=DE&ceid=DE:de",
    label: "Google DE",
    lang: "de",
  },
  {
    url: "https://news.google.com/rss/search?q=HNL+OR+Hajduk+OR+%22Dinamo+Zagreb%22+OR+Rijeka+when:5d&hl=de&gl=AT&ceid=AT:de",
    label: "HNL DE",
    lang: "de",
  },
  {
    url: "https://news.google.com/rss/search?q=%22Luka+Modric%22+OR+Gvardiol+OR+Kovacic+OR+Croatia+football+when:5d&hl=en-GB&gl=GB&ceid=GB:en",
    label: "Google EN",
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
];

const TRUSTED =
  /index\.hr|jutarnji\.hr|gol\.dnevnik\.hr|hrt\.hr|hns\.team|espn\.com|bbc\.|reuters\.|goal\.com|theguardian\.com|uefa\.com|fifa\.com|vecernji\.hr|24sata\.hr/i;

/** Domains/Titel die wir nie listen (Spam, Foren, reiner Clickbait) */
const BLACKLIST =
  /pinterest\.|facebook\.com\/groups|reddit\.com\/r\/|tiktok\.com|doubleclick|outbrain|taboola|blogspot\.|wordpress\.com\/tag|quiz|clickbait|transfermarkt\.[a-z]+\/.*seite/i;

const CACHE_TTL_MS = 20 * 60 * 1000;
type CacheEntry = { at: number; articles: NewsArticle[] };
const autoNewsGlobal = globalThis as unknown as {
  __kslAutoNewsCache?: CacheEntry;
};

const RELEVANCE =
  /croat|hrvat|modri|bili[cć]|vatren|hnl|hajduk|dinam|rijeka|osijek|vukovar|gvardiol|kova[cč]i[cć]|peri[sš]i[cć]|livakovi[cć]|budimir|pa[sš]ali[cć]|brozovi[cć]|vu[sš]kovi[cć]|baturina|su[cč]i[cć]|stan[ií][sš]i[cć]|nogomet|football|soccer|serie\s*a|premier|bundesliga|nations|liga\s*nacija|reprezent|izbornik|transfer|ugovor|world\s*cup|svjetsko|konferencijsk|liga\s*prvaka|champions|inter|milan/i;

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

function extractSourceFromTitle(title: string): {
  cleanTitle: string;
  source: string;
} {
  let t = cleanNewsText(title, 160);
  if (!t) return { cleanTitle: "", source: "" };
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
  if (/transfer|contract|ugovor|verläng|extends|produž|oprostit|retire|return/i.test(text))
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

  if (/transfermarkt.*gemeinsame|bilanz gegen|seite \d/i.test(title))
    score -= 80;
  return score;
}

function categorize(title: string, desc: string): NewsArticle["category"] {
  const t = `${title} ${desc}`;
  if (/transfer|ugovor|contract|verläng|extends|produž|sign|oprostit|retire|return talk/i.test(t))
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

/** Tag = nur Quelle (nicht nochmal Kategorie) */
function tagSource(source: string, lang: Locale): NewsLocaleText {
  const label = source || "Feed";
  const langMark =
    lang === "de" ? "DE" : lang === "en" ? "EN" : "HR";
  return {
    de: `${label} · ${langMark}`,
    en: `${label} · ${langMark}`,
    hr: `${label} · ${langMark}`,
  };
}

/**
 * Nur bereinigter Titel + lokalisierter Hinweis – kein RSS-HTML im Body.
 */
function buildLocalizedShell(
  cleanTitle: string,
  source: string,
  lang: Locale
): {
  title: NewsLocaleText;
  summary: NewsLocaleText;
  body: NewsLocaleText;
} {
  const src = source || "News-Feed";

  const summary: NewsLocaleText = {
    de:
      lang === "de"
        ? `${cleanTitle} – Kurzmeldung über ${src}. Volltext nur in der Originalquelle.`
        : `Original (${lang.toUpperCase()}): „${cleanTitle}“ · Quelle ${src}. Volltext nur im Originalartikel.`,
    en:
      lang === "en"
        ? `${cleanTitle} – brief via ${src}. Full story only on the original site.`
        : `Original (${lang.toUpperCase()}): “${cleanTitle}” · source ${src}. Full story only on the original site.`,
    hr:
      lang === "hr"
        ? `${cleanTitle} – kratka vijest preko ${src}. Puni tekst samo na izvoru.`
        : `Original (${lang.toUpperCase()}): „${cleanTitle}“ · izvor ${src}. Puni tekst samo na izvornom članku.`,
  };

  const body: NewsLocaleText = {
    de: [
      `Externe Headline von ${src} (Originalsprache: ${lang.toUpperCase()}).`,
      cleanTitle,
      "",
      "Wir hosten keine Volltexte Dritter und ersetzen keine Originalberichterstattung. Für Fakten, Rechte und Aktualität gilt allein die verlinkte Quelle.",
      "Auf Kroatien Sport Live: Live-Board für Termine, Tracker für Spieler, redaktioneller Tagesbrief für den Überblick.",
    ].join("\n\n"),
    en: [
      `External headline from ${src} (original language: ${lang.toUpperCase()}).`,
      cleanTitle,
      "",
      "We do not host third-party full articles. Facts, rights and updates are solely those of the linked source.",
      "On Croatia Sport Live: live board for fixtures, tracker for players, daily brief for overview.",
    ].join("\n\n"),
    hr: [
      `Vanjski naslov od ${src} (izvorni jezik: ${lang.toUpperCase()}).`,
      cleanTitle,
      "",
      "Ne hostamo tuđe full tekstove. Činjenice, prava i ažurnost isključivo su stvar povezanog izvora.",
      "Na Kroatien Sport Live: live board za termine, tracker za igrače, dnevni brief za pregled.",
    ].join("\n\n"),
  };

  // Title: same string in all locales (original headline) — UI marks language via tag
  const title: NewsLocaleText = {
    de: cleanTitle,
    en: cleanTitle,
    hr: cleanTitle,
  };

  return { title, summary, body };
}

type RawItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  score: number;
  sourceHint: string;
  lang: Locale;
};

function parseRssItems(
  xml: string,
  limit: number,
  feed: FeedDef
): RawItem[] {
  const items: RawItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of blocks) {
    if (items.length >= limit) break;
    const titleEnc =
      (block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? "";
    const titleClean = cleanNewsText(titleEnc, 160);
    if (!isUsableNewsTeaser(titleClean)) continue;

    let link =
      (block.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/i) ?? [])[1] ??
      (block.match(/<link>([\s\S]*?)<\/link>/i) ?? [])[1] ??
      (block.match(/<link[^>]+href=["']([^"']+)["']/i) ?? [])[1] ??
      "";
    if (!link || !link.startsWith("http")) {
      const guid =
        (block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i) ?? [])[1] ?? "";
      const g = cleanNewsText(guid, 500);
      // guid may be URL without cleaning well - extract http
      const urlMatch = (guid || "").match(/https?:\/\/[^\s<>"']+/i);
      if (urlMatch) link = urlMatch[0]!;
      else if (g.startsWith("http")) link = g;
    }
    link = (link || "").replace(/<[^>]+>/g, "").trim();
    // decode amp in urls
    link = link.replace(/&amp;/g, "&");

    const pubDate =
      (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ?? [])[1] ?? "";
    const description =
      (block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ??
        [])[1] ?? "";

    if (BLACKLIST.test(`${titleClean} ${link} ${description}`)) continue;
    if (!RELEVANCE.test(`${titleClean} ${description}`)) continue;

    const score = scoreItem(
      titleClean,
      cleanNewsText(description, 200),
      pubDate,
      link,
      feed.prefer
    );
    if (score < 8) continue;

    items.push({
      title: titleClean,
      link: link.startsWith("http") ? link : "",
      pubDate: pubDate.trim(),
      description,
      score,
      sourceHint: feed.label ?? "",
      lang: feed.lang,
    });
  }
  return items;
}

async function fetchFeed(feed: FeedDef, limit: number): Promise<RawItem[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(feed.url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KroatienSportLive/1.2; +https://kroatien-sport-live.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 1200 },
    });
    if (!res.ok) return [];
    return parseRssItems(await res.text(), limit, feed);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAutoNews(max = 24): Promise<NewsArticle[]> {
  const cached = autoNewsGlobal.__kslAutoNewsCache;
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.articles.slice(0, max);
  }

  const perFeed = 10;
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f, perFeed)));
  const flat = results.flat();

  const byKey = new Map<string, RawItem>();
  for (const item of flat) {
    if (BLACKLIST.test(`${item.title} ${item.link}`)) continue;
    const key = slugify(item.title).slice(0, 52);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || item.score > prev.score) byKey.set(key, item);
  }

  const ranked = Array.from(byKey.values()).sort((a, b) => b.score - a.score);
  const articles: NewsArticle[] = [];
  const seenIds = new Set<string>();

  for (const item of ranked) {
    if (articles.length >= 40) break;
    const { cleanTitle, source: fromTitle } = extractSourceFromTitle(
      item.title
    );
    if (!isUsableNewsTeaser(cleanTitle)) continue;

    const source = item.sourceHint || fromTitle || "Feed";
    const baseSlug = slugify(cleanTitle) || `auto-${articles.length}`;
    const id = `auto-${baseSlug}`.slice(0, 96);
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // Ohne Original-Link: kein Auto-Artikel (rechtlich + UX)
    if (!item.link.startsWith("http")) continue;
    if (BLACKLIST.test(item.link)) continue;

    const cat = categorize(cleanTitle, item.description);
    const texts = buildLocalizedShell(cleanTitle, source, item.lang);
    // Nur thematische Assets – keine Publisher-Fotos scrapen
    const themeUrl =
      themeImageForArticle(id, cleanTitle) ?? THEME_IMAGES.croatia;
    const ageDays =
      (Date.now() - new Date(item.pubDate).getTime()) / (24 * 3600_000);
    const featured = item.score >= 75 && ageDays <= 2;

    articles.push({
      id,
      date: parseDate(item.pubDate),
      category: cat,
      tag: tagSource(source, item.lang),
      ...texts,
      image: {
        url: themeUrl,
        alt: { de: "News", en: "News", hr: "Vijest" },
      },
      sourceUrl: item.link,
      sourceLang: item.lang,
      sourceName: source,
      isExternal: true,
      featured,
    });
  }

  autoNewsGlobal.__kslAutoNewsCache = { at: Date.now(), articles };
  return articles.slice(0, max);
}
