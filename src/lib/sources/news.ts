import { cachedSource, REVALIDATE, type Sourced } from "../cache";
import { fetchText } from "../http";
import { HRT_SPORT_CATEGORIES, isCroatianHeadline, type Sport } from "../sport-meta";
import type { Lang } from "../i18n";
import { parseRss } from "./rss";

/**
 * Schlagzeilen (nur Titel + Quelle + Zeit + Link zum Original, Originalsprache).
 * Quellen: HRT-Sport-RSS (HR), Google-News-RSS-Suchen (DE + HR).
 * Nur Meldungen mit Bezug zu kroatischen Athleten/Teams.
 * Ranking: "interessant" (Derby, Transfer, Vatreni-Drama, UFC/Boxen, klare
 * Ergebnisse) vor Routine (Vorschau, TV-Hinweise, Pressekonferenz) – rein
 * stichwortbasiert, es wird kein Text erfunden.
 */
export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  lang: Lang;
  sport: Sport | "other";
  /** Interesse-Punkte aus Stichwörtern (ohne Aktualität) */
  interest: number;
  /** Kategorie-Etikett aus eindeutigem Stichwort, z. B. "derby" */
  tag?: NewsTag;
}

export type NewsTag = "derby" | "transfer" | "vatreni" | "ufc" | "boxing" | "injury" | "record";

const HRT_FEED = "https://feed.hrt.hr/sport/page.xml";
const g = (q: string, lang: "de" | "hr") =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&${
    lang === "de" ? "hl=de&gl=AT&ceid=AT:de" : "hl=hr&gl=HR&ceid=HR:hr"
  }`;

const GOOGLE_FEEDS: Array<{ url: string; lang: Lang; football: boolean }> = [
  { url: g("(Kroatien OR Vatreni OR Modrić OR Gvardiol OR Kovačić) Fußball when:2d", "de"), lang: "de", football: true },
  { url: g("(Soldić OR Hrgović OR Zubac OR Čilić OR Kroatien) (UFC OR Boxen OR NBA OR Tennis OR Handball) when:3d", "de"), lang: "de", football: false },
  { url: g("(HNL OR Vatreni OR Hajduk OR \"Dinamo Zagreb\" OR \"HNK Rijeka\" OR reprezentacija) nogomet when:2d", "hr"), lang: "hr", football: true },
  { url: g("(Soldić OR Hrgović OR Plantić OR Smakići OR UFC OR boks) when:3d", "hr"), lang: "hr", football: false },
];

const FOOTBALL =
  /nogomet|\bhnl\b|vatren|hajduk|dinamo|rijek|osijek|vara[zž]din|gorica|istra 1961|lokomotiv|slaven belupo|rude[sš]|vukovar|reprezentacij|modri[cć]|gvardiol|kova[cč]i[cć]|dali[cć]|bili[cć]|kroatien|fu(ss|ß)ball|nations league|liga nacija|liga prvaka|konferencijsk|poljud|maksimir|livakovi[cć]|kramari[cć]|peri[sš]i[cć]|budimir|baturina|su[cč]i[cć]|stani[sš]i[cć]|derbi|derby/i;
const CROATIAN =
  /hrvat|kroat|croat|vatren|modri[cć]|gvardiol|kova[cč]i[cć]|dali[cć]|bili[cć]|\bhnl\b|hajduk|dinamo|rijek|osijek|livakovi[cć]|kramari[cć]|peri[sš]i[cć]|budimir|baturina|su[cč]i[cć]|stani[sš]i[cć]|pa[sš]ali[cć]|soldi[cć]|hrgovi[cć]|planti[cć]|smaki[cćq]i/i;
const EXCLUDE =
  /futsal|\bu-?1[5-9]\b|\bu-?2[01]\b|junior|kadet|transfermarkt|fussballdaten|saison-stats|ligavergleich|spielerprofil|ora[sš]je|negotin|formula|horoskop|kladionic|quote[n]? |wett/i;

const SPORT_RX: Array<[Sport, RegExp]> = [
  ["mma", /\bufc\b|\bmma\b|soldi[cć]|oktagon|\bfnc\b/i],
  ["boxing", /\bboks|\bbox(en|er|kampf)|hrgovi[cć]|planti[cć]|smaki[cćq]i|\bbkfc\b/i],
  ["tennis", /tenis|tennis|[cč]ili[cć]|mekti[cć]|pavi[cć]|veki[cć]|dodig|gojo|prizmi[cć]/i],
  ["basketball", /ko[sš]ark|basketball|\bnba\b|\baba\b|zubac|hezonja|matkovi[cć]|cibona|cedevita/i],
  ["handball", /rukomet|handball|\behf\b|nexe|kauboj/i],
];

/** Interesse-Stichwörter (ohne Diakritika, Kleinbuchstaben) */
const INTEREST: Array<{ rx: RegExp; pts: number; tag?: NewsTag }> = [
  { rx: /derbi|derby|vjecni|hajduk.{0,40}dinam|dinam.{0,40}hajduk/, pts: 5, tag: "derby" },
  { rx: /transfer|prelaz|potpis|ugovor|wechsel|vertrag|produzi|odlazi u|stize u|zeli .{0,20}(napadac|igrac)/, pts: 3, tag: "transfer" },
  { rx: /\bufc\b|soldic/, pts: 3, tag: "ufc" },
  { rx: /hrgovic|plantic|smakic|\bboks|\bboxen|\bbkfc\b/, pts: 3, tag: "boxing" },
  { rx: /vatren|reprezentacij|nationalteam|nationalmannschaft|dalic|bilic|\bnations league\b|liga nacija/, pts: 2, tag: "vatreni" },
  // Verletzung ohne Etikett: aus dem Titel ist oft nicht klar, wen es betrifft
  { rx: /ozljed|verletz|operacij|out za|pauzira/, pts: 1 },
  { rx: /rekord|povijes|histor|prvi put|erstmals|sensation|senzacij|\bsok\b|schock|spektak|preokret|nokaut|knockout|\bko\b|titul|prvak svijeta|weltmeister|\bfinale\b|\bfinalu\b/, pts: 2, tag: "record" },
  { rx: /pobjed|poraz|remi|sieg|niederlage|pleite|\d+\s*:\s*\d+|\d+-\d+/, pts: 1 },
  { rx: /modric|gvardiol|kovacic|zubac|cilic|soldic|hrgovic|livakovic|kramaric|perisic|budimir|baturina/, pts: 1 },
];
/** Routine-Meldungen, die nach hinten rutschen */
const ROUTINE =
  /najav|uoci |uoči|konferencij|pressekonferenz|gdje gledati|u kojem programu|prijenos|tv-uebertragung|tv-übertragung|live-ticker|liveticker|im liveticker|im live|raspored|spielplan|aufstellung|kader -|- kader|sastav(i)? za|vremenska prognoza|ulaznic|tickets|kladionic/;

function fold(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

export function scoreHeadline(title: string): { interest: number; tag?: NewsTag } {
  const t = fold(title);
  let interest = 0;
  let tag: NewsTag | undefined;
  for (const r of INTEREST) {
    if (r.rx.test(t)) {
      interest += r.pts;
      if (!tag && r.tag) tag = r.tag;
    }
  }
  if (ROUTINE.test(t)) interest -= 3;
  return { interest, tag };
}

/** Englische Titel aussortieren (Anzeige nur DE/HR): mindestens 2 typisch englische Wörter. */
const EN_WORDS = /\b(the|and|of|his|her|with|for|following|after|from|will|is|at|to|open|talks|next|fight|wins?|says)\b/gi;
export function looksEnglish(title: string): boolean {
  return (title.match(EN_WORDS) ?? []).length >= 2 && !/[čćžšđäöüß]/i.test(title);
}

function sportOf(title: string, fallback: Sport | "other"): Sport | "other" {
  for (const [s, rx] of SPORT_RX) if (rx.test(title)) return s;
  return fallback;
}

function norm(s: string): string {
  return fold(s).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
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

function make(title: string, url: string, source: string, iso: string, lang: Lang, sport: Sport | "other"): NewsItem {
  return { title, url, source, publishedAt: iso, lang, sport, ...scoreHeadline(title) };
}

async function loadHrt(): Promise<NewsItem[]> {
  const items = parseRss(await fetchText(HRT_FEED));
  if (items.length === 0) throw new Error("HRT: empty feed");
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
    let sport: Sport | "other" | null = null;
    if (path === "hrvatski-nogomet") sport = "football";
    else if (path === "medunarodni-nogomet") sport = CROATIAN.test(it.title) ? "football" : null;
    else if (HRT_SPORT_CATEGORIES[path]) {
      // andere Sportarten: nur mit kroatischem Bezug (Stichwortliste)
      if (isCroatianHeadline(it.title)) sport = sportOf(it.title, HRT_SPORT_CATEGORIES[path]);
      else if (FOOTBALL.test(it.title) && CROATIAN.test(it.title)) sport = "football";
    }
    if (!sport) continue;
    out.push(make(it.title, it.link, "HRT Sport", iso, "hr", sport));
  }
  return out;
}

async function loadGoogle(feed: (typeof GOOGLE_FEEDS)[number]): Promise<NewsItem[]> {
  const items = parseRss(await fetchText(feed.url));
  const out: NewsItem[] = [];
  for (const it of items) {
    const iso = toIso(it.pubDate);
    if (!iso) continue;
    const source = it.source?.trim() || "Google News";
    // Google hängt " - Quelle" an den Titel an
    let title = it.title;
    if (it.source && title.endsWith(` - ${it.source}`)) title = title.slice(0, -(it.source.length + 3)).trim();
    if (EXCLUDE.test(title) || EXCLUDE.test(source) || looksEnglish(title)) continue;
    if (!CROATIAN.test(title) && !isCroatianHeadline(title)) continue;
    let sport: Sport | "other";
    if (feed.football) {
      if (!FOOTBALL.test(title)) continue;
      sport = "football";
    } else {
      sport = sportOf(title, "other");
      if (sport === "other") continue;
    }
    out.push(make(title, it.link, source, iso, feed.lang, sport));
  }
  return out;
}

/** Duplikate entfernen (gleiche URL oder sehr ähnlicher Titel; HRT bevorzugt). */
export function dedupeNews(all: NewsItem[]): NewsItem[] {
  const sorted = [...all].sort((a, b) =>
    a.source === "HRT Sport" && b.source !== "HRT Sport"
      ? -1
      : b.source === "HRT Sport" && a.source !== "HRT Sport"
        ? 1
        : Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
  );
  const kept: Array<{ item: NewsItem; tok: Set<string> }> = [];
  for (const item of sorted) {
    const tok = tokens(item.title);
    if (tok.size === 0 || kept.some((k) => k.item.url === item.url || similar(k.tok, tok))) continue;
    kept.push({ item, tok });
  }
  return kept.map((k) => k.item);
}

const H = 3600_000;

/** Aktualitätsbonus: < 6 h +3, < 12 h +2, < 24 h +1 */
function recency(n: NewsItem, now: number): number {
  const age = now - Date.parse(n.publishedAt);
  return age < 6 * H ? 3 : age < 12 * H ? 2 : age < 24 * H ? 1 : 0;
}

/**
 * Auswahl für die Anzeige:
 *  - frisch = höchstens 36 h alt; reicht das nicht für `min` Einträge, werden die
 *    jüngsten älteren (bis 7 Tage) ergänzt.
 *  - Sprache: zuerst Meldungen in der UI-Sprache, dann die andere (DE/HR).
 *  - Reihenfolge: Interesse + Aktualität, bei Gleichstand neuere zuerst.
 */
export function pickNews(
  pool: NewsItem[],
  { lang, now = Date.now(), max = 8, min = 6, perSport }: { lang: Lang; now?: number; max?: number; min?: number; perSport?: number }
): NewsItem[] {
  const valid = pool.filter((n) => {
    const t = Date.parse(n.publishedAt);
    return t <= now + H && now - t <= 7 * 24 * H;
  });
  const fresh = valid.filter((n) => now - Date.parse(n.publishedAt) <= 36 * H);
  const rank = (a: NewsItem, b: NewsItem) =>
    b.interest + recency(b, now) - (a.interest + recency(a, now)) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  const own = fresh.filter((n) => n.lang === lang).sort(rank);
  const other = fresh.filter((n) => n.lang !== lang).sort(rank);
  let chosen = [...own, ...other].slice(0, max);
  if (perSport) {
    // pro Sportart höchstens `perSport`, damit der Filter überall etwas findet
    const count = new Map<string, number>();
    chosen = [...own, ...other].filter((n) => {
      const c = count.get(n.sport) ?? 0;
      count.set(n.sport, c + 1);
      return c < perSport;
    });
  }
  if (chosen.length < min) {
    const older = valid
      .filter((n) => !chosen.includes(n))
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    chosen = [...chosen, ...older.slice(0, min - chosen.length)];
  }
  return chosen.sort(rank);
}

async function loadNews(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled([loadHrt(), ...GOOGLE_FEEDS.map(loadGoogle)]);
  const ok = settled.filter((s): s is PromiseFulfilledResult<NewsItem[]> => s.status === "fulfilled");
  if (ok.length === 0) throw new Error("news: all feeds failed");
  const items = dedupeNews(ok.flatMap((s) => s.value));
  if (items.length === 0) throw new Error("news: no relevant items");
  return items;
}

/** Gesamter Pool (alle Sportarten, beide Sprachen), 5 min gecacht. */
export function getNews(): Promise<Sourced<NewsItem[]> | null> {
  return cachedSource(["news-v5"], REVALIDATE.news, loadNews);
}
