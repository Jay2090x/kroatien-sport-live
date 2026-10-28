#!/usr/bin/env node
/**
 * npm run refresh:bilanz
 *
 * Holt die Länderspielbilanz (Head-to-head-Tabelle, Daten des HNS) und alle Spielberichte
 * der Ergebnisseiten 1992–heute von der englischen Wikipedia, prüft beides gegeneinander
 * und schreibt src/data/h2h.ts + src/data/h2h-matches.ts neu.
 *
 * Prüfungen (bei Fehler: Abbruch, nichts wird geschrieben):
 *  1. Summe aller Gegnerzeilen = "Total"-Zeile der Tabelle (Spiele, S, U, N, Tore).
 *  2. Für jeden Gegner: aus den Einzelspielen berechnete Bilanz = Tabellenzeile.
 *  3. Bekannte Ländernamen (DE/HR) für jeden Gegner vorhanden.
 * Optionen: --dry (nur prüfen, nichts schreiben)
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const UA = { "User-Agent": "kroatien-sport-live refresh-bilanz (https://kroatien-sport-live.vercel.app)" };
const raw = async (title) => {
  const r = await fetch(`https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`, { headers: UA });
  if (!r.ok) throw new Error(`${title}: HTTP ${r.status}`);
  const t = await r.text();
  if (t.startsWith("<!DOCTYPE")) throw new Error(`${title}: keine Wikitext-Antwort`);
  return t;
};

// Englischer Tabellenname → [DE, HR, Flagge, FIFA-Codes in den Spielberichten]
const C = {
  Albania: ["Albanien", "Albanija", "🇦🇱", ["ALB"]], Andorra: ["Andorra", "Andora", "🇦🇩", ["AND"]], Argentina: ["Argentinien", "Argentina", "🇦🇷", ["ARG"]],
  Armenia: ["Armenien", "Armenija", "🇦🇲", ["ARM"]], Australia: ["Australien", "Australija", "🇦🇺", ["AUS"]], Austria: ["Österreich", "Austrija", "🇦🇹", ["AUT"]],
  Azerbaijan: ["Aserbaidschan", "Azerbajdžan", "🇦🇿", ["AZE"]], Belarus: ["Belarus", "Bjelorusija", "🇧🇾", ["BLR"]], Belgium: ["Belgien", "Belgija", "🇧🇪", ["BEL"]],
  "Bosnia and Herzegovina": ["Bosnien und Herzegowina", "Bosna i Hercegovina", "🇧🇦", ["BIH"]], Brazil: ["Brasilien", "Brazil", "🇧🇷", ["BRA"]],
  Bulgaria: ["Bulgarien", "Bugarska", "🇧🇬", ["BUL"]], Cameroon: ["Kamerun", "Kamerun", "🇨🇲", ["CMR"]], Canada: ["Kanada", "Kanada", "🇨🇦", ["CAN"]],
  Chile: ["Chile", "Čile", "🇨🇱", ["CHL", "CHI"]], China: ["China", "Kina", "🇨🇳", ["CHN"]], Colombia: ["Kolumbien", "Kolumbija", "🇨🇴", ["COL"]],
  Cyprus: ["Zypern", "Cipar", "🇨🇾", ["CYP"]], "Czech Republic": ["Tschechien", "Češka", "🇨🇿", ["CZE"]], Denmark: ["Dänemark", "Danska", "🇩🇰", ["DEN"]],
  Ecuador: ["Ecuador", "Ekvador", "🇪🇨", ["ECU"]], Egypt: ["Ägypten", "Egipat", "🇪🇬", ["EGY"]], England: ["England", "Engleska", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", ["ENG"]],
  Estonia: ["Estland", "Estonija", "🇪🇪", ["EST"]], "Faroe Islands": ["Färöer", "Ovčji Otoci", "🇫🇴", ["FRO"]], Finland: ["Finnland", "Finska", "🇫🇮", ["FIN"]],
  France: ["Frankreich", "Francuska", "🇫🇷", ["FRA"]], Georgia: ["Georgien", "Gruzija", "🇬🇪", ["GEO", "Georgia"]], Germany: ["Deutschland", "Njemačka", "🇩🇪", ["GER"]],
  Ghana: ["Ghana", "Gana", "🇬🇭", ["GHA"]], Gibraltar: ["Gibraltar", "Gibraltar", "🇬🇮", ["GIB"]], Greece: ["Griechenland", "Grčka", "🇬🇷", ["GRE"]],
  "Hong Kong": ["Hongkong", "Hong Kong", "🇭🇰", ["HKG"]], Hungary: ["Ungarn", "Mađarska", "🇭🇺", ["HUN"]], Iceland: ["Island", "Island", "🇮🇸", ["ISL"]],
  Iran: ["Iran", "Iran", "🇮🇷", ["IRN"]], Israel: ["Israel", "Izrael", "🇮🇱", ["ISR"]], Italy: ["Italien", "Italija", "🇮🇹", ["ITA"]],
  Jamaica: ["Jamaika", "Jamajka", "🇯🇲", ["JAM"]], Japan: ["Japan", "Japan", "🇯🇵", ["JPN"]], Jordan: ["Jordanien", "Jordan", "🇯🇴", ["JOR"]],
  Kazakhstan: ["Kasachstan", "Kazahstan", "🇰🇿", ["KAZ"]], Kosovo: ["Kosovo", "Kosovo", "🇽🇰", ["KVX", "KOS"]], Latvia: ["Lettland", "Latvija", "🇱🇻", ["LVA", "LAT"]],
  Liechtenstein: ["Liechtenstein", "Lihtenštajn", "🇱🇮", ["LIE"]], Lithuania: ["Litauen", "Litva", "🇱🇹", ["LTU", "LIT"]], Mali: ["Mali", "Mali", "🇲🇱", ["MLI"]],
  Malta: ["Malta", "Malta", "🇲🇹", ["MLT"]], Mexico: ["Mexiko", "Meksiko", "🇲🇽", ["MEX"]], Moldova: ["Moldau", "Moldavija", "🇲🇩", ["MDA"]],
  Montenegro: ["Montenegro", "Crna Gora", "🇲🇪", ["MNE"]], Morocco: ["Marokko", "Maroko", "🇲🇦", ["MAR"]], Netherlands: ["Niederlande", "Nizozemska", "🇳🇱", ["NED"]],
  Nigeria: ["Nigeria", "Nigerija", "🇳🇬", ["NGA"]], "North Macedonia": ["Nordmazedonien", "Sjeverna Makedonija", "🇲🇰", ["MKD"]],
  "Northern Ireland": ["Nordirland", "Sjeverna Irska", "", ["NIR"]], Norway: ["Norwegen", "Norveška", "🇳🇴", ["NOR"]], Panama: ["Panama", "Panama", "🇵🇦", ["PAN"]],
  Peru: ["Peru", "Peru", "🇵🇪", ["PER"]], Poland: ["Polen", "Poljska", "🇵🇱", ["POL"]], Portugal: ["Portugal", "Portugal", "🇵🇹", ["POR", "PRT"]],
  Qatar: ["Katar", "Katar", "🇶🇦", ["QAT"]], "Republic of Ireland": ["Irland", "Irska", "🇮🇪", ["IRL"]], Romania: ["Rumänien", "Rumunjska", "🇷🇴", ["ROU", "ROM"]],
  Russia: ["Russland", "Rusija", "🇷🇺", ["RUS"]], "San Marino": ["San Marino", "San Marino", "🇸🇲", ["SMR"]], "Saudi Arabia": ["Saudi-Arabien", "Saudijska Arabija", "🇸🇦", ["KSA"]],
  Scotland: ["Schottland", "Škotska", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", ["SCO"]], Senegal: ["Senegal", "Senegal", "🇸🇳", ["SEN"]], Serbia: ["Serbien", "Srbija", "🇷🇸", ["SRB", "SER", "FRY", "SCG"]],
  Slovakia: ["Slowakei", "Slovačka", "🇸🇰", ["SVK"]], Slovenia: ["Slowenien", "Slovenija", "🇸🇮", ["SVN"]], "South Korea": ["Südkorea", "Južna Koreja", "🇰🇷", ["KOR"]],
  Spain: ["Spanien", "Španjolska", "🇪🇸", ["ESP"]], Sweden: ["Schweden", "Švedska", "🇸🇪", ["SWE"]], Switzerland: ["Schweiz", "Švicarska", "🇨🇭", ["SUI"]],
  Tunisia: ["Tunesien", "Tunis", "🇹🇳", ["TUN"]], Turkey: ["Türkei", "Turska", "🇹🇷", ["TUR"]], Ukraine: ["Ukraine", "Ukrajina", "🇺🇦", ["UKR"]],
  "United States": ["USA", "SAD", "🇺🇸", ["USA"]], Wales: ["Wales", "Wales", "🏴󠁧󠁢󠁷󠁬󠁳󠁿", ["WAL"]],
};
const CODE = Object.fromEntries(Object.entries(C).flatMap(([en, v]) => v[3].map((c) => [c, en])));
const MONTHS = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };

// ---------- 1. Head-to-head-Tabelle ----------
const team = await raw("Croatia national football team");
const a = team.indexOf("==Head-to-head record==");
const b = team.indexOf("\n==", a + 10);
if (a < 0 || b < 0) throw new Error("Head-to-head-Abschnitt nicht gefunden");
let h2hSec = team.slice(a, b);
const asOfM = h2hSec.match(/Correct as of (\d{1,2}) (\w+) (\d{4})/);
if (!asOfM) throw new Error("Stand-Datum nicht gefunden");
const asOf = `${asOfM[3]}-${String(MONTHS[asOfM[2]]).padStart(2, "0")}-${asOfM[1].padStart(2, "0")}`;
const post = h2hSec.indexOf("Post-independence");
if (post < 0) throw new Error("Post-independence-Tabelle nicht gefunden");
h2hSec = h2hSec.slice(post);
const rowRe = /\{\{fb\|([^}|]+)(?:\|[^}]*)?\}\}(?:\{\{efn\|(?:[^{}]|\{\{[^}]*\}\}|\[\[[^\]]*\]\])*\}\})?\s*\n\{\{WDL\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|for=(\d+)\|against=(\d+)[^}]*\}\}\s*\n\|\s*\[\[([^\]]+)\]\]/g;
const rows = [...h2hSec.matchAll(rowRe)].map((m) => ({
  en: m[1].trim(), conf: m[8].replace(/.*\|/, ""), p: +m[2], w: +m[3], d: +m[4], l: +m[5], gf: +m[6], ga: +m[7],
}));
const totM = h2hSec.match(/!Total: (\d+) teams played\s*\n\{\{WDLtot\|(\d+)\|(\d+)\|(\d+)\|(\d+)\|for=(\d+)\|against=(\d+)/);
if (!totM) throw new Error("Total-Zeile nicht gefunden");
const total = { p: +totM[2], w: +totM[3], d: +totM[4], l: +totM[5], gf: +totM[6], ga: +totM[7] };
const errors = [];
if (rows.length !== +totM[1]) errors.push(`Tabelle: ${rows.length} Zeilen gelesen, laut Wikipedia ${totM[1]} Gegner`);
for (const k of ["p", "w", "d", "l", "gf", "ga"]) {
  const s = rows.reduce((x, r) => x + r[k], 0);
  if (s !== total[k]) errors.push(`Summe ${k}: Zeilen ${s} ≠ Total ${total[k]}`);
}
for (const r of rows) if (!C[r.en]) errors.push(`Unbekannter Gegner (Namen DE/HR ergänzen): ${r.en}`);

// ---------- 2. Einzelspiele ----------
const pages = ["1940–1991", "1992–1999", "2000–2009", "2010–2019", "2020–present"].map((p) => `Croatia national football team results (${p})`);
const texts = await Promise.all(pages.map(raw));
const field = (box, k) => (box.match(new RegExp(`\\|\\s*${k}\\s*=([^\\n]*)`)) || [, ""])[1].trim();
const teamCode = (t) => {
  const m = t.match(/\{\{\s*(?:fb|fb-rt|fbicon)\s*\|\s*([A-Za-z ]+?)\s*[|}]/);
  if (m) return m[1];
  const w = t.match(/\[\[([A-Za-z .]+?) national football team/); // z. B. [[Slovenia national football team|Slovenia]]
  if (w && C[w[1]]) return C[w[1]][3][0];
  return t;
};
/** Erstes Länderspiel, das der HNS zur Bilanz seit der Unabhängigkeit zählt (Kroatien – USA, 17.10.1990). */
const FIRST = "1990-10-17";
/** Spiele ab FIRST, die die HNS-Tabelle nicht mitzählt (per Gegenprüfung ermittelt, 28.10.2026). */
const EXCLUDE = new Set(["1990-12-22 Romania"]);
const clean = (s) => s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").replace(/\{\{[^{}]*\}\}/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const parseDate = (s) => {
  let m = s.match(/Start date\|(\d{4})\|(\d{1,2})\|(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})/);
  return m ? `${m[3]}-${String(MONTHS[m[2]]).padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
};
const matches = [];
for (const text of texts) {
  for (const box of text.split(/\n\{\{\s*football ?box[^\n]*/i).slice(1).map((x) => x.split(/\n\}\}/)[0])) {
    const t1 = teamCode(field(box, "team1")), t2 = teamCode(field(box, "team2"));
    const croHome = t1 === "CRO";
    if (!croHome && t2 !== "CRO") continue;
    const sc = field(box, "score").replace(/\{\{score link\|[^|]*\|([^}]*)\}\}/i, "$1").replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1").match(/^(\d+)\s*[–-]\s*(\d+)/);
    if (!sc) continue; // abgesagt / angesetzt
    const date = parseDate(field(box, "date"));
    const oppCode = croHome ? t2 : t1;
    const en = CODE[oppCode];
    if (!date) { errors.push(`Spiel ohne Datum (${oppCode})`); continue; }
    if (date < FIRST) continue;
    if (!en) { errors.push(`Unbekannter Code ${oppCode} (${date})`); continue; }
    if (EXCLUDE.has(`${date} ${en}`)) continue;
    const [h, aw] = [+sc[1], +sc[2]];
    const cro = croHome ? h : aw, opp = croHome ? aw : h;
    const pens = field(box, "penaltyscore").replace(/\{\{font color\|[^|]*\|[^|]*\|([^}]*)\}\}/, "$1").match(/(\d+)\s*[–-]\s*(\d+)/);
    const res = cro > opp ? "W" : cro < opp ? "L" : "D";
    const given = field(box, "result");
    if (/^[WDL]$/.test(given) && given !== res) errors.push(`${date} ${en}: Ergebnisfeld ${given} ≠ berechnet ${res}`);
    matches.push({
      date, en, home: croHome, cro, opp,
      aet: /^yes$/i.test(field(box, "aet")) || undefined,
      pens: pens ? (croHome ? `${pens[1]}:${pens[2]}` : `${pens[2]}:${pens[1]}`) : undefined,
      comp: clean(field(box, "round")).slice(0, 60),
      place: clean(field(box, "location")).slice(0, 60),
    });
  }
}
matches.sort((x, y) => x.date.localeCompare(y.date));
const upTo = matches.filter((m) => m.date <= asOf);
const newer = matches.filter((m) => m.date > asOf);
if (newer.length) console.warn(`Hinweis: ${newer.length} Spiel(e) nach dem Tabellenstand ${asOf} – Tabelle noch nicht aktualisiert, sie zählen nicht mit:`, newer.map((m) => `${m.date} ${m.en}`).join(", "));
for (const r of rows) {
  const ms = upTo.filter((m) => m.en === r.en);
  const s = { p: ms.length, w: ms.filter((m) => m.cro > m.opp).length, d: ms.filter((m) => m.cro === m.opp).length, l: ms.filter((m) => m.cro < m.opp).length, gf: ms.reduce((x, m) => x + m.cro, 0), ga: ms.reduce((x, m) => x + m.opp, 0) };
  const bad = ["p", "w", "d", "l", "gf", "ga"].filter((k) => s[k] !== r[k]);
  if (bad.length) errors.push(`${r.en}: Spielberichte ${JSON.stringify(s)} ≠ Tabelle ${JSON.stringify({ p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga })}`);
}
const extra = [...new Set(upTo.map((m) => m.en))].filter((en) => !rows.some((r) => r.en === en));
if (extra.length) errors.push(`Spiele gegen Gegner ohne Tabellenzeile: ${extra.join(", ")}`);

if (errors.length) {
  console.error(`✖ ${errors.length} Prüfung(en) fehlgeschlagen – nichts geschrieben:\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`✔ Stand ${asOf}: ${rows.length} Gegner, ${total.p} Spiele (${total.w}-${total.d}-${total.l}, ${total.gf}:${total.ga}); ${upTo.length} Spielberichte stimmen mit der Tabelle überein.`);
if (DRY) process.exit(0);

const today = new Date().toISOString().slice(0, 10);
const J = (x) => JSON.stringify(x);
const h2hTs = `/**
 * Länderspielbilanz Kroatiens (seit der Unabhängigkeit) gegen jeden Gegner.
 * Quelle: Wikipedia "Croatia national football team" › Head-to-head record
 * (Daten des HNS, rezultati.hns.team), Stand ${asOf}.
 * Erzeugt von scripts/refresh-bilanz.mjs am ${today}; Summen und alle Einzelspiele gegengeprüft.
 * Unentschieden schließen im Elfmeterschießen entschiedene Spiele ein. Serbien inkl. BR Jugoslawien.
 */
export interface H2H { en: string; de: string; hr: string; flag: string; conf: string; p: number; w: number; d: number; l: number; gf: number; ga: number }

export const H2H_ASOF = ${J(asOf)};
export const H2H_SOURCE = "https://en.wikipedia.org/wiki/Croatia_national_football_team#Head-to-head_record";
export const H2H_TOTAL = { p: ${total.p}, w: ${total.w}, d: ${total.d}, l: ${total.l}, gf: ${total.gf}, ga: ${total.ga} };

export const H2H_ROWS: H2H[] = [
${rows.map((r) => `  { en: ${J(r.en)}, de: ${J(C[r.en][0])}, hr: ${J(C[r.en][1])}, flag: ${J(C[r.en][2])}, conf: ${J(r.conf)}, p: ${r.p}, w: ${r.w}, d: ${r.d}, l: ${r.l}, gf: ${r.gf}, ga: ${r.ga} },`).join("\n")}
];
`;
const matchesTs = `/**
 * Alle Länderspiele Kroatiens seit 1992 bis zum Tabellenstand ${asOf} (nur gespielte Partien),
 * aus den Wikipedia-Ergebnisseiten (Spielberichte mit HNS-Links). Erzeugt von scripts/refresh-bilanz.mjs
 * am ${today}; je Gegner gegen die Head-to-head-Tabelle geprüft. Nur serverseitig importieren.
 * cro/opp = Tore Kroatien/Gegner (inkl. Verlängerung), pens = Elfmeterschießen aus Sicht Kroatiens.
 */
export interface H2HMatch { date: string; en: string; home: boolean; cro: number; opp: number; aet?: true; pens?: string; comp: string; place: string }

export const H2H_MATCHES: H2HMatch[] = [
${upTo.map((m) => "  " + J(Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined))) + ",").join("\n")}
];
`;
fs.writeFileSync(path.join(ROOT, "src/data/h2h.ts"), h2hTs);
fs.writeFileSync(path.join(ROOT, "src/data/h2h-matches.ts"), matchesTs);
console.log("✔ geschrieben: src/data/h2h.ts, src/data/h2h-matches.ts");
