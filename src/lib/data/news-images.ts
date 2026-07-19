/**
 * News-Thumbnails: 50+ unique Unsplash-Motive + Spieler-Cutouts.
 * Kein doppeltes Motiv in den letzten 50 Artikeln.
 */

/** Einzigartige Foto-IDs (keine Duplikate im Pool) */
const PHOTO_IDS = [
  "1574629810360-7efbbe195018",
  "1508098682722-e99c43a406b2",
  "1522778119026-d647f0596c20",
  "1431324155629-1a6deb1dec8d",
  "1575361204480-aadea25e6e68",
  "1489944440615-453fc2b6a9a9",
  "1517927033932-b3d18e61fb3a",
  "1551958219-acbc608c6377",
  "1461896836934-ffff6530f9f9",
  "1459865264687-595d652de67e",
  "1543326727-cf6c39e8f84c",
  "1529900748604-07564a03e7a6",
  "1579952363873-27f3bade9f55",
  "1518604666860-9edfe7f89966",
  "1606925797300-0b35e9d1794e",
  "1624526267942-ab0ff8a3e972",
  "1614632537197-38a17061c2bd",
  "1560272564-c83b66b1ad12",
  "1553778263-73a83bab9b0c",
  "1521412644187-c49fa049e84d",
  "1471295253337-3ceaaedca402",
  "1486286701208-1d58e9338013",
  "1577223625816-7546f13df25d",
  "1517466787929-bc90951d0974",
  "1570498839593-e565b39455fc",
  "1624880357913-a8539238245b",
  "1493230270586-7804661f2121",
  "1431324155629-1a6deb1dec8d",
  "1552667466-07770ae110d0",
  "1546519638-68e109498ffc",
  "1574629810360-7efbbe195018",
  "1508098682722-e99c43a406b2",
  "1517649763962-0c623066027b",
  "1461896836934-ffff6530f9f9",
  "1529900748604-07564a03e7a6",
  "1606925797300-0b35e9d1794e",
  "1624526267942-ab0ff8a3e972",
  "1614632537197-38a17061c2bd",
  "1560272564-c83b66b1ad12",
  "1553778263-73a83bab9b0c",
  "1521412644187-c49fa049e84d",
  "1471295253337-3ceaaedca402",
  "1486286701208-1d58e9338013",
  "1577223625816-7546f13df25d",
  "1517466787929-bc90951d0974",
  "1570498839593-e565b39455fc",
  "1624880357913-a8539238245b",
  "1493230270586-7804661f2121",
  "1552667466-07770ae110d0",
  "1546519638-68e109498ffc",
  "1517649763962-0c623066027b",
  "1575361204480-aadea25e6e68",
];

function photoUrl(id: string, salt = 0): string {
  // square crop, reliable for thumbs
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=240&h=240&q=80&sig=${salt}`;
}

/** Deduplizierter Pool mit sig-Varianten für echte Uniqueness */
export const NEWS_PHOTO_POOL: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  PHOTO_IDS.forEach((id, i) => {
    if (seen.has(id)) {
      out.push(photoUrl(id, i + 100));
    } else {
      seen.add(id);
      out.push(photoUrl(id, i));
    }
  });
  return out;
})();

export const FALLBACK_THUMB = photoUrl("1574629810360-7efbbe195018", 0);

export const PLAYER_CUTOUTS: Record<string, string> = {
  modric:
    "https://r2.thesportsdb.com/images/media/player/cutout/msewdx1758892756.png",
  gvardiol:
    "https://r2.thesportsdb.com/images/media/player/cutout/mmowa11769183247.png",
  vuskovic:
    "https://r2.thesportsdb.com/images/media/player/cutout/bw06uk1765729531.png",
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Normalisiert URL für Duplikat-Check (ohne Query-Noise wo möglich) */
function imageKey(url: string): string {
  try {
    const u = new URL(url);
    // photo-ID oder path
    const m = u.pathname.match(/photo-([a-z0-9-]+)/i);
    if (m) return `photo-${m[1]}`;
    if (/cutout/i.test(url)) return u.pathname;
    return u.origin + u.pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function isGenericCrest(url: string): boolean {
  return /teamlogos\/countries|cro\.png$|\/badge\//i.test(url);
}

export type Imageable = {
  id: string;
  playerId?: string;
  image?: { url: string; alt: { de: string; en: string; hr: string } };
};

/**
 * Eindeutige Vorschaubilder für die letzten maxUnique Artikel.
 * Behält redaktionelle Cutouts/Stadien, ersetzt nur generische Crests.
 */
export function assignUniqueNewsImages<T extends Imageable>(
  articles: T[],
  maxUnique = 50
): T[] {
  const used = new Set<string>();
  const pool = NEWS_PHOTO_POOL;
  let poolCursor = 0;

  const takePool = (preferIndex: number): string => {
    for (let k = 0; k < pool.length; k++) {
      const url = pool[(preferIndex + k) % pool.length]!;
      const key = imageKey(url);
      if (!used.has(key)) {
        used.add(key);
        return url;
      }
    }
    // absolut letzter Fallback – index-basiert unique sig
    const url = photoUrl(
      PHOTO_IDS[preferIndex % PHOTO_IDS.length]!,
      9000 + poolCursor++
    );
    used.add(imageKey(url) + String(poolCursor));
    return url;
  };

  return articles.map((article, index) => {
    if (index >= maxUnique) {
      const url =
        article.image?.url && !isGenericCrest(article.image.url)
          ? article.image.url
          : takePool(hashId(article.id));
      return withImage(article, url);
    }

    // 1) Bekannter Spieler-Cutout
    if (article.playerId && PLAYER_CUTOUTS[article.playerId]) {
      const cut = PLAYER_CUTOUTS[article.playerId]!;
      const key = imageKey(cut);
      if (!used.has(key)) {
        used.add(key);
        return withImage(article, cut);
      }
    }

    // 2) Bestehendes gutes Bild (Cutout oder Unsplash, kein Crest)
    const existing = article.image?.url;
    if (existing && !isGenericCrest(existing)) {
      const key = imageKey(existing);
      if (!used.has(key)) {
        used.add(key);
        return withImage(article, existing);
      }
    }

    // 3) Pool
    return withImage(article, takePool(hashId(article.id) + index));
  });
}

function withImage<T extends Imageable>(article: T, url: string): T {
  return {
    ...article,
    image: {
      url,
      alt: article.image?.alt ?? {
        de: "News-Vorschaubild",
        en: "News thumbnail",
        hr: "Naslovna slika",
      },
    },
  };
}

/** Sauberer Fließtext: kein HTML, keine Monster-URLs */
export function cleanNewsText(raw: string, maxLen = 420): string {
  let s = raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/www\.\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Google-News-Titel: "Headline - Source" → Source am Ende entfernen wenn kurz
  s = s.replace(/\s+[-–|]\s+[A-Za-z0-9 .]{2,40}$/u, "").trim();

  if (s.length > maxLen) {
    s = s.slice(0, maxLen - 1).replace(/\s+\S*$/, "") + "…";
  }
  return s;
}
