import { cachedSource, type Sourced } from "../cache";
import { fetchText } from "../http";
import type { Lang } from "../i18n";
import { parseRss } from "./rss";
import { detectLang } from "../lang-detect";
import { looksEnglish } from "./news";

/**
 * "Kroatien innovativ": Schlagzeilen über kroatische Erfindungen, Forschung, Firmen,
 * Startups, Großaufträge, Investitionen und Preise – ohne Sport, Politik, Kriminalität.
 * Quelle: Google-News-RSS (nur Titel + Quelle + Zeit + Link zum Original). Nichts erfunden.
 */
export interface InnoItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  lang: Lang;
  /** erkannte Firma (gefaltet), für die Obergrenze pro Firma */
  company?: string;
}

const g = (q: string, lang: Lang) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&${
    lang === "de" ? "hl=de&gl=AT&ceid=AT:de" : "hl=hr&gl=HR&ceid=HR:hr"
  }`;

/**
 * HR: Google News liefert für kroatische Suchen kaum Treffer – daher zusätzlich direkte RSS-Feeds
 * kroatischer Medien: Netokracija (Tech/Startups, `tech: true` = ganzer Feed ist Themen-passend)
 * und Poslovni dnevnik (Wirtschaft, nur mit Relevanzfilter).
 */
const FEEDS: Array<{ url: string; lang: Lang; name?: string; tech?: boolean }> = [
  { url: "https://www.netokracija.com/feed", lang: "hr", name: "Netokracija", tech: true },
  { url: "https://www.netokracija.com/feed?paged=2", lang: "hr", name: "Netokracija", tech: true },
  { url: "https://www.netokracija.com/feed?paged=3", lang: "hr", name: "Netokracija", tech: true },
  { url: "https://www.poslovni.hr/feed", lang: "hr", name: "Poslovni dnevnik" },
  { url: "https://www.poslovni.hr/hrvatska/feed", lang: "hr", name: "Poslovni dnevnik" },
  { url: "https://www.index.hr/rss/vijesti", lang: "hr", name: "Index.hr" },
  { url: "https://www.index.hr/rss/vijesti-znanost", lang: "hr", name: "Index.hr" },
  { url: "https://www.tportal.hr/rss-tehno.xml", lang: "hr", name: "tportal" },
  { url: "https://www.bug.hr/rss", lang: "hr", name: "Bug.hr" },
  { url: "https://www.vecernji.hr/feeds/latest", lang: "hr", name: "Večernji list" },
  { url: g('(Rimac OR "Bugatti Rimac" OR Infobip OR Photomath OR Nanobit OR Microblink OR "Verne Robotaxi") when:21d', "de"), lang: "de" },
  { url: g("Kroatien (Startup OR Erfindung OR Forscher OR Forschung OR KI OR Technologie OR Innovation OR Investition OR Großauftrag OR Auftrag) when:21d", "de"), lang: "de" },
  { url: g("kroatische (Firma OR Unternehmen OR Start-up OR Forscher OR Erfindung) when:30d", "de"), lang: "de" },
  { url: g("(Rimac OR Verne OR Infobip OR Photomath OR Nanobit OR Microblink OR Gideon OR Span OR Orqa) when:14d", "hr"), lang: "hr" },
  { url: g("(hrvatski OR hrvatska OR hrvatske) (startup OR izum OR inovacija OR znanstvenici OR \"umjetna inteligencija\" OR robotaksi) when:14d", "hr"), lang: "hr" },
  { url: g("(hrvatska tvrtka OR hrvatske tvrtke) (ugovor OR investicija OR posao OR nagrada OR izvoz) when:14d", "hr"), lang: "hr" },
];

/** Firmen – mit Zusatzbedingung gegen Fehltreffer (z. B. Jules Verne, Span = Spanne) */
const COMPANIES: Array<[string, RegExp]> = [
  ["rimac", /rimac/],
  ["verne", /\bverne\b(?=.*(robo|taksi|taxi|rimac|zagreb|autonom|vozil))|(robo|taksi|taxi|rimac|zagreb|autonom).*\bverne\b/],
  ["infobip", /infobip/],
  ["photomath", /photomath/],
  ["nanobit", /nanobit/],
  ["microblink", /microblink/],
  ["gideon", /\bgideon\b(?=.*(robot|autonom|brothers|osijek))|(robot|autonom|osijek).*\bgideon\b/],
  ["span", /\bspan\b(?=.*(tvrtk|kibern|cyber|ugovor|dionic|burz))|(tvrtk|kibern|cyber|ugovor|dionic|burz).*\bspan\b/],
  ["orqa", /\borqa\b/],
];
const CROATIAN = /hrvat|kroat|croat|zagreb|split|rijek|osijek|zadar|varazdin/;
const TOPIC =
  /startup|start-up|erfind|erfinder|forsch|wissenschaft|ki\b|kunstliche intelligenz|\bai\b|technolog|innovat|investi|auftrag|milliard|million|patent|preis fur|auszeichn|weltweit erst|rekord|robot|elektro|exportschlager|izum|inovac|znanstven|istrazivac|umjetn[ae] inteligencij|tehnolog|ugovor|posao vrijedan|milijun|milijard|nagrad|priznanj|prvi u svijetu|svjetsk|rekord|robota|patent|tvrtk|izvoz|razvil|razvio|razvila|lansira|predstavi/;
/** Politik, Kriminalität, Unfälle, Steuer-/Ratgeber, Sport, Wetter, Klatsch */
const EXCLUDE =
  /wahl|partei|minister|regierung|parlament|sabor|vlad[aei]|izbor|stranka|hdz|sdp|mozemo|plenkovi|milanovi|polizei|festgenommen|verhaft|mord|unfall|tot\b|tote|policij|uhicen|ubojstv|nesrec|poginu|sudar|ozlijed|optuz|sud\b|presud|steuer|finanzamt|ratgeber|porez|savjet|nogomet|fussball|kosark|basketball|tenis|tennis|rukomet|handball|\bufc\b|\bboks|\bnba\b|hnl\b|vatren|dinamo|hajduk|wetter|vrijeme sutra|horoskop|urlaub|reise|tourismus|turist|recept|rezept|celebrity|pjevac|sanger|film|kino|rat\b|krieg|ukrain|izrael|gaza|gaste|adria|militar|waffe|rustet|raketen|panzer|vojsk|oruzj|naoruz|\btipp\b|prognose|quoten|wettbasis|sportwett|nations league|liga nacija|kladi|pentagon|drohn|dron|obran|defen|verteidig|rustung|nato\b|molil|crkv|hodocas|farma|ekolos|limit|pravila za|cijen[ae] goriv/;
/** Netokracija: nur Firmen-/Startup-/Investitions-/Preis-Meldungen, keine Ratgeber */
const STARTUP = /startup|jednorog|investic|akvizi|preuzim|fond|nagrad|osnivac|runda|financiran|milijun|milijard|izum|razvi/;
const SPAM = /\p{Script=Cyrillic}|uzivo|live ?stream/iu;

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
const H = 3600_000;

export function companyOf(title: string): string | undefined {
  const t = fold(title);
  return COMPANIES.find(([, rx]) => rx.test(t))?.[0];
}

/** Relevanz: Firma ODER (kroatischer Bezug UND Innovations-Thema); nichts aus EXCLUDE. */
export function relevant(title: string): boolean {
  const t = fold(title);
  if (EXCLUDE.test(t) || SPAM.test(title)) return false;
  if (companyOf(title)) return true;
  return CROATIAN.test(t) && TOPIC.test(t);
}

async function loadFeed(f: (typeof FEEDS)[number]): Promise<InnoItem[]> {
  const out: InnoItem[] = [];
  for (const it of parseRss(await fetchText(f.url))) {
    const t = it.pubDate ? Date.parse(it.pubDate) : NaN;
    if (Number.isNaN(t)) continue;
    const source = f.name ?? (it.source?.trim() || "Google News");
    let title = it.title;
    if (it.source && title.endsWith(` - ${it.source}`)) title = title.slice(0, -(it.source.length + 3)).trim();
    const ok = f.tech
      ? !EXCLUDE.test(fold(title)) && !SPAM.test(title) && (relevant(title) || (STARTUP.test(fold(title)) && CROATIAN.test(fold(title))))
      : relevant(title);
    if (!ok || looksEnglish(title) || title.length < 25) continue;
    const det = detectLang(title);
    // strikt: nur Titel in der Sprache des Feeds
    if (det !== f.lang && !(det === null && !looksEnglish(title))) continue;
    out.push({ title, url: it.link, source, publishedAt: new Date(t).toISOString(), lang: f.lang, company: companyOf(title) });
  }
  return out;
}

function tokens(s: string): Set<string> {
  return new Set(fold(s).replace(/[^a-z0-9 ]+/g, " ").split(" ").filter((x) => x.length > 3));
}
/** markante Namen (≥ 6 Zeichen, großgeschrieben) als 5-Zeichen-Stamm – "Daytona"/"Daytonu" → "dayto" */
const GENERIC_STEMS = new Set("hrvat kroat croat zagre europ split rijek osije svjet milij milli dolar umjet kunst googl apple micro amazo".split(" "));
function stems(title: string): Set<string> {
  const out = new Set<string>();
  for (const w of title.match(/\p{Lu}[\p{L}\d]{5,}/gu) ?? []) {
    const st = fold(w).slice(0, 5);
    if (!GENERIC_STEMS.has(st)) out.add(st);
  }
  return out;
}
function similar(a: Set<string>, b: Set<string>): boolean {
  let i = 0;
  for (const x of a) if (b.has(x)) i++;
  return i / Math.max(1, Math.min(a.size, b.size)) >= 0.5;
}

/** Auswahl: Seitensprache, frisch (≤ 7 Tage) zuerst, sonst bis 30 Tage; gleiche Geschichte einmal; max. 2 je Firma. */
export function pickInnovation(pool: InnoItem[], { lang, now = Date.now(), max = 12, perCompany = 2 }: { lang: Lang; now?: number; max?: number; perCompany?: number }): InnoItem[] {
  const own = pool
    .filter((n) => n.lang === lang)
    .filter((n) => {
      const age = now - Date.parse(n.publishedAt);
      return age >= -H && age <= 30 * 24 * H;
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const kept: Array<{ n: InnoItem; tok: Set<string>; st: Set<string>; t: number }> = [];
  const per = new Map<string, number>();
  for (const n of own) {
    const tok = tokens(n.title);
    const st = stems(n.title);
    const t = Date.parse(n.publishedAt);
    // gleiche Geschichte: gleiche URL, ähnlicher Titel oder gemeinsamer markanter Name binnen 7 Tagen
    const same = (k: (typeof kept)[number]) =>
      k.n.url === n.url || similar(k.tok, tok) || (Math.abs(k.t - t) <= 7 * 24 * H && [...st].some((x) => k.st.has(x)) && (n.company ?? "") === (k.n.company ?? ""));
    if (kept.some(same)) continue;
    if (n.company && (per.get(n.company) ?? 0) >= perCompany) continue;
    if (n.company) per.set(n.company, (per.get(n.company) ?? 0) + 1);
    kept.push({ n, tok, st, t });
  }
  const list = kept.map((k) => k.n);
  const fresh = list.filter((n) => now - Date.parse(n.publishedAt) <= 7 * 24 * H);
  const older = list.filter((n) => !fresh.includes(n));
  return [...fresh, ...older].slice(0, max);
}

async function loadInnovation(): Promise<InnoItem[]> {
  const settled = await Promise.allSettled(FEEDS.map(loadFeed));
  const ok = settled.filter((s): s is PromiseFulfilledResult<InnoItem[]> => s.status === "fulfilled");
  if (ok.length === 0) throw new Error("innovation: all feeds failed");
  const all = ok.flatMap((s) => s.value);
  if (all.length === 0) throw new Error("innovation: no items");
  return all;
}

export function getInnovation(): Promise<Sourced<InnoItem[]> | null> {
  return cachedSource(["innovation-v7"], 1800, loadInnovation);
}

/* ---------- Videos offizieller Firmenkanäle ---------- */
export interface InnoVideo {
  id: string;
  title: string;
  channel: string;
  publishedAt: string;
}
/** Kanal-IDs geprüft am 25.10.2026 über die Kanalseiten / Kanal-RSS */
const CHANNELS = [
  { id: "UCazaXum4NCxzEGyBZ-HNlQg", name: "Rimac Automobili" },
  { id: "UCcDTMDbmIjwM54wtDUheGpA", name: "Verne" },
  { id: "UCUPSTy53VecI5GIir3J3ZbQ", name: "Infobip" },
];
const dec = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function embeddable(id: string): Promise<boolean> {
  try {
    await fetchText(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { retries: 0 });
    return true;
  } catch {
    return false;
  }
}

async function loadChannel(ch: (typeof CHANNELS)[number]): Promise<InnoVideo[]> {
  const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`);
  const out: InnoVideo[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const title = dec(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const pub = e.match(/<published>([^<]+)<\/published>/)?.[1];
    // Shorts/Trailer ohne Inhalt überspringen
    if (!id || !title || !pub || /#shorts/i.test(title)) continue;
    out.push({ id, title, channel: ch.name, publishedAt: new Date(pub).toISOString() });
    if (out.length >= 4) break;
  }
  const ok: InnoVideo[] = [];
  for (const v of out) {
    if (await embeddable(v.id)) ok.push(v);
    if (ok.length >= 2) break;
  }
  return ok;
}

async function loadVideos(): Promise<InnoVideo[]> {
  const settled = await Promise.allSettled(CHANNELS.map(loadChannel));
  const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
  if (all.length === 0) throw new Error("innovation videos: none");
  return all;
}

export function getInnovationVideos(): Promise<Sourced<InnoVideo[]> | null> {
  return cachedSource(["innovation-videos-v1"], 6 * 3600, loadVideos);
}
