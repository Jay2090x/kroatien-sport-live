import type { Lang } from "../i18n";
import type { FormPoint } from "../sources/players";

/** Texte für Fan-Paket (Spielseiten, Frauen/U21, Quiz, Formkurve) – DE | HR. */
const de = {
  clips: {
    title: "Spieler-Clips / Traumtore",
    note: "Tore und starke Szenen kroatischer Nationalspieler aus den letzten 21 Tagen – nur von offiziellen Kanälen (Vereine, Ligen, UEFA, HNS, Sender). Video lädt erst nach Klick (youtube-nocookie.com).",
    load: "Clip laden (YouTube)",
    own: "Clip",
    on: "auf YouTube",
    channel: "Kanal",
    more: "Alle Spieler →",
  },
  nav: { women: "Frauen", u21: "U21", quiz: "Quiz", matches: "Spiele" },
  form: {
    title: "Form (letzte 5 Pflichtspiele)",
    summary: (known: number, all: number, min: number, g: number, a: number) =>
      known === 0
        ? "keine Spielerdaten"
        : `${min} Min., ${g} Tore, ${a} Vorlagen${known < all ? ` (Daten für ${known} von ${all} Spielen)` : ""}`,
    point: (f: FormPoint, date: string) =>
      `${date} ${f.label}: ${
        f.minutes == null
          ? "keine Spielerdaten"
          : f.played === false
            ? "nicht eingesetzt"
            : `${f.minutes ?? "?"} Min., ${f.goals ?? 0} Tore, ${f.assists ?? 0} Vorlagen${f.ownGoalMinutes.length ? `, Eigentor ${f.ownGoalMinutes.join(", ")}` : ""}${f.penMissMinutes.length ? `, Elfmeter verschossen ${f.penMissMinutes.join(", ")}` : ""}`
      }`,
    ownGoal: "Eigentor",
    penMiss: "Elfmeter verschossen/gehalten",
    red: "Rote Karte",
    legend: "✖ = Eigentor oder verschossener Elfmeter · Balken = Spielminuten (rot: Kroatien, blau: Verein, grau „?“: keine Daten) · ● Tor · ○ Vorlage · Noten (Ratings) gibt es in keiner freien Quelle.",
  },
  match: {
    metaTitle: (h: string, a: string) => `${h} – ${a}: Spielbericht`,
    metaDesc: (h: string, a: string, when: string) =>
      `${h} gegen ${a} (${when}): Aufstellungen, Tore inkl. Eigentore, verschossene Elfmeter, Karten, Wechsel und offizieller Highlight-Clip.`,
    back: "← Vatreni",
    list: "Alle Vatreni-Spiele",
    listIntro: "Spielberichte der kroatischen Nationalmannschaft – letzte Ergebnisse und angesetzte Spiele.",
    upcoming: "Angesetzt",
    results: "Ergebnisse",
    report: "Spielbericht",
    preview: "Vorschau",
    summary: "Auf einen Blick",
    scorers: "Tore",
    ownGoalShort: "ET",
    penShort: "11 m",
    missedPens: "Verschossene Elfmeter",
    cards: "Karten",
    subs: "Wechsel",
    none: "keine",
    clip: "Offizieller Highlight-Clip",
    clipLoad: "Video laden (YouTube)",
    clipNote: "Clip vom offiziellen HNS-Kanal. YouTube wird erst nach Klick geladen (youtube-nocookie.com).",
    noClip: "Für dieses Spiel gibt es (noch) keinen offiziellen Highlight-Clip im HNS-Kanal-Feed.",
    notFound: "Spiel nicht gefunden",
    what: "Spielbericht",
    pre: "Das Spiel hat noch nicht begonnen. Die Aufstellung erscheint meist ca. 1 Std. vor Anpfiff.",
    toLive: "Zum Live-Ticker",
  },
  team: {
    frauen: {
      metaTitle: "Frauen-Nationalteam Kroatien",
      metaDesc: "Kroatiens Frauen-Nationalmannschaft: Spiele, Ergebnisse, Qualifikationsgruppe und aktueller Kader.",
      h1: "Frauen-Nationalteam",
      intro: "Spiele, Ergebnisse, Tabelle und Kader der kroatischen Frauen-Nationalmannschaft (Hrvatska ženska nogometna reprezentacija).",
    },
    u21: {
      metaTitle: "U21 Kroatien",
      metaDesc: "Kroatiens U21: Spiele, Ergebnisse, EM-Qualifikationsgruppe und aktueller Kader.",
      h1: "U21-Nationalteam",
      intro: "Spiele, Ergebnisse, Tabelle und Kader der kroatischen U21 (Mlada reprezentacija).",
    },
    next: "Nächste Spiele",
    noNext: "Derzeit ist kein Spiel angesetzt bzw. von der Quelle noch nicht veröffentlicht.",
    results: "Letzte Ergebnisse",
    noResults: "Keine Ergebnisse in den letzten 12 Monaten gefunden.",
    table: "Tabelle",
    noTable: "Für den aktuellen Wettbewerb ist keine Tabelle verfügbar.",
    squad: "Aktueller Kader",
    noSquad: "Kader derzeit nicht abrufbar.",
    squadSource: "Quelle: Wikipedia (en), dort belegt mit HNS-Kaderliste",
    caps: "Sp.",
    goals: "Tore",
    club: "Verein",
    pos: { GK: "Tor", DF: "Abwehr", MF: "Mittelfeld", FW: "Angriff" } as Record<string, string>,
    what: "Spieldaten",
    notes: [
      "Spiele, Ergebnisse, Torschützinnen/Torschützen, Karten und Tabelle: ESPN (öffentliche Wettbewerbsdaten).",
      "Kader: englische Wikipedia (Gemeinschaftsprojekt, dort mit der HNS-Kaderliste belegt) – kann der offiziellen Liste hinterherhinken.",
      "Freundschaftsspiele fehlen, wenn ESPN sie nicht führt. Es wird nichts ergänzt oder geschätzt.",
    ],
    sb: { T: "Sp", W: "S", D: "U", L: "N", G: "Tore", P: "Pkt" },
    ownGoal: "Eigentor",
    penMiss: "Elfmeter verschossen",
  },
  quiz: {
    metaTitle: "Vatreni-Quiz",
    metaDesc: "Wie gut kennst du die Vatreni? 26 Fragen zur Geschichte der kroatischen Nationalmannschaft – jede mit Quelle.",
    h1: "Vatreni-Quiz",
    intro: "26 Fragen zur Geschichte der kroatischen Nationalmannschaft. Jede Antwort ist mit einer Quelle belegt. Läuft komplett im Browser – nichts wird gespeichert oder übertragen.",
    start: "Quiz starten",
    question: (i: number, n: number) => `Frage ${i} von ${n}`,
    right: "Richtig!",
    wrong: "Leider falsch.",
    answer: "Richtige Antwort",
    source: "Quelle",
    next: "Nächste Frage",
    result: (r: number, n: number) => `Du hast ${r} von ${n} Fragen richtig beantwortet.`,
    again: "Nochmal spielen",
    verdict: (r: number, n: number): string =>
      r / n >= 0.9 ? "Vatreni-Legende! 🔥" : r / n >= 0.7 ? "Echter Fan! 🇭🇷" : r / n >= 0.4 ? "Solide – da geht noch was." : "Zeit für die Geschichtsstunde 😉",
    score: "Punkte",
  },
};

const hr: typeof de = {
  clips: {
    title: "Golovi i potezi igrača",
    note: "Golovi i najbolji potezi hrvatskih reprezentativaca iz zadnjih 21 dana – samo sa službenih kanala (klubovi, lige, UEFA, HNS, televizije). Video se učitava tek nakon klika (youtube-nocookie.com).",
    load: "Učitaj isječak (YouTube)",
    own: "Isječak",
    on: "na YouTubeu",
    channel: "Kanal",
    more: "Svi igrači →",
  },
  nav: { women: "Žene", u21: "U21", quiz: "Kviz", matches: "Utakmice" },
  form: {
    title: "Forma (zadnjih 5 službenih utakmica)",
    summary: (known, all, min, g, a) =>
      known === 0
        ? "nema podataka o igraču"
        : `${min} min., ${g} gol., ${a} asist.${known < all ? ` (podaci za ${known} od ${all} utakmica)` : ""}`,
    point: (f, date) =>
      `${date} ${f.label}: ${
        f.minutes == null
          ? "nema podataka"
          : f.played === false
            ? "nije igrao"
            : `${f.minutes ?? "?"} min., ${f.goals ?? 0} gol., ${f.assists ?? 0} asist.${f.ownGoalMinutes.length ? `, autogol ${f.ownGoalMinutes.join(", ")}` : ""}${f.penMissMinutes.length ? `, promašen jedanaesterac ${f.penMissMinutes.join(", ")}` : ""}`
      }`,
    ownGoal: "Autogol",
    penMiss: "Promašen/obranjen jedanaesterac",
    red: "Crveni karton",
    legend: "✖ = autogol ili promašen jedanaesterac · Stupci = odigrane minute (crveno: Hrvatska, plavo: klub, sivo „?“: nema podataka) · ● gol · ○ asistencija · Ocjene (ratings) ne postoje ni u jednom besplatnom izvoru.",
  },
  match: {
    metaTitle: (h, a) => `${h} – ${a}: izvještaj`,
    metaDesc: (h, a, when) =>
      `${h} – ${a} (${when}): sastavi, golovi uklj. autogolove, promašeni jedanaesterci, kartoni, izmjene i službeni sažetak.`,
    back: "← Vatreni",
    list: "Sve utakmice Vatrenih",
    listIntro: "Izvještaji utakmica hrvatske reprezentacije – zadnji rezultati i zakazane utakmice.",
    upcoming: "Zakazano",
    results: "Rezultati",
    report: "Izvještaj",
    preview: "Najava",
    summary: "Ukratko",
    scorers: "Golovi",
    ownGoalShort: "AG",
    penShort: "11 m",
    missedPens: "Promašeni jedanaesterci",
    cards: "Kartoni",
    subs: "Izmjene",
    none: "nema",
    clip: "Službeni sažetak",
    clipLoad: "Učitaj video (YouTube)",
    clipNote: "Video sa službenog HNS kanala. YouTube se učitava tek nakon klika (youtube-nocookie.com).",
    noClip: "Za ovu utakmicu (još) nema službenog sažetka u feedu HNS kanala.",
    notFound: "Utakmica nije pronađena",
    what: "Izvještaj",
    pre: "Utakmica još nije počela. Sastav se obično objavljuje oko 1 sat prije početka.",
    toLive: "Na live ticker",
  },
  team: {
    frauen: {
      metaTitle: "Ženska reprezentacija Hrvatske",
      metaDesc: "Hrvatska ženska nogometna reprezentacija: utakmice, rezultati, kvalifikacijska skupina i aktualni popis.",
      h1: "Ženska reprezentacija",
      intro: "Utakmice, rezultati, tablica i popis hrvatske ženske nogometne reprezentacije.",
    },
    u21: {
      metaTitle: "U21 Hrvatska",
      metaDesc: "Hrvatska U21: utakmice, rezultati, kvalifikacijska skupina za EP i aktualni popis.",
      h1: "U21 reprezentacija",
      intro: "Utakmice, rezultati, tablica i popis hrvatske mlade reprezentacije (U21).",
    },
    next: "Sljedeće utakmice",
    noNext: "Trenutno nema zakazane utakmice ili je izvor još nije objavio.",
    results: "Zadnji rezultati",
    noResults: "Nema rezultata u zadnjih 12 mjeseci.",
    table: "Tablica",
    noTable: "Za aktualno natjecanje tablica nije dostupna.",
    squad: "Aktualni popis",
    noSquad: "Popis trenutno nije dostupan.",
    squadSource: "Izvor: Wikipedia (en), tamo potkrijepljeno popisom HNS-a",
    caps: "Nast.",
    goals: "Gol.",
    club: "Klub",
    pos: { GK: "Vratari", DF: "Obrana", MF: "Vezni red", FW: "Napad" },
    what: "Podaci o utakmicama",
    notes: [
      "Utakmice, rezultati, strijelci, kartoni i tablica: ESPN (javni podaci o natjecanjima).",
      "Popis: engleska Wikipedia (zajednički projekt, potkrijepljeno popisom HNS-a) – može kasniti za službenim popisom.",
      "Prijateljske utakmice nedostaju ako ih ESPN ne vodi. Ništa se ne nadopunjuje niti procjenjuje.",
    ],
    sb: { T: "UT", W: "P", D: "N", L: "I", G: "Gol.", P: "Bod." },
    ownGoal: "Autogol",
    penMiss: "Promašen jedanaesterac",
  },
  quiz: {
    metaTitle: "Kviz o Vatrenima",
    metaDesc: "Koliko dobro poznaješ Vatrene? 26 pitanja o povijesti hrvatske reprezentacije – svako s izvorom.",
    h1: "Kviz o Vatrenima",
    intro: "26 pitanja o povijesti hrvatske nogometne reprezentacije. Svaki odgovor potkrijepljen je izvorom. Radi potpuno u pregledniku – ništa se ne sprema niti šalje.",
    start: "Započni kviz",
    question: (i, n) => `Pitanje ${i} od ${n}`,
    right: "Točno!",
    wrong: "Nažalost, netočno.",
    answer: "Točan odgovor",
    source: "Izvor",
    next: "Sljedeće pitanje",
    result: (r, n) => `Točno si odgovorio/la na ${r} od ${n} pitanja.`,
    again: "Igraj ponovno",
    verdict: (r, n) =>
      r / n >= 0.9 ? "Legenda Vatrenih! 🔥" : r / n >= 0.7 ? "Pravi navijač! 🇭🇷" : r / n >= 0.4 ? "Solidno – može i bolje." : "Vrijeme za sat povijesti 😉",
    score: "Bodovi",
  },
};

export type X2 = typeof de;
export function x2(lang: Lang): X2 {
  return lang === "hr" ? hr : de;
}
