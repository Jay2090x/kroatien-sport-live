/**
 * News-Thumbnails: thematische Motive behalten, Unsplash nur als Filler.
 * Einzigartigkeit wo möglich – redaktionelle Person/Logo-Bilder nie ersetzen.
 */

/** Einzigartige Unsplash-IDs (nur Fallback) */
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
  "1552667466-07770ae110d0",
  "1546519638-68e109498ffc",
  "1517649763962-0c623066027b",
];

function photoUrl(id: string, salt = 0): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=240&h=240&q=80&sig=${salt}`;
}

export const NEWS_PHOTO_POOL: string[] = PHOTO_IDS.map((id, i) =>
  photoUrl(id, i)
);

export const FALLBACK_THUMB =
  "https://r2.thesportsdb.com/images/media/team/badge/vvtsyu1455465317.png";

export const PLAYER_CUTOUTS: Record<string, string> = {
  modric:
    "https://r2.thesportsdb.com/images/media/player/cutout/msewdx1758892756.png",
  gvardiol:
    "https://r2.thesportsdb.com/images/media/player/cutout/mmowa11769183247.png",
  vuskovic:
    "https://r2.thesportsdb.com/images/media/player/cutout/bw06uk1765729531.png",
  bilic:
    "https://r2.thesportsdb.com/images/media/player/thumb/3ik08u1562602501.jpg",
};

/** Thematische Assets für Auto-Feed / Live */
export const THEME_IMAGES = {
  bilic:
    "https://r2.thesportsdb.com/images/media/player/thumb/3ik08u1562602501.jpg",
  modric:
    "https://r2.thesportsdb.com/images/media/player/cutout/msewdx1758892756.png",
  croatia:
    "https://r2.thesportsdb.com/images/media/team/badge/vvtsyu1455465317.png",
  euro:
    "https://r2.thesportsdb.com/images/media/league/badge/bivzlu1635869135.png",
  nationsLeague:
    "https://r2.thesportsdb.com/images/media/league/badge/cwsp321698386224.png",
  worldCup:
    "https://r2.thesportsdb.com/images/media/league/badge/e7er5g1696521789.png",
  premierLeague:
    "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",
  serieA:
    "https://r2.thesportsdb.com/images/media/league/badge/67q3q21679951383.png",
  milan:
    "https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png",
  brighton:
    "https://r2.thesportsdb.com/images/media/team/badge/ywypts1448810904.png",
  hajduk:
    "https://r2.thesportsdb.com/images/media/team/badge/23mvtk1579955412.png",
} as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function imageKey(url: string): string {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/photo-([a-z0-9-]+)/i);
    if (m) return `photo-${m[1]}`;
    return u.origin + u.pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

/** Nur echte Stock-Filler – Logos/Personen nie als „generic“ markieren */
function isFillerImage(url: string): boolean {
  return /unsplash\.com/i.test(url);
}

/** Logo / Badge / Portrait → object-contain im UI */
export function isLogoOrPortrait(url: string): boolean {
  return /badge|logo|thumb|cutout|teamlogos|leaguelogos|countries/i.test(url);
}

/**
 * Thematisches Bild aus Titel/ID ableiten (für Auto-News & fehlende Bilder)
 */
export function themeImageForArticle(id: string, title = ""): string | null {
  const t = `${id} ${title}`.toLowerCase();
  if (/bili[cć]|bilic/.test(t)) return THEME_IMAGES.bilic;
  if (/modri[cć]|modric/.test(t)) return THEME_IMAGES.modric;
  if (/vu[sš]kovi[cć]|vuskovic|brighton/.test(t)) return THEME_IMAGES.brighton;
  if (/milan|serie\s*a/.test(t)) return THEME_IMAGES.milan;
  if (/hajduk|žilin|zilin/.test(t)) return THEME_IMAGES.hajduk;
  if (/nations?\s*league|liga\s*nacija|\bnl\b|osijek|češka|tschechien/.test(t))
    return THEME_IMAGES.nationsLeague;
  if (/euro\s*2028|em\s*2028|european\s*champ/.test(t)) return THEME_IMAGES.euro;
  if (/world\s*cup|wm\s*2026|svjetsk|portugal|fifa/.test(t))
    return THEME_IMAGES.worldCup;
  if (/premier|tottenham|transfer/.test(t)) return THEME_IMAGES.premierLeague;
  if (/vatren|hrvatsk|croatia|dali[cć]|nacional/.test(t))
    return THEME_IMAGES.croatia;
  return null;
}

export type Imageable = {
  id: string;
  playerId?: string;
  image?: { url: string; alt: { de: string; en: string; hr: string } };
  title?: { de?: string; en?: string; hr?: string } | string;
};

/**
 * Redaktionelle / thematische Bilder behalten.
 * Unsplash-Filler durch Thema oder unique Pool ersetzen.
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
    const url = photoUrl(
      PHOTO_IDS[preferIndex % PHOTO_IDS.length]!,
      9000 + poolCursor++
    );
    used.add(imageKey(url) + String(poolCursor));
    return url;
  };

  const titleOf = (a: T): string => {
    if (!a.title) return "";
    if (typeof a.title === "string") return a.title;
    return `${a.title.de ?? ""} ${a.title.en ?? ""}`;
  };

  return articles.map((article, index) => {
    const existing = article.image?.url;

    // 1) Redaktionell gesetztes Nicht-Unsplash-Bild → immer behalten
    if (existing && !isFillerImage(existing)) {
      used.add(imageKey(existing));
      return withImage(article, existing);
    }

    // 2) Player-Cutout
    if (article.playerId && PLAYER_CUTOUTS[article.playerId]) {
      const cut = PLAYER_CUTOUTS[article.playerId]!;
      used.add(imageKey(cut));
      return withImage(article, cut);
    }

    // 3) Thema aus ID/Titel
    const themed = themeImageForArticle(article.id, titleOf(article));
    if (themed) {
      used.add(imageKey(themed));
      return withImage(article, themed);
    }

    // 4) Unique Unsplash-Pool (nur Auto/Fallback)
    if (index < maxUnique) {
      return withImage(article, takePool(hashId(article.id) + index));
    }
    return withImage(
      article,
      existing && !isFillerImage(existing)
        ? existing
        : takePool(hashId(article.id))
    );
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

  s = s.replace(/\s+[-–|]\s+[A-Za-z0-9 .]{2,40}$/u, "").trim();

  if (s.length > maxLen) {
    s = s.slice(0, maxLen - 1).replace(/\s+\S*$/, "") + "…";
  }
  return s;
}
