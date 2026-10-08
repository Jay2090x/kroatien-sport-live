export interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  source: string | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return null;
  const raw = m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1");
  return decodeEntities(raw.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/** Minimaler RSS-2.0-Parser (nur Titel, Link, Datum, Quelle). */
export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = m[1];
    const title = tag(block, "title");
    const link = tag(block, "link");
    if (!title || !link) continue;
    items.push({ title, link, pubDate: tag(block, "pubDate"), source: tag(block, "source") });
  }
  return items;
}
