import { cachedSource, type Sourced } from "../cache";
import { fetchText } from "../http";
import type { Lang } from "../i18n";
import { parseRss } from "./rss";
import { detectLang } from "../lang-detect";
import { looksEnglish } from "./news";

/**
 * "Musik & Film": Schlagzeilen über kroatische Musiker, Bands, Schauspieler, Filme und Festivals.
 * Ohne Klatsch, Kriminalität, Politik, Sport. Nur Titel + Quelle + Zeit + Link zum Original.
 */
export interface CultureItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  lang: Lang;
  /** erkannte Person/Festival (für max. 2 pro Person) */
  person?: string;
}

const g = (q: string, lang: Lang) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&${
    lang === "de" ? "hl=de&gl=AT&ceid=AT:de" : "hl=hr&gl=HR&ceid=HR:hr"
  }`;

/** `section: true` = Kultur-Rubrik eines Mediums – dort reicht Person ODER Kroatien-Bezug */
export const FEEDS: Array<{ url: string; lang: Lang; name?: string; section?: boolean }> = [
  { url: g('("Baby Lasagna" OR 2Cellos OR "Stjepan Hauser" OR "Luka Šulić" OR "Maksim Mrvica" OR "Goran Višnjić" OR "Rade Šerbedžija" OR "Zrinka Cvitešić") when:30d', "de"), lang: "de" },
  { url: g("Kroatien (Film OR Filmfestival OR Musik OR Sänger OR Sängerin OR Band OR Schauspieler OR Schauspielerin OR Konzert OR ESC OR Eurovision) when:21d", "de"), lang: "de" },
  { url: g("kroatische (Sängerin OR Sänger OR Band OR Schauspielerin OR Schauspieler OR Regisseurin OR Regisseur OR Film) when:30d", "de"), lang: "de" },
  { url: g('("Hauser" Cellist OR 2Cellos OR "Baby Lasagna" OR Gibonni OR "Prljavo kazalište" OR "Maksim Mrvica") when:30d', "de"), lang: "de" },
  { url: g("(kroatischer OR kroatischen OR kroatische) (Film OR Regisseur OR Musiker OR Pianist OR Cellist OR Komponist OR Festival) when:30d", "de"), lang: "de" },
  { url: g('("Let 3" OR Severina OR "Petar Grašo" OR "Nina Badrić" OR "Jelena Rozga" OR "Dalibor Matanić" OR "Nebojša Slijepčević" OR "Hana Jušić" OR "Tereza Kesovija") when:60d', "de"), lang: "de" },
  { url: g("(Zagreb OR Split OR Dubrovnik OR Rijeka OR Pula OR Zadar OR Šibenik) (Filmfestival OR Musikfestival OR Konzert OR Oper OR Theater OR Kinofilm) kroatisch when:30d", "de"), lang: "de" },
  { url: g("kroatischer Film OR kroatische Musik OR kroatischer Musiker OR kroatische Künstlerin when:45d", "de"), lang: "de" },
  { url: g('("Kroatien" Kultur OR "kroatische Kultur" OR "kroatisches Kino" OR "kroatischer Rapper" OR "kroatische Popsängerin") when:60d', "de"), lang: "de" },
  { url: g("Zagreb Konzert when:45d", "de"), lang: "de" },
  { url: g("Kroatien (Festival OR Musik) when:45d", "de"), lang: "de" },
  { url: "https://www.tportal.hr/rss-kultura.xml", lang: "hr", name: "tportal", section: true },
  { url: "https://www.vecernji.hr/feeds/section/kultura", lang: "hr", name: "Večernji list", section: true },
  { url: "https://www.muzika.hr/feed", lang: "hr", name: "Muzika.hr" },
  { url: "https://www.index.hr/rss/magazin", lang: "hr", name: "Index.hr" },
  { url: g('("Baby Lasagna" OR "Stjepan Hauser" OR "Luka Šulić" OR "Maksim Mrvica" OR "Goran Višnjić" OR Šerbedžija OR Cvitešić OR Gibonni) when:21d', "hr"), lang: "hr" },
];

/** Personen/Festivals (gefaltet) – mehrdeutige Namen nur mit Zusatzbedingung */
const PEOPLE: Array<[string, RegExp]> = [
  ["baby-lasagna", /baby lasagna|purisic/],
  ["2cellos", /2cellos|2 cellos/],
  ["hauser", /stjepan hauser|hauser.{0,40}(cell|violonc)|(cell|violonc).{0,40}hauser/],
  ["sulic", /luka sulic|\bsulic\b.{0,40}(cell|violonc)/],
  ["mrvica", /mrvica/],
  ["visnjic", /goran visnjic|visnjic.{0,40}(glum|schauspiel|serij|film)/],
  ["serbedzija", /serbedzij/],
  ["cvitesic", /cvitesic/],
  ["dragojevic", /oliver dragojevic|\boliver\b.{0,30}(pjesm|koncert|album)/],
  ["gibonni", /gibonni/],
  ["cetinski", /tony cetinski|cetinski/],
  ["pula-ff", /pulsk\w* filmsk|pula film|filmfestival (von|in) pula|pulskog filmskog/],
  ["motovun", /motovun/],
  ["inmusic", /inmusic/],
  ["ultra", /ultra europe/],
  ["eurosong", /eurosong|eurovizij|eurovision|song contest|\besc\b|\bdora\b 20\d\d|dori 20\d\d/],
  ["porin", /\bporin/],
  ["let3", /\blet ?3\b/],
  ["severina", /severina/],
  ["graso", /petar graso|\bgraso\b/],
  ["badric", /nina badric|badric/],
  ["rozga", /jelena rozga|\brozga\b/],
  ["matanic", /dalibor matanic|matanic.{0,40}(film|redatelj|regisseur)/],
  ["slijepcevic", /slijepcevic/],
  ["jusic", /hana jusic/],
  ["kesovija", /kesovija/],
  ["grse", /\bgrs(e|a|as|eov\w*)\b/],
];
const CROATIAN = /hrvat|kroat|croat|\bzagreb|\bsplit|\brijek|\bosijek|\bzadar|\bdubrovn|\bpul[aieu]\b|\bsibenik/;
const TOPIC =
  /film|kino|festival|album|pjesm|singl|koncert|glum|redatelj|serij|nagrad|pjeva|bend|glazb|musik|musiker|sanger|band\b|schauspiel|regisseur|konzert|\bsong|lied|oscar|berlinale|cannes|venedig|venecij|kazalist|theater|opera|orkest|orchester|nastup|turnej|tournee|spot|hit/;
/** Klatsch, Kriminalität, Politik, Sport, Krieg, Werbung */
const EXCLUDE =
  /trudn|rastav|razvod|ljubav|zarucn|vjencan|cura|decko|bikini|zgodn|seksi|sexy|golisav|obnazen|izgled|liniju|kilogram|tijelo|haljin|outfit|scheidung|affare|liebes|nackt|schwanger|horoskop|uhicen|policij|ubojstv|nesrec|sud\b|presud|optuz|zatvor|polizei|festgenommen|mord|unfall|wahl|partei|minister|regierung|vlad[aei]\b|sabor|izbor|stranka|hdz|sdp|plenkovi|milanovi|nogomet|fussball|kosark|basketball|tenis|tennis|rukomet|handball|\bufc\b|\bboks|vatren|dinamo|hajduk|\bhnl\b|rat\b|krieg|ukrain|izrael|gaza|reality|big brother|ljubav je na selu|nagradna igra|gewinnspiel|ticketverlosung|popust|akcij|vucic|srbij|serbien|kroatien-krimi|\btod\b|starb|preminu|umro|umrla|smrt|godisnjic|slik[aeu]\b|aukcij|auktion|serbisch|srpsk|boykott|bojkot|prosvjed|fotk[aeiu]|fotografij[aeu] iz|bazen|pratitelj|komplimen|instagram|snimke iz|wetter|urlaub|reise wert|hitze|gestorben|verstorben|torfestival|deklass|\bwm\b|em-quali|nations league|\b\d{1,2}:\d{1,2}\b(?! uhr)/;
const SPAM = /\p{Script=Cyrillic}|uzivo|live ?stream/iu;

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
const H = 3600_000;

export function personOf(title: string): string | undefined {
  const t = fold(title);
  return PEOPLE.find(([, rx]) => rx.test(t))?.[0];
}

/**
 * Ausländische Stars auf Gastspiel/Dreh in Kroatien (Konzerte, Tourneen, Hollywood-Drehs):
 * Die Rubrik zeigt kroatische Künstlerinnen und Künstler – solche Meldungen fliegen raus,
 * außer der Titel nennt ausdrücklich kroatische Mitwirkende/einen kroatischen Film.
 */
const FOREIGN_NAMES = /marsden|dylan moran|kyoto jazz|gervais|malkovich|iron maiden|dickinson|portishead|beth gibbons|fontaines|hollywood/;
const GUEST =
  /stiz[eu] u (?!kin)|dolazi u (?!kin)|dolaze u|vraca se u|vracaju se u|prvi put u hrvatsk|turnej|tournee|kommt nach|kommen nach|erstmals .{0,40}in kroatien|konzert in kroatien|gastspiel|zagreb i beograd|britansk|americk|nigerij|irsk[aio]|engleski|svjetsk\w* zvijezd|weltstar|us-star|hollywood|snima u hrvatsk|dreht in kroatien|drehort|slowenisch|bosnisch|aus nis\b|slovensk|bosansk|lighthouse|japanisch|amerikanisch|britisch|englisch|irisch|franzosisch|italienisch|spanisch|schwedisch|norwegisch|danisch|niederlandisch|australisch|kanadisch|japansk|francusk|talijansk|spanjolsk|svedsk|norvesk|nizozemsk|australsk|kanadsk/;
const CRO_ARTIST =
  /hrvatsk(i|og|om|ih|im|a|e|oj) (pjev|glazb|glum|bend|sastav|redatelj|film|umjetni|skladatelj|zvijezd|reper|kantautor|pijanist|violonc)|kroatisch\w* (sanger|band|musik|film|schauspiel|regisseur|kunstler|star|pianist|cellist|komponist)|kroatien-film/;
export function foreignGuest(title: string): boolean {
  const t = fold(title);
  if (personOf(title) && personOf(title) !== "eurosong") return false;
  if (CRO_ARTIST.test(t)) return false;
  return FOREIGN_NAMES.test(t) || GUEST.test(t);
}

export function relevantCulture(title: string, section = false): boolean {
  const t = fold(title);
  if (EXCLUDE.test(t) || SPAM.test(title)) return false;
  if (foreignGuest(title)) return false;
  const p = personOf(title);
  if (p === "eurosong") return CROATIAN.test(t) || /baby lasagna|dora/.test(t);
  if (p) return true;
  return CROATIAN.test(t) && (section || TOPIC.test(t));
}

export async function loadFeed(f: (typeof FEEDS)[number]): Promise<CultureItem[]> {
  const out: CultureItem[] = [];
  const xml = await fetchText(f.url);
  // Bot-Schutzseiten (z. B. Netokracija: HTTP 202 mit leerer/HTML-Seite) als Fehler werten
  if (!/<(rss|feed|rdf:RDF)\b/i.test(xml)) throw new Error(`no RSS from ${f.url}`);
  for (const it of parseRss(xml)) {
    const t = it.pubDate ? Date.parse(it.pubDate) : NaN;
    if (Number.isNaN(t)) continue;
    const source = f.name ?? (it.source?.trim() || "Google News");
    let title = it.title;
    if (it.source && title.endsWith(` - ${it.source}`)) title = title.slice(0, -(it.source.length + 3)).trim();
    title = title.replace(/^(.{1,30}?\p{Ll})(Das|Die|Der|Ein|Eine|Im|Am|Zum) /u, "$1: $2 ");
    // kaputte Feed-Titel (Teaser-Reste, leere Überschrift) überspringen
    if (/:\s*-\s|^\p{Lu}\p{Ll}+ (Sie|Er|Es|Wir|Ihr) /u.test(title)) continue;
    if (!relevantCulture(title, f.section) || SPAM.test(source) || looksEnglish(title) || title.length < 25) continue;
    const det = detectLang(title);
    if (det !== f.lang && !(det === null && !looksEnglish(title))) continue;
    out.push({ title, url: it.link, source, publishedAt: new Date(t).toISOString(), lang: f.lang, person: personOf(title) });
  }
  return out;
}

function tokens(s: string): Set<string> {
  return new Set(fold(s).replace(/[^a-z0-9 ]+/g, " ").split(" ").filter((x) => x.length > 3));
}
const GENERIC_STEMS = new Set("hrvat kroat croat zagre europ split rijek osije svjet festi koncer album filmf".split(" "));
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

/** Seitensprache, ≤ 7 Tage zuerst, sonst bis 30 Tage; gleiche Geschichte einmal; max. 2 je Person/Festival. */
export function pickCulture(pool: CultureItem[], { lang, now = Date.now(), max = 12, perPerson = 2 }: { lang: Lang; now?: number; max?: number; perPerson?: number }): CultureItem[] {
  // DE-Medien berichten seltener über kroatische Kultur → längeres Fenster
  const window = (lang === "de" ? 60 : 30) * 24 * H;
  const own = pool
    .filter((n) => n.lang === lang)
    .filter((n) => {
      const age = now - Date.parse(n.publishedAt);
      return age >= -H && age <= window;
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const kept: Array<{ n: CultureItem; tok: Set<string>; st: Set<string>; t: number }> = [];
  const per = new Map<string, number>();
  for (const n of own) {
    const tok = tokens(n.title);
    const st = stems(n.title);
    const t = Date.parse(n.publishedAt);
    const same = (k: (typeof kept)[number]) =>
      k.n.url === n.url ||
      similar(k.tok, tok) ||
      (Math.abs(k.t - t) <= 7 * 24 * H && [...st].some((x) => k.st.has(x)) && (n.person ?? "") === (k.n.person ?? "")) ||
      // dieselbe Person binnen 3 Tagen = meist dasselbe Ereignis (z. B. ein Konzert, mehrere Berichte)
      (!!n.person && n.person !== "eurosong" && n.person === k.n.person && Math.abs(k.t - t) <= 3 * 24 * H);
    if (kept.some(same)) continue;
    if (n.person && (per.get(n.person) ?? 0) >= perPerson) continue;
    if (n.person) per.set(n.person, (per.get(n.person) ?? 0) + 1);
    kept.push({ n, tok, st, t });
  }
  const list = kept.map((k) => k.n);
  const fresh = list.filter((n) => now - Date.parse(n.publishedAt) <= 7 * 24 * H);
  return [...fresh, ...list.filter((n) => !fresh.includes(n))].slice(0, max);
}

async function loadCulture(): Promise<CultureItem[]> {
  const settled = await Promise.allSettled(FEEDS.map(loadFeed));
  const ok = settled.filter((s): s is PromiseFulfilledResult<CultureItem[]> => s.status === "fulfilled");
  if (ok.length === 0) throw new Error("culture: all feeds failed");
  const all = ok.flatMap((s) => s.value);
  if (all.length === 0) throw new Error("culture: no items");
  return all;
}

export function getCulture(): Promise<Sourced<CultureItem[]> | null> {
  return cachedSource(["culture-v5"], 1800, loadCulture);
}

/* ---------- Videos offizieller Künstler-/Festivalkanäle ---------- */
export interface CultureVideo { id: string; title: string; channel: string; publishedAt: string }
/** Kanal-IDs geprüft am 25.10.2026 (YouTube-Kanalsuche + Kanal-RSS) */
const CHANNELS = [
  { id: "UCvF3sNJf_ueHl8gVdLb0PYA", name: "Baby Lasagna" },
  { id: "UC09GemGjss3hPdljwtJ8TPA", name: "HAUSER" },
  { id: "UCm9MJM9JbwjilkOX7zUtm7A", name: "Luka Šulić" },
  { id: "UC6T1KP5D6yev8N20Fv9HGYg", name: "MAKSIM" },
  { id: "UC-pBNDlf9VvQbvXHMlPbp7g", name: "INmusic festival" },
  { id: "UCZmt0_cYJnu3hrsdQ4_U6Rg", name: "Pula Film Festival" },
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

async function loadChannel(ch: (typeof CHANNELS)[number]): Promise<CultureVideo[]> {
  const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`);
  let tries = 0;
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    if (++tries > 6) break;
    const e = m[1];
    const id = e.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const title = dec(e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
    const pub = e.match(/<published>([^<]+)<\/published>/)?.[1];
    // Shorts und Hashtag-Clips überspringen
    if (!id || !title || !pub || /#shorts/i.test(title) || (title.match(/#/g) ?? []).length >= 2) continue;
    if (await embeddable(id)) return [{ id, title, channel: ch.name, publishedAt: new Date(pub).toISOString() }];
  }
  return [];
}

async function loadVideos(): Promise<CultureVideo[]> {
  const settled = await Promise.allSettled(CHANNELS.map(loadChannel));
  const all = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
  if (all.length === 0) throw new Error("culture videos: none");
  return all;
}

export function getCultureVideos(): Promise<Sourced<CultureVideo[]> | null> {
  return cachedSource(["culture-videos-v1"], 6 * 3600, loadVideos);
}
