/**
 * Automatische Headlines aus Google News RSS – ergänzend, nicht dominant.
 * Lange Texte/URLs werden bereinigt; volle Stories bleiben redaktionell.
 */

import type { NewsArticle, NewsLocaleText } from "@/lib/data/news";
import {
  cleanNewsText,
  themeImageForArticle,
  THEME_IMAGES,
} from "@/lib/data/news-images";

const FEEDS = [
  "https://news.google.com/rss/search?q=Hrvatska+nogomet+OR+%22Slaven+Bili%C4%87%22+OR+%22Luka+Modri%C4%87%22+OR+Vatreni&hl=de&gl=AT&ceid=AT:de",
  "https://news.google.com/rss/search?q=Croatia+football+OR+%22Slaven+Bilic%22+OR+%22Luka+Modric%22+national+team&hl=en-GB&gl=GB&ceid=GB:en",
];

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

/** Headline + lesbarer Teaser, ohne Publisher-Müll im Body */
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
  // "Title - Source" split
  const parts = title.split(/\s+[-–|]\s+/);
  let source = sourceHint;
  if (parts.length >= 2) {
    const maybeSource = parts[parts.length - 1]!;
    if (maybeSource.length < 40) {
      source = maybeSource;
      title = parts.slice(0, -1).join(" – ");
    }
  }

  let summary = cleanNewsText(descRaw, 260);
  if (!summary || summary.length < 40 || summary === title) {
    summary =
      source
        ? `${title} – Meldung von ${source}. Mehr im Originalartikel.`
        : `${title} – aktuelle Meldung aus dem internationalen News-Feed.`;
  }

  const bodyDe = [
    summary,
    "",
    source
      ? `Diese Kurz-Meldung basiert auf einem öffentlichen News-Feed (${source}). Für den vollständigen Hintergrund bitte die Originalquelle öffnen.`
      : "Diese Kurz-Meldung basiert auf einem öffentlichen News-Feed. Für den vollständigen Hintergrund bitte die Originalquelle öffnen.",
    "",
    "Ausführliche, redaktionell recherchierte Stories zu Bilić, Modrić und den Vatreni findest du weiter oben im News-Bereich.",
  ].join("\n\n");

  const bodyEn = [
    summary,
    "",
    source
      ? `This short item is based on a public news feed (${source}). Open the original source for the full story.`
      : "This short item is based on a public news feed. Open the original source for the full story.",
    "",
    "Longer researched stories on Bilić, Modrić and Croatia are listed above in the news section.",
  ].join("\n\n");

  const bodyHr = [
    summary,
    "",
    source
      ? `Ova kratka vijest dolazi iz javnog news feeda (${source}). Za punu priču otvori izvorni članak.`
      : "Ova kratka vijest dolazi iz javnog news feeda. Za punu priču otvori izvorni članak.",
    "",
    "Duži, redakcijski tekstovi o Biliću, Modriću i Vatrenima nalaze se gore u rubrici vijesti.",
  ].join("\n\n");

  return {
    title: { de: title, en: title, hr: title },
    summary: { de: summary, en: summary, hr: summary },
    body: { de: bodyDe, en: bodyEn, hr: bodyHr },
  };
}

function parseRssItems(xml: string, limit: number): Array<{
  title: string;
  link: string;
  pubDate: string;
  description: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    pubDate: string;
    description: string;
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
    if (
      !/croat|hrvat|modri|bili[cć]|vatren|hnl|hajduk|dinam|football|nogomet|soccer|premier|bundesliga|brighton|tottenham|transfer|dali[cć]/i.test(
        `${title} ${description}`
      )
    ) {
      continue;
    }
    items.push({
      title: titleRaw,
      link: link.startsWith("http") ? link : "",
      pubDate: pubDate.trim(),
      description,
    });
  }
  return items;
}

async function fetchFeed(
  url: string,
  limit: number
): Promise<ReturnType<typeof parseRssItems>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "KroatienSportLive/1.0 (news aggregator; +https://kroatien-sport-live.vercel.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return parseRssItems(await res.text(), limit);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAutoNews(max = 4): Promise<NewsArticle[]> {
  const perFeed = Math.ceil(max / FEEDS.length) + 2;
  const results = await Promise.all(FEEDS.map((f) => fetchFeed(f, perFeed)));
  const seen = new Set<string>();
  const articles: NewsArticle[] = [];

  for (const batch of results) {
    for (const item of batch) {
      const baseSlug =
        slugify(cleanNewsText(item.title, 80)) || `auto-${articles.length}`;
      const id = `auto-${baseSlug}`.slice(0, 96);
      if (seen.has(id)) continue;
      seen.add(id);

      const texts = buildTexts(item.title, item.description, "");
      const themeUrl =
        themeImageForArticle(id, item.title) ?? THEME_IMAGES.croatia;
      articles.push({
        id,
        date: parseDate(item.pubDate),
        category: "vatreni",
        tag: { de: "Kurz", en: "Brief", hr: "Kratko" },
        ...texts,
        image: {
          url: themeUrl,
          alt: {
            de: "News",
            en: "News",
            hr: "Vijest",
          },
        },
        sourceUrl: item.link || undefined,
        featured: false,
      });
      if (articles.length >= max) break;
    }
    if (articles.length >= max) break;
  }

  return articles;
}
