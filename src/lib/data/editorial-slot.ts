/**
 * Manueller redaktioneller Tages-Slot (3–6 Sätze).
 * Pro Datum überschreibbar; sonst rotierender Qualitäts-Fallback.
 * Kein RSS, kein Fixture-Spam – eigener Text, rechtlich klar.
 */

import type { NewsArticle, NewsLocaleText } from "@/lib/data/news";

const IMG =
  "https://r2.thesportsdb.com/images/media/team/badge/vvtsyu1455465317.png";

type SlotInput = {
  title: NewsLocaleText;
  summary: NewsLocaleText;
  body: NewsLocaleText;
  category?: NewsArticle["category"];
  featured?: boolean;
};

/** Feste Tage: hier manuell pflegen (YYYY-MM-DD) */
export const EDITORIAL_SLOT_BY_DATE: Record<string, SlotInput> = {
  // Beispiel – bei Bedarf erweitern
  // "2026-08-02": { title: {...}, summary: {...}, body: {...} },
};

/** 7 rotierende Qualitäts-Slots (Wochentag) */
const ROTATING: SlotInput[] = [
  {
    featured: true,
    category: "vatreni",
    title: {
      de: "Redaktion: Was heute zählt – Vatreni, Clubs, Transparenz",
      en: "Editorial: What matters today – Vatreni, clubs, transparency",
      hr: "Uredništvo: Što danas broji – Vatreni, klubovi, transparentnost",
    },
    summary: {
      de: "Kurzer redaktioneller Überblick: Termine im Live-Board, Headlines nur mit Original-Link, Status ohne Spekulation.",
      en: "Short editorial overview: fixtures on the live board, headlines only with original links, status without guessing.",
      hr: "Kratki urednički pregled: termini na live boardu, naslovi samo s originalnim linkom, status bez nagađanja.",
    },
    body: {
      de: "Heute im Fokus: Spiele kroatischer Profis und der Vatreni findest du im Live-Board – nicht als künstliche News-Liste.\n\nExterne Headlines verlinken wir nur mit Quelle. Wir hosten keine Volltexte Dritter und spekulieren nicht über Kader oder TV-Rechte.\n\nFür den Alltag: Favoriten setzen, „Meine Woche“ nutzen, Status nur melden wenn du eine Quelle hast. So bleibt KSL nützlich und rechtlich sauber.",
      en: "Focus today: fixtures of Croatian pros and the Vatreni are on the live board – not as fake news spam.\n\nExternal headlines always link to the source. We do not host third-party full articles and do not guess squads or TV rights.\n\nDaily use: star favorites, use “My week”, only suggest status changes with a source. That keeps KSL useful and legally careful.",
      hr: "Danas u fokusu: utakmice hrvatskih profesionalaca i Vatrenih na live boardu – ne kao lažni news spam.\n\nVanjski naslovi uvijek vode na izvor. Ne hostamo tuđe full tekstove i ne nagađamo sastave ni TV prava.\n\nZa svakodnevicu: označi omiljene, koristi „Moj tjedan“, status predloži samo s izvorom. Tako KSL ostaje koristan i pravno oprezan.",
    },
  },
  {
    featured: true,
    category: "clubs",
    title: {
      de: "Redaktion: Club-Form zählt – Tracker statt Gerücht",
      en: "Editorial: Club form matters – tracker over rumours",
      hr: "Uredništvo: Klupska forma broji – tracker umjesto glasina",
    },
    summary: {
      de: "Zwischen Länderspielen entscheiden Club-Minuten. Der Tracker zeigt Club, Termin und ehrlichen Status mit Quelle.",
      en: "Between internationals, club minutes decide. The tracker shows club, fixtures and honest status with sources.",
      hr: "Između reprezentacije broje klupske minute. Tracker pokazuje klub, termine i iskren status s izvorom.",
    },
    body: {
      de: "Zwischen den FIFA-Fenstern zählt die Club-Form: Wer spielt regelmäßig, wer pausiert, wer wechselte den Verein.\n\nIm Tracker siehst du dieselben Felder für alle Spieler – Club, nächstes Spiel, Form aus bekannten Ergebnissen. Fitness markieren wir nur mit redaktioneller Quelle oder als „im Spielplan gelistet“.\n\nHeadlines von Index, HRT und internationalen Medien öffnen wir nur als Link zur Originalquelle.",
      en: "Between FIFA windows, club form counts: who starts regularly, who is off, who changed clubs.\n\nThe tracker uses the same fields for every player – club, next match, form from known results. Fitness only with an editorial source or as “listed on fixtures”.\n\nHeadlines from Index, HRT and international media open only as links to the original source.",
      hr: "Između FIFA prozora broji klupska forma: tko redovito igra, tko pauzira, tko je promijenio klub.\n\nTracker ima ista polja za sve igrače – klub, iduća utakmica, forma iz poznatih rezultata. Fitness samo s uredničkim izvorom ili kao „na rasporedu“.\n\nNaslove s Indexa, HRT-a i međunarodnih medija otvaramo samo kao link na izvor.",
    },
  },
  {
    featured: true,
    category: "vatreni",
    title: {
      de: "Redaktion: Nationalteam – Kalender ja, Kader-Spekulation nein",
      en: "Editorial: National team – calendar yes, squad speculation no",
      hr: "Uredništvo: Reprezentacija – kalendar da, spekulacija o sastavu ne",
    },
    summary: {
      de: "Länderspiel-Termine im Fokus. Nominierungen erst wenn der Verband oder belastbare Quellen sprechen.",
      en: "International dates in focus. Squads only when the association or solid sources speak.",
      hr: "Termini reprezentacije u fokusu. Sastavi tek kad govore savez ili pouzdani izvori.",
    },
    body: {
      de: "Die Nationalteam-Sektion zeigt die nächsten Länderspiele kompakt – ohne den Live-Board-Kalender zu duplizieren.\n\nWir listen keine spekulativen Aufstellungen. Kader und Verletzungen nur mit Quelle und Datum.\n\nTV-Hinweise nur bei redaktionell bestätigter Live-Übertragung (z. B. HRT/Arena/Sportklub). Kein VPN, kein Sky/DAZN-Affiliate im Launch.",
      en: "The national-team section shows the next internationals compactly – without duplicating the live-board calendar.\n\nWe do not list speculative line-ups. Squads and injuries only with source and date.\n\nTV tips only for editorially confirmed live broadcasts (e.g. HRT/Arena/Sportklub). No VPN, no Sky/DAZN affiliate at launch.",
      hr: "Rubrika reprezentacije prikazuje iduće utakmice kompaktno – bez dupliciranja live board kalendara.\n\nNe navodimo spekulativne sastave. Kadrovi i ozljede samo s izvorom i datumom.\n\nTV savjeti samo za urednički potvrđen live prijenos (npr. HRT/Arena/Sportklub). Bez VPN-a, bez Sky/DAZN affiliatea na startu.",
    },
  },
  {
    featured: true,
    category: "hnl",
    title: {
      de: "Redaktion: HNL & Europa – warum die Liga für die Vatreni zählt",
      en: "Editorial: HNL & Europe – why the league matters for the Vatreni",
      hr: "Uredništvo: HNL i Europa – zašto liga broji za Vatrene",
    },
    summary: {
      de: "Dinamo, Hajduk, Rijeka & Co. liefern Minuten für A- und U-Teams. Termine und Kroaten im Board.",
      en: "Dinamo, Hajduk, Rijeka & co. provide minutes for senior and youth setups. Fixtures and Croatians on the board.",
      hr: "Dinamo, Hajduk, Rijeka i ostali daju minute A i mlađim sastavima. Termini i Hrvati na boardu.",
    },
    body: {
      de: "Die HNL und die europäischen Qualifikationsspiele der kroatischen Clubs sind relevant für Form und Perspektive junger Spieler.\n\nIm Live-Board filterst du standardmäßig Fußball und siehst bestätigte TV-Hinweise nur wenn sie redaktionell gesichert sind.\n\nNews aus kroatischen Medien (Index, HRT, …) erscheinen als externe Headlines mit Original-Link – ohne Volltext-Kopie.",
      en: "The HNL and Croatian clubs’ European qualifiers matter for form and pathways for young players.\n\nOn the live board football is the default filter; confirmed TV tips appear only when editorially secured.\n\nNews from Croatian media (Index, HRT, …) appear as external headlines with original links – no full-text copies.",
      hr: "HNL i europske kvalifikacije hrvatskih klubova broje za formu i perspektivu mladih igrača.\n\nNa live boardu je nogomet standardni filter; potvrđeni TV savjeti samo kad su urednički sigurni.\n\nVijesti iz hrvatskih medija (Index, HRT, …) dolaze kao vanjski naslovi s originalnim linkom – bez kopiranja full teksta.",
    },
  },
  {
    featured: true,
    category: "transfer",
    title: {
      de: "Redaktion: Transfers nur mit Beleg – Gerüchte bleiben draußen",
      en: "Editorial: Transfers only with proof – rumours stay out",
      hr: "Uredništvo: Transferi samo s dokazom – glasine ostaju vani",
    },
    summary: {
      de: "Vertragsverlängerungen und Wechsel: wir verlinken belastbare Meldungen, erfinden keine Deals.",
      en: "Contract extensions and moves: we link solid reports, we do not invent deals.",
      hr: "Produženja ugovora i transferi: linkamo pouzdane izvještaje, ne izmišljamo poslove.",
    },
    body: {
      de: "Transfer- und Vertragsnews sind oft spekulativ. Wir priorisieren Meldungen mit klarer Quelle und öffnen den Originalartikel.\n\nIm Tracker bleibt der Club-Stand, sobald unsere Datenquellen ihn abbilden. Bis dahin: ehrliches „unklar“ statt Fake-Sicherheit.\n\nRechtlich: Aggregation öffentlicher Headlines, keine Übernahme von Volltexten, keine Affiliate-Links im Launch.",
      en: "Transfer and contract news is often speculative. We prioritise reports with a clear source and open the original article.\n\nThe tracker keeps the club as soon as our data sources show it. Until then: honest “unclear” instead of fake certainty.\n\nLegally: aggregation of public headlines, no full-text copying, no affiliate links at launch.",
      hr: "Transfer i ugovorne vijesti često su spekulativne. Prioritet dajemo izvještajima s jasnim izvorom i otvaramo original.\n\nTracker drži klub čim ga pokažu naši izvori podataka. Do tada: iskreno „nepoznato“ umjesto lažne sigurnosti.\n\nPravno: agregacija javnih naslova, bez kopiranja full teksta, bez affiliate linkova na startu.",
    },
  },
  {
    featured: true,
    category: "preview",
    title: {
      de: "Redaktion: So nutzt du KSL in 60 Sekunden",
      en: "Editorial: How to use KSL in 60 seconds",
      hr: "Uredništvo: Kako koristiti KSL u 60 sekundi",
    },
    summary: {
      de: "Board → Meine Woche → Tagesbrief → Tracker. Favoriten speichern, Kalender exportieren, Original-News öffnen.",
      en: "Board → My week → daily brief → tracker. Save favorites, export calendar, open original news.",
      hr: "Board → Moj tjedan → dnevni brief → tracker. Spremi omiljene, izvezi kalendar, otvori originalne vijesti.",
    },
    body: {
      de: "1) Live-Board: Fußball standard, Heute/48h/7 Tage.\n2) Meine Woche: Favoriten und .ics-Export.\n3) Heute für dich + Tagesbrief: Überblick ohne Spam.\n4) Tracker: vergleichbare Karten, Status mit Quelle.\n\nAlles ohne illegale Streams, ohne VPN-Verkauf und ohne personenbezogene Impressums-Daten im Klartext.",
      en: "1) Live board: football default, Today/48h/7 days.\n2) My week: favorites and .ics export.\n3) Today for you + daily brief: overview without spam.\n4) Tracker: comparable cards, status with source.\n\nAll without illegal streams, VPN sales or personal imprint data in plain text.",
      hr: "1) Live board: nogomet standard, Danas/48h/7 dana.\n2) Moj tjedan: omiljeni i .ics izvoz.\n3) Danas za tebe + dnevni brief: pregled bez spama.\n4) Tracker: usporedive kartice, status s izvorom.\n\nSve bez ilegalnih streamova, VPN prodaje i osobnih impressum podataka u plain textu.",
    },
  },
  {
    featured: true,
    category: "vatreni",
    title: {
      de: "Redaktion: Vertrauen vor Vollständigkeit",
      en: "Editorial: Trust over completeness",
      hr: "Uredništvo: Povjerenje ispred potpunosti",
    },
    summary: {
      de: "Lieber leeres TV-Feld als falscher Sender. Lieber „unklar“ als falsches Fit. Das ist der Produktstandard.",
      en: "Empty TV beats a wrong channel. “Unclear” beats a fake fit badge. That is the product standard.",
      hr: "Bolje prazno TV polje nego krivi kanal. Bolje „nepoznato“ nego lažni fit. To je standard proizvoda.",
    },
    body: {
      de: "Viele Sport-Apps füllen Lücken mit Raten. Wir nicht: bestätigte TV-Rechte, Spielplan-Signale und redaktionelle Overrides sind getrennt.\n\nFehler kannst du als Status-Vorschlag melden – du änderst den Systemstatus nicht selbst.\n\nSo bleibt der Mehrwert: schnell, mobil, ehrlich – und rechtlich defensiv.",
      en: "Many sports apps fill gaps by guessing. We do not: confirmed TV rights, fixture signals and editorial overrides stay separate.\n\nYou can suggest a status correction – you cannot change the system status yourself.\n\nThat is the value: fast, mobile, honest – and legally defensive.",
      hr: "Mnoge sportske appove popunjavaju praznine nagađanjem. Mi ne: potvrđena TV prava, signali rasporeda i urednički overridei ostaju odvojeni.\n\nMožeš predložiti ispravku statusa – ne mijenjaš sustav sam.\n\nTo je vrijednost: brzo, mobilno, iskreno – i pravno oprezno.",
    },
  },
];

function todayIso(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Liefert den redaktionellen Slot für „heute“.
 */
export function getEditorialSlot(now = new Date()): NewsArticle {
  const date = todayIso(now);
  const fixed = EDITORIAL_SLOT_BY_DATE[date];
  const slot =
    fixed ?? ROTATING[((now.getUTCDay() % ROTATING.length) + ROTATING.length) % ROTATING.length]!;

  return {
    id: `editorial-slot-${date}`,
    date,
    featured: slot.featured !== false,
    category: slot.category ?? "vatreni",
    tag: {
      de: "Redaktion",
      en: "Editorial",
      hr: "Uredništvo",
    },
    title: slot.title,
    summary: slot.summary,
    body: slot.body,
    image: {
      url: IMG,
      alt: {
        de: "Redaktioneller Slot",
        en: "Editorial slot",
        hr: "Urednički slot",
      },
    },
    isExternal: false,
  };
}
