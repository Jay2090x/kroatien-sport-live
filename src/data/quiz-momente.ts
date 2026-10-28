import type { QuizQ } from "./quiz";
import { H2H_ROWS, H2H_SOURCE } from "./h2h";
import { CAPS, WP_RECORDS, WP_TEAM } from "@/lib/vatreni-history-i18n";

/**
 * Quiz "Momente & Rekorde" – 10 Fragen, deren Antworten direkt aus den geprüften Daten der Seiten
 * Vatreni-Momente, Kroatien in Zahlen und Bilanz stammen (Wikipedia/HNS, Stand 6.10.2026).
 * Zahlen aus den Datensätzen werden zur Build-Zeit eingesetzt; passt eine Antwort nicht mehr zu den
 * Daten (z. B. nach npm run refresh:bilanz), bricht der Build mit einem Fehler ab.
 */
const row = (en: string) => {
  const r = H2H_ROWS.find((x) => x.en === en);
  if (!r) throw new Error(`quiz-momente: ${en} fehlt in h2h.ts`);
  return r;
};
const must = (ok: boolean, what: string) => {
  if (!ok) throw new Error(`quiz-momente: Antwort passt nicht mehr zu den Daten (${what}) – Frage anpassen`);
};
const src = (title: string, url: string) => ({ title, url });
const bilanzSrc = src("Wikipedia: Croatia national football team – Head-to-head record", H2H_SOURCE);

const modric = CAPS[0];
must(modric.name === "Luka Modrić" && modric.caps === 206, "Modrić 206");
const ita = row("Italy");
must(ita.l === 0 && ita.p === 9, "Italien ungeschlagen in 9");
const mostWins = [...H2H_ROWS].sort((a, b) => b.w - a.w)[0];
must(mostWins.en === "Malta" && mostWins.w === 9, "Malta 9 Siege");
const bra = row("Brazil");
must(bra.w === 0 && bra.d === 2, "Brasilien 0 Siege, 2 Remis");

export const QUIZ_MOMENTE: QuizQ[] = [
  {
    q: { de: "Wie viele Länderspiele hat Luka Modrić bestritten (Stand Oktober 2026)?", hr: "Koliko je utakmica za reprezentaciju odigrao Luka Modrić (stanje listopad 2026.)?" },
    options: { de: ["186", "196", "206", "216"], hr: ["186", "196", "206", "216"] },
    a: 2,
    fact: { de: "206 Länderspiele – Rekord. Debüt am 1. März 2006, dazu 97 Spiele als Kapitän.", hr: "206 nastupa – rekord. Debitirao 1. ožujka 2006., uz 97 utakmica kao kapetan." },
    source: src("Wikipedia: Croatia national football team records and statistics", WP_RECORDS),
  },
  {
    q: { de: "Gegen welches Land ist Kroatien in 9 Länderspielen ungeschlagen – mit 3 Siegen und 6 Remis?", hr: "Protiv koje je reprezentacije Hrvatska neporažena u 9 utakmica – s 3 pobjede i 6 neriješenih?" },
    options: { de: ["Deutschland", "Italien", "Frankreich", "Niederlande"], hr: ["Njemačka", "Italija", "Francuska", "Nizozemska"] },
    a: 1,
    fact: { de: `Italien: ${ita.p} Spiele, ${ita.w} Siege, ${ita.d} Remis, keine Niederlage (${ita.gf}:${ita.ga} Tore).`, hr: `Italija: ${ita.p} utakmica, ${ita.w} pobjede, ${ita.d} neriješenih, nijedan poraz (golovi ${ita.gf}:${ita.ga}).` },
    source: bilanzSrc,
  },
  {
    q: { de: "Gegen wen feierte Kroatien seinen höchsten Sieg, ein 10:0 im Juni 2016 in Rijeka?", hr: "Protiv koga je Hrvatska ostvarila najveću pobjedu, 10:0 u lipnju 2016. u Rijeci?" },
    options: { de: ["Andorra", "Malta", "San Marino", "Liechtenstein"], hr: ["Andora", "Malta", "San Marino", "Lihtenštajn"] },
    a: 2,
    fact: { de: "10:0 gegen San Marino am 4. Juni 2016 in Rijeka.", hr: "10:0 protiv San Marina 4. lipnja 2016. u Rijeci." },
    source: src("Wikipedia: Croatia national football team", WP_TEAM),
  },
  {
    q: { de: "Wie lange dauerte die Länderspielkarriere von Mario Bazina?", hr: "Koliko je trajala reprezentativna karijera Marija Bazine?" },
    options: { de: ["60 Sekunden", "5 Minuten", "eine Halbzeit", "ein ganzes Spiel"], hr: ["60 sekundi", "5 minuta", "jedno poluvrijeme", "cijelu utakmicu"] },
    a: 0,
    fact: { de: "Ein Länderspiel am 12. Februar 2002 – nach 60 Sekunden war es für ihn vorbei. Kroatischer Rekord.", hr: "Jedna utakmica 12. veljače 2002. – nakon 60 sekundi bilo je gotovo. Hrvatski rekord." },
    source: src("Wikipedia: Croatia national football team records and statistics", WP_RECORDS),
  },
  {
    q: { de: "Gegen welches Land hat Kroatien die meisten Siege gefeiert?", hr: "Protiv koje je reprezentacije Hrvatska ostvarila najviše pobjeda?" },
    options: { de: ["Malta", "Andorra", "Israel", "Lettland"], hr: ["Malta", "Andora", "Izrael", "Latvija"] },
    a: 0,
    fact: { de: `${mostWins.w} Siege in ${mostWins.p} Spielen gegen Malta (${mostWins.gf}:${mostWins.ga} Tore).`, hr: `${mostWins.w} pobjeda u ${mostWins.p} utakmica protiv Malte (golovi ${mostWins.gf}:${mostWins.ga}).` },
    source: bilanzSrc,
  },
  {
    q: { de: "EURO 1996: Welchen Titelverteidiger schlug Kroatien bei seiner ersten EM mit 3:0?", hr: "EURO 1996.: kojeg je branitelja naslova Hrvatska na svom prvom EP-u pobijedila 3:0?" },
    options: { de: ["Deutschland", "Niederlande", "Dänemark", "Frankreich"], hr: ["Njemačka", "Nizozemska", "Danska", "Francuska"] },
    a: 2,
    fact: { de: "3:0 gegen Europameister Dänemark in Sheffield – Šuker traf doppelt, dazu Boban.", hr: "3:0 protiv europskog prvaka Danske u Sheffieldu – Šuker dvaput, uz njega Boban." },
    source: src("Wikipedia: UEFA Euro 1996 Group D", "https://en.wikipedia.org/wiki/UEFA_Euro_1996_Group_D"),
  },
  {
    q: { de: "Wie viele WM-Tore hat Ivan Perišić erzielt – kroatischer Rekord?", hr: "Koliko je golova Ivan Perišić zabio na Svjetskim prvenstvima – hrvatski rekord?" },
    options: { de: ["5", "6", "7", "9"], hr: ["5", "6", "7", "9"] },
    a: 2,
    fact: { de: "7 WM-Tore – und mit 6 Vorlagen ist er auch Kroatiens bester WM-Vorbereiter.", hr: "7 golova na SP-ima – a sa 6 asistencija i najbolji hrvatski asistent na SP-ima." },
    source: src("Wikipedia: Croatia national football team records and statistics", WP_RECORDS),
  },
  {
    q: { de: "Auf welchem Platz stieg Kroatien 1994 in die FIFA-Weltrangliste ein?", hr: "Na kojem je mjestu Hrvatska 1994. ušla na FIFA ljestvicu?" },
    options: { de: ["62", "97", "125", "150"], hr: ["62.", "97.", "125.", "150."] },
    a: 2,
    fact: { de: "Platz 125 – im Januar 1999 stand Kroatien auf Platz 3, der schnellste Aufstieg der Ranglisten-Geschichte.", hr: "125. mjesto – u siječnju 1999. Hrvatska je bila treća, najbrži uspon u povijesti ljestvice." },
    source: src("Wikipedia: Croatia national football team", WP_TEAM),
  },
  {
    q: { de: "21. November 2007, Wembley: Kroatien gewinnt 3:2. Wer verpasst dadurch die EURO 2008?", hr: "21. studenoga 2007., Wembley: Hrvatska pobjeđuje 3:2. Tko zbog toga ne ide na EURO 2008.?" },
    options: { de: ["Russland", "England", "Israel", "Estland"], hr: ["Rusija", "Engleska", "Izrael", "Estonija"] },
    a: 1,
    fact: { de: "Kranjčar, Olić und Petrić trafen – Kroatien gewann die Gruppe, England war raus.", hr: "Zabili su Kranjčar, Olić i Petrić – Hrvatska je osvojila skupinu, Engleska je ispala." },
    source: src("Wikipedia: Croatia national football team results (2000–2009)", "https://en.wikipedia.org/wiki/Croatia_national_football_team_results_(2000%E2%80%932009)"),
  },
  {
    q: { de: "In der Statistik hat Kroatien gegen Brasilien noch nie gewonnen – obwohl es 2022 im WM-Viertelfinale weiterkam. Warum?", hr: "Prema statistici Hrvatska nikad nije pobijedila Brazil – iako je 2022. prošla u četvrtfinalu SP-a. Zašto?" },
    options: {
      de: ["Das Spiel wurde annulliert", "Elfmeterschießen zählt als Unentschieden", "Es war kein offizielles Spiel", "Brasilien gewann am grünen Tisch"],
      hr: ["Utakmica je poništena", "Raspucavanje se računa kao neriješeno", "Nije bila službena utakmica", "Brazil je pobijedio za zelenim stolom"],
    },
    a: 1,
    fact: { de: `1:1 n. V., 4:2 im Elfmeterschießen – statistisch ein Remis. Bilanz gegen Brasilien: ${bra.p} Spiele, ${bra.w} Siege, ${bra.d} Remis, ${bra.l} Niederlagen.`, hr: `1:1 nakon produžetaka, 4:2 na jedanaesterce – statistički neriješeno. Bilanca protiv Brazila: ${bra.p} utakmica, ${bra.w} pobjeda, ${bra.d} neriješene, ${bra.l} poraza.` },
    source: bilanzSrc,
  },
];
