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
  /pinterest\.|facebook\.com\/groups|reddit\.com|tiktok\.com|doubleclick|outbrain|taboola|blogspot\.|quiz|clickbait|transfermarkt\.[a-z.]+\/.*seite|gemeinsame spiele|bilanz gegen|bildergalerie|foto-show|in\s*bildern|live-ticker\s*nur|umfrage:|jetzt\s*abstimmen|spielerpositionen|player\s*positions|vereinsprofil|kaderliste/i;

/** Zu generisch / reiner Füllstoff ohne Story-Signal */
const LOW_INTEREST =
  /^(live|ticker|ergebnis|ergebnisse|vorschau|preview|heute|today|video)\b|bilder|gallery|fotostrecke|so\s+lief|im\s+überblick|kurz\s*notiert|nachrichten\s*überblick|was\s+sie\s+wissen|top\s*stories|morning\s*brief|spielerpositionen/i;

/** Pflicht: Kroatien-Bezug im Titel – sonst raus (kein BVB-/PL-Spam) */
const CROAT_SIGNAL =
  /croat|kroatien|hrvat|vatren|hnl|hajduk|modri[cć]|modric|gvardiol|kova[cč]i[cć]|peri[sš]i[cć]|livakovi|budimir|pa[sš]ali[cć]|brozovi|maj[eе]r|su[cć]i[cć]|baturina|juranovi[cć]|stani[sš]i[cć]|petkovi[cć]|ivanu[sš]ec|sosa|bili[cć]|izbornik|reprezent|dinamo\s*zagreb|gnk\s*dinamo|rijeka|osijek|lokomotiva|varazdin|šibenik|sibenik/i;

const RELEVANCE = CROAT_SIGNAL;

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_VER = "v8-unique-teaser";

/** Stopwords for near-duplicate fingerprints (de/en/hr) */
const STOP = new Set(
  "der die das den dem des ein eine einer einem einen und oder mit von zu im in am auf für fur als auch nicht nur nach vor bei aus ist sind war wird werden the a an of to for in on at is are was were by with from as that this these those i u je na se za od do sa su ali ili kako sto što kad kada o a the".split(
    /\s+/
  )
);
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

/** Significant tokens for near-duplicate detection */
export function titleTokens(title: string): string[] {
  const cleaned = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9äöüßčćžšđ\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const raw = cleaned.split(" ").filter((w) => w.length > 2 && !STOP.has(w));
  // Prefer longer tokens first; keep unique
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of raw.sort((a, b) => b.length - a.length)) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= 12) break;
  }
  return out.sort();
}

export function titleFingerprint(title: string): string {
  return titleTokens(title).slice(0, 8).join("|");
}

/** Jaccard on token sets – near-dupes across feeds/languages */
export function titleSimilarity(a: string, b: string): number {
  const ta = new Set(titleTokens(a));
  const tb = new Set(titleTokens(b));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = ta.size + tb.size - inter;
  return union ? inter / union : 0;
}

function isNearDuplicate(title: string, kept: string[]): boolean {
  const fp = titleFingerprint(title);
  if (!fp) return false;
  for (const k of kept) {
    if (titleFingerprint(k) === fp) return true;
    if (titleSimilarity(title, k) >= 0.52) return true;
    // Same first 4 long tokens in any order → often same wire story
    const a = titleTokens(title).filter((t) => t.length > 3).slice(0, 5);
    const b = new Set(
      titleTokens(k).filter((t) => t.length > 3).slice(0, 5)
    );
    if (a.length >= 3 && a.filter((t) => b.has(t)).length >= 3) return true;
  }
  return false;
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
  const t = sanitizeNewsDisplay(titleRaw, 160);
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
  if (/modri|gvardiol|kova[cč]|bili[cć]|vatren|izbornik|suk|pasalic|pašalić|brozovi/i.test(
    title
  ))
    score += 40;
  if (/hnl|hajduk|dinam|rijeka|osijek/i.test(title)) score += 25;
  if (
    /transfer|ugovor|verläng|contract|return|oprostit|vertrag|verpflicht|verpflichtet|wechs|signing/i.test(
      title
    )
  )
    score += 22;
  if (
    /verletz|injury|ozljed|kader|squad|nomin|beruf|nations|liga nacija|qualif|sieg|defeat|poraz|pobjeda|win\b|lost/i.test(
      title
    )
  )
    score += 16;
  if (prefer && link.toLowerCase().includes(prefer)) score += 20;
  if (LOW_INTEREST.test(title)) score -= 35;
  // Reine Namens-Meldungen ohne Verb/Story-Signal
  if (
    title.split(/\s+/).length <= 4 &&
    !/transfer|vertrag|sieg|tor|gol|verläng|return|ozljed|injur/i.test(title)
  ) {
    score -= 12;
  }

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

type StoryKind =
  | "sub"
  | "stoppage"
  | "goal"
  | "lineup"
  | "transfer"
  | "injury"
  | "result"
  | "preview"
  | "coach"
  | "nt"
  | "europe"
  | "other";

const STAR_NAMES: Array<{ re: RegExp; de: string; en: string; hr: string }> = [
  { re: /modri/i, de: "Luka Modrić", en: "Luka Modrić", hr: "Luka Modrić" },
  { re: /gvardiol/i, de: "Joško Gvardiol", en: "Joško Gvardiol", hr: "Joško Gvardiol" },
  { re: /kova[cč]i/i, de: "Mateo Kovačić", en: "Mateo Kovačić", hr: "Mateo Kovačić" },
  { re: /peri[sš]i/i, de: "Ivan Perišić", en: "Ivan Perišić", hr: "Ivan Perišić" },
  { re: /livakovi/i, de: "Dominik Livaković", en: "Dominik Livaković", hr: "Dominik Livaković" },
  { re: /pa[sš]ali/i, de: "Mario Pašalić", en: "Mario Pašalić", hr: "Mario Pašalić" },
  { re: /baturina/i, de: "Martin Baturina", en: "Martin Baturina", hr: "Martin Baturina" },
  { re: /su[cć]i[cć]/i, de: "Luka Sučić", en: "Luka Sučić", hr: "Luka Sučić" },
  { re: /juranovi/i, de: "Josip Juranović", en: "Josip Juranović", hr: "Josip Juranović" },
  { re: /stani[sš]i/i, de: "Josip Stanišić", en: "Josip Stanišić", hr: "Josip Stanišić" },
  { re: /budimir/i, de: "Ante Budimir", en: "Ante Budimir", hr: "Ante Budimir" },
  { re: /petkovi/i, de: "Bruno Petković", en: "Bruno Petković", hr: "Bruno Petković" },
  { re: /ivanu[sš]ec/i, de: "Luka Ivanušec", en: "Luka Ivanušec", hr: "Luka Ivanušec" },
  { re: /maj[eе]r/i, de: "Lovro Majer", en: "Lovro Majer", hr: "Lovro Majer" },
  { re: /brozovi/i, de: "Marcelo Brozović", en: "Marcelo Brozović", hr: "Marcelo Brozović" },
  { re: /sosa/i, de: "Borna Sosa", en: "Borna Sosa", hr: "Borna Sosa" },
  { re: /kramari/i, de: "Andrej Kramarić", en: "Andrej Kramarić", hr: "Andrej Kramarić" },
  { re: /bili[cć]/i, de: "Slaven Bilić", en: "Slaven Bilić", hr: "Slaven Bilić" },
];

const CLUBS: Array<{ re: RegExp; de: string; en: string; hr: string }> = [
  { re: /\bmilan\b|ac milan/i, de: "AC Mailand", en: "AC Milan", hr: "AC Milan" },
  { re: /manchester city|man city/i, de: "Manchester City", en: "Manchester City", hr: "Manchester City" },
  { re: /hajduk/i, de: "Hajduk Split", en: "Hajduk Split", hr: "Hajduk Split" },
  { re: /dinamo/i, de: "Dinamo Zagreb", en: "Dinamo Zagreb", hr: "Dinamo Zagreb" },
  { re: /rijeka/i, de: "HNK Rijeka", en: "HNK Rijeka", hr: "HNK Rijeka" },
  { re: /osijek/i, de: "NK Osijek", en: "NK Osijek", hr: "NK Osijek" },
  { re: /midtjylland/i, de: "Midtjylland", en: "Midtjylland", hr: "Midtjylland" },
  { re: /psv/i, de: "PSV Eindhoven", en: "PSV Eindhoven", hr: "PSV Eindhoven" },
  { re: /atalanta/i, de: "Atalanta", en: "Atalanta", hr: "Atalanta" },
  { re: /paok/i, de: "PAOK", en: "PAOK", hr: "PAOK" },
  { re: /bayern/i, de: "Bayern München", en: "Bayern Munich", hr: "Bayern München" },
  { re: /real sociedad/i, de: "Real Sociedad", en: "Real Sociedad", hr: "Real Sociedad" },
];

function namesInLocale(
  title: string,
  table: typeof STAR_NAMES,
  loc: "de" | "en" | "hr"
): string {
  const hits = table.filter((r) => r.re.test(title)).slice(0, 2);
  if (!hits.length) return "";
  return hits.map((h) => h[loc]).join(" und ");
}

function detectKind(title: string, category: NewsArticle["category"]): StoryKind {
  const t = title.toLowerCase();
  if (/eingewechsel|eingewechselt|eingewechselt|von der bank|subst|bench|klupa|ušao/i.test(t))
    return "sub";
  if (/nachspielzeit|stoppage|injury time|sudačkoj|90\+|95'|96'/i.test(t))
    return "stoppage";
  if (/\btor\b|\bgoal\b|trifft|scored|gol\b|hattrick/i.test(t)) return "goal";
  if (/aufstellung|line-?up|sastav|starting xi|startelf/i.test(t)) return "lineup";
  if (
    category === "transfer" ||
    /transfer|vertrag|ugovor|verläng|wechsel|verpflicht/i.test(t)
  )
    return "transfer";
  if (/verletz|injury|ozljed|ausfall|doubt/i.test(t)) return "injury";
  if (/sieg|defeat|niederlage|pobjeda|poraz|gewonnen|verloren|\d+\s*[:\-]\s*\d+/i.test(t))
    return "result";
  if (/vorschau|preview|najava|heute|tonight/i.test(t)) return "preview";
  if (/bili[cć]|izbornik|coach|trainer/i.test(t)) return "coach";
  if (
    /conference|europa league|champions|qualif|playoff|uel|uecl|ucl/i.test(t)
  )
    return "europe";
  if (category === "vatreni" || /vatren|reprezent|nations|national/i.test(t))
    return "nt";
  return "other";
}

/**
 * Ein individueller Teaser pro Headline – kein Copy der Überschrift,
 * keine Standard-Floskeln „Aktuelle Meldung aus dem Umfeld…“.
 */
function localizedTeaser(
  title: string,
  source: string,
  category: NewsArticle["category"]
): NewsLocaleText {
  const src = source || "Medien";
  const kind = detectKind(title, category);
  const whoDe = namesInLocale(title, STAR_NAMES, "de");
  const whoEn = namesInLocale(title, STAR_NAMES, "en");
  const whoHr = namesInLocale(title, STAR_NAMES, "hr");
  const clubDe = namesInLocale(title, CLUBS, "de");
  const clubEn = namesInLocale(title, CLUBS, "en");
  const clubHr = namesInLocale(title, CLUBS, "hr");
  const who = { de: whoDe, en: whoEn, hr: whoHr };
  const club = { de: clubDe, en: clubEn, hr: clubHr };

  const line = (loc: "de" | "en" | "hr") => {
    const w = who[loc];
    const c = club[loc];
    const subj =
      w ||
      c ||
      (loc === "hr"
        ? "Hrvatski nogomet"
        : loc === "en"
          ? "Croatian football"
          : "der kroatische Fußball");

    switch (kind) {
      case "sub":
        return loc === "de"
          ? `${subj} kam von der Bank – der Bericht schildert, wie der Einsatz die Partie verändert hat. Für die Vatreni zählen solche Minuten vor dem nächsten Länderspiel.`
          : loc === "en"
            ? `${subj} came off the bench – the report covers how the cameo changed the match. Those minutes matter for Croatia’s next window.`
            : `${subj} ušao je s klupe – izvještaj opisuje kako je nastup okrenuo utakmicu. Takve minute broje pred idući rok Vatrenih.`;
      case "stoppage":
        return loc === "de"
          ? `${subj} stand in der Nachspielzeit im Mittelpunkt. Späte Szenen entscheiden oft Spiele – und die Formkurve vor der Nationalmannschaft.`
          : loc === "en"
            ? `${subj} was central in stoppage time. Late moments decide matches – and the form curve before the next Croatia camp.`
            : `${subj} bio je ključan u sudačkoj nadoknadi. Kasne scene odlučuju utakmice – i formu pred okupljanje Vatrenih.`;
      case "goal":
        return loc === "de"
          ? `${subj} war am Treffer beteiligt. Der Originalbericht nennt den Spielstand und die Szene – hier nur die Einordnung für Kroaten-Fans.`
          : loc === "en"
            ? `${subj} was involved in the goal. The original report has the score and the clip – here only the Croatia-fan angle.`
            : `${subj} bio je uključen u gol. Original donosi rezultat i scenu – ovdje samo kut za navijače Vatrenih.`;
      case "lineup":
        return loc === "de"
          ? `${c ? `Aufstellung: ${c}` : "Eine Aufstellung"} ist raus. Wer startet, wer sitzt – das ist die konkrete Info, nicht eine allgemeine Club-News.`
          : loc === "en"
            ? `${c ? `Line-up: ${c}` : "A line-up"} is out. Who starts, who sits – that’s the actual news, not a generic club note.`
            : `${c ? `Sastav: ${c}` : "Sastav"} je objavljen. Tko kreće, tko sjedi – to je konkretna vijest, ne opća klupska nota.`;
      case "transfer":
        return loc === "de"
          ? `${subj}: Vertrags- oder Wechselthema. Wir verlinken die Quelle, erfinden aber keinen Deal – erst zählen, was öffentlich bestätigt ist.`
          : loc === "en"
            ? `${subj}: contract or transfer talk. We link the source and do not invent a deal – only what is publicly confirmed.`
            : `${subj}: ugovor ili transfer. Linkamo izvor, ne izmišljamo deal – broji samo što je javno potvrđeno.`;
      case "injury":
        return loc === "de"
          ? `${subj} und Fitness: der Bericht betrifft Einsatzfähigkeit. Für Tracker und Länderspiele gilt weiter: nur mit Quelle, kein Raten.`
          : loc === "en"
            ? `${subj} and fitness: the report is about availability. For the tracker and internationals we still only follow sourced notes.`
            : `${subj} i forma: izvještaj je o raspoloživosti. Za tracker i reprezentaciju i dalje samo s izvorom.`;
      case "result":
        return loc === "de"
          ? `${c ? `${c}: ` : ""}${w ? `${w} im Spiel` : "Ergebnis im kroatischen Blick"}. Den genauen Stand liest du im Original – hier die Einordnung für Form und nächste Termine.`
          : loc === "en"
            ? `${c ? `${c}: ` : ""}${w ? `${w} featured` : "a result with a Croatian angle"}. Full score in the original – here the form and fixture takeaway.`
            : `${c ? `${c}: ` : ""}${w ? `${w} na utakmici` : "rezultat s hrvatskim kutom"}. Točan rezultat u originalu – ovdje forma i idući termini.`;
      case "preview":
        return loc === "de"
          ? `Vorschau${c ? ` auf ${c}` : ""}${w ? ` mit ${w}` : ""}. Wer spielt wann – das Original hat die Details, wir halten den Vatreni-Kontext fest.`
          : loc === "en"
            ? `Preview${c ? ` of ${c}` : ""}${w ? ` featuring ${w}` : ""}. Who plays when is in the original; we keep the Vatreni context.`
            : `Najava${c ? ` za ${c}` : ""}${w ? ` s ${w}` : ""}. Tko igra kada je u originalu; mi držimo kontekst Vatrenih.`;
      case "coach":
        return loc === "de"
          ? `${w || "Der Trainerstab"} im Fokus: Personal, Kader oder Aussage. Keine spekulativen Aufstellungen – nur was die Quelle konkret schreibt.`
          : loc === "en"
            ? `${w || "The coaching staff"} in focus: personnel, squad or a quote. No guessed line-ups – only what the source actually says.`
            : `${w || "Stručni stožer"} u fokusu: kadar ili izjava. Bez nagađanih sastava – samo što izvor konkretno piše.`;
      case "europe":
        return loc === "de"
          ? `${c || "Ein kroatischer Club"} im Europapokal${w ? ` – ${w}` : ""}. Quali und Playoffs entscheiden über Minuten auf hohem Niveau.`
          : loc === "en"
            ? `${c || "A Croatian club"} in Europe${w ? ` – ${w}` : ""}. Qualifiers and play-offs decide high-level minutes.`
            : `${c || "Hrvatski klub"} u Europi${w ? ` – ${w}` : ""}. Kvalifikacije i play-offi odlučuju o minutama na visokoj razini.`;
      case "nt":
        return loc === "de"
          ? `Nationalmannschaft${w ? `: ${w}` : ""}. Termine und Kader nur, wenn der Verband oder eine belastbare Quelle spricht.`
          : loc === "en"
            ? `National team${w ? `: ${w}` : ""}. Fixtures and squads only when the federation or a solid source speaks.`
            : `Reprezentacija${w ? `: ${w}` : ""}. Termini i kadar samo kad savez ili pouzdan izvor govori.`;
      default:
        if (w) {
          return loc === "de"
            ? `${w}${c ? ` (${c})` : ""} steht in dieser Meldung im Mittelpunkt. Den Ablauf liest du bei ${src} – wir ordnen nur für Vatreni-Fans ein.`
            : loc === "en"
              ? `${w}${c ? ` (${c})` : ""} is the focus of this item. The full story is at ${src} – we only frame it for Vatreni fans.`
              : `${w}${c ? ` (${c})` : ""} je u središtu vijesti. Cijeli tekst je kod ${src} – mi samo uokvirujemo za navijače Vatrenih.`;
        }
        if (c) {
          return loc === "de"
            ? `${c} in den Schlagzeilen. Was genau passiert ist, steht im Original bei ${src} – relevant, weil kroatische Profis oder der HNL betroffen sind.`
            : loc === "en"
              ? `${c} in the headlines. What actually happened is in the original at ${src} – relevant because Croatian pros or the HNL are involved.`
              : `${c} u naslovima. Što se točno dogodilo čitaš kod ${src} – bitno jer su uključeni hrvatski profesionalci ili HNL.`;
        }
        return loc === "de"
          ? `Kurze Einordnung dieser Headline für Vatreni-Fans. Den Bericht selbst öffnest du bei ${src}.`
          : loc === "en"
            ? `A short Vatreni-fan take on this headline. Open the report itself at ${src}.`
            : `Kratki kut za navijače Vatrenih. Sam izvještaj otvori kod ${src}.`;
    }
  };

  return { de: line("de"), en: line("en"), hr: line("hr") };
}

function localizedBody(
  title: string,
  source: string,
  date: string,
  category: NewsArticle["category"]
): NewsLocaleText {
  const src = source || "Medien";
  const teaser = localizedTeaser(title, src, category);
  return {
    de: [
      title,
      "",
      teaser.de,
      "",
      `Datum der Headline: ${date}. Medienquelle: ${src}.`,
      "",
      "Kroatien Sport Live ist ein redaktionelles Info-Angebot: Wir fassen öffentlich sichtbare Headlines zusammen und verlinken auf den Originalartikel. Wir hosten keine Volltexte Dritter (kein Framing, kein Artikel-Scraping).",
      "",
      "Auf der Website parallel nutzbar: Live-Board (Spiele mit kroatischen Spielern, nächste 7 Tage), Nationalteam-Kalender, Spieler-Tracker mit nächstem Spiel und Status – sowie bestätigte TV-Hinweise, wo redaktionell belegt.",
      "",
      `Vollständiger Bericht beim Anbieter: ${src} (Button „Original öffnen“).`,
    ].join("\n\n"),
    en: [
      title,
      "",
      teaser.en,
      "",
      `Headline date: ${date}. Media source: ${src}.`,
      "",
      "Croatia Sport Live is an editorial information site: we summarise publicly visible headlines and link to the original article. We do not host third-party full texts (no framing, no article scraping).",
      "",
      "Also on the site: live board (fixtures with Croatian players, next 7 days), national-team calendar, player tracker with next match and status – plus confirmed TV tips where editorially verified.",
      "",
      `Full report at the publisher: ${src} (“Open original”).`,
    ].join("\n\n"),
    hr: [
      title,
      "",
      teaser.hr,
      "",
      `Datum naslova: ${date}. Medijski izvor: ${src}.`,
      "",
      "Kroatien Sport Live je urednički info servis: sažimamo javno vidljive naslove i linkamo na original. Ne hostamo tuđe full tekstove (bez framanja, bez scrapanja članaka).",
      "",
      "Na stranici paralelno: live board (utakmice s hrvatskim igračima, 7 dana), kalendar reprezentacije, tracker s idućom utakmicom i statusom – te potvrđeni TV savjeti gdje je urednički dokazano.",
      "",
      `Puni izvještaj kod izdavača: ${src} („Otvori original“).`,
    ].join("\n\n"),
  };
}

function tagFor(source: string): NewsLocaleText {
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
    if (LOW_INTEREST.test(title) && !/modri|gvardiol|vatren|bili[cć]|hnl|hajduk|dinam/i.test(title))
      continue;
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

  // Exact + fingerprint map: keep highest score per near-same story
  const byKey = new Map<string, Raw>();
  for (const item of flat) {
    // Strict: only keep items whose feed language matches UI,
    // except optional HR for DE
    if (item.lang !== locale) {
      if (!(locale === "de" && item.lang === "hr" && includeRelatedHR)) {
        continue;
      }
    }
    if (item.score < 18) continue;
    const key =
      titleFingerprint(item.title) || slugify(item.title);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev || item.score > prev.score) byKey.set(key, item);
  }

  const ranked = Array.from(byKey.values()).sort((a, b) => b.score - a.score);
  const articles: NewsArticle[] = [];
  const seen = new Set<string>();
  const keptTitles: string[] = [];

  // Cap HR extras on DE
  let hrCount = 0;
  const hrCap = includeRelatedHR ? 3 : 0;

  for (const item of ranked) {
    if (articles.length >= max) break;
    if (item.lang === "hr" && locale === "de") {
      if (hrCount >= hrCap) continue;
    }

    const titleClean = sanitizeNewsDisplay(item.title, 140);
    if (!isUsableHeadline(titleClean)) continue;
    if (isNearDuplicate(titleClean, keptTitles)) continue;

    const id = `auto-${slugify(titleClean)}`.slice(0, 96);
    if (seen.has(id)) continue;
    seen.add(id);
    keptTitles.push(titleClean);
    if (item.lang === "hr" && locale === "de") hrCount += 1;

    const dateIso = parseDate(item.pubDate);
    const cat = categorize(titleClean);
    const teaser = localizedTeaser(titleClean, item.source, cat);
    const body = localizedBody(titleClean, item.source, dateIso, cat);
    const title: NewsLocaleText = {
      de: titleClean,
      en: titleClean,
      hr: titleClean,
    };

    const age =
      (Date.now() - new Date(item.pubDate).getTime()) / (24 * 3600_000);
    articles.push({
      id,
      date: dateIso,
      category: cat,
      tag: tagFor(item.source),
      title,
      summary: teaser,
      body,
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
