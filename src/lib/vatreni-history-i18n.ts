import type { Lang } from "./i18n";

/**
 * Turnierbilanz und Rekorde der kroatischen Nationalmannschaft.
 * Alle Zahlen aus der englischen Wikipedia (Daten laut HNS), geprüft am 28.10.2026:
 * – Croatia national football team (Turniertabellen, Einzelstatistik "updated 6 October 2026")
 * – Croatia national football team records and statistics (Einzelrekorde)
 * Unentschieden schließen Spiele ein, die im Elfmeterschießen entschieden wurden.
 */
export const WP_TEAM = "https://en.wikipedia.org/wiki/Croatia_national_football_team";
export const WP_RECORDS = "https://en.wikipedia.org/wiki/Croatia_national_football_team_records_and_statistics";
export const STATS_ASOF = "2026-10-06";

type Round = "final" | "third" | "qf" | "r16" | "r32" | "group" | "dnq";
export interface Tourney { year: number; host: { de: string; hr: string }; round: Round; p?: number; w?: number; d?: number; l?: number; gf?: number; ga?: number }

export const WORLD_CUPS: Tourney[] = [
  { year: 1998, host: { de: "Frankreich", hr: "Francuska" }, round: "third", p: 7, w: 5, d: 0, l: 2, gf: 11, ga: 5 },
  { year: 2002, host: { de: "Südkorea/Japan", hr: "J. Koreja/Japan" }, round: "group", p: 3, w: 1, d: 0, l: 2, gf: 2, ga: 3 },
  { year: 2006, host: { de: "Deutschland", hr: "Njemačka" }, round: "group", p: 3, w: 0, d: 2, l: 1, gf: 2, ga: 3 },
  { year: 2010, host: { de: "Südafrika", hr: "Južna Afrika" }, round: "dnq" },
  { year: 2014, host: { de: "Brasilien", hr: "Brazil" }, round: "group", p: 3, w: 1, d: 0, l: 2, gf: 6, ga: 6 },
  { year: 2018, host: { de: "Russland", hr: "Rusija" }, round: "final", p: 7, w: 4, d: 2, l: 1, gf: 14, ga: 9 },
  { year: 2022, host: { de: "Katar", hr: "Katar" }, round: "third", p: 7, w: 2, d: 4, l: 1, gf: 8, ga: 7 },
  { year: 2026, host: { de: "USA/Kanada/Mexiko", hr: "SAD/Kanada/Meksiko" }, round: "r32", p: 4, w: 2, d: 0, l: 2, gf: 6, ga: 7 },
];

export const EUROS: Tourney[] = [
  { year: 1996, host: { de: "England", hr: "Engleska" }, round: "qf", p: 4, w: 2, d: 0, l: 2, gf: 5, ga: 5 },
  { year: 2000, host: { de: "Niederlande/Belgien", hr: "Nizozemska/Belgija" }, round: "dnq" },
  { year: 2004, host: { de: "Portugal", hr: "Portugal" }, round: "group", p: 3, w: 0, d: 2, l: 1, gf: 4, ga: 6 },
  { year: 2008, host: { de: "Österreich/Schweiz", hr: "Austrija/Švicarska" }, round: "qf", p: 4, w: 3, d: 1, l: 0, gf: 5, ga: 2 },
  { year: 2012, host: { de: "Polen/Ukraine", hr: "Poljska/Ukrajina" }, round: "group", p: 3, w: 1, d: 1, l: 1, gf: 4, ga: 3 },
  { year: 2016, host: { de: "Frankreich", hr: "Francuska" }, round: "r16", p: 4, w: 2, d: 1, l: 1, gf: 5, ga: 4 },
  { year: 2020, host: { de: "Europa (2021)", hr: "Europa (2021.)" }, round: "r16", p: 4, w: 1, d: 1, l: 2, gf: 7, ga: 8 },
  { year: 2024, host: { de: "Deutschland", hr: "Njemačka" }, round: "group", p: 3, w: 0, d: 2, l: 1, gf: 3, ga: 6 },
];

/** Top 10 Länderspiele / Tore (Stand 6.10.2026). active = noch aktiv. */
export const CAPS = [
  { name: "Luka Modrić", caps: 206, goals: 30, years: "2006–", active: true },
  { name: "Ivan Perišić", caps: 162, goals: 40, years: "2011–", active: true },
  { name: "Darijo Srna", caps: 134, goals: 22, years: "2002–2016" },
  { name: "Mateo Kovačić", caps: 121, goals: 5, years: "2013–", active: true },
  { name: "Andrej Kramarić", caps: 119, goals: 36, years: "2014–", active: true },
  { name: "Stipe Pletikosa", caps: 114, goals: 0, years: "1999–2014" },
  { name: "Ivan Rakitić", caps: 106, goals: 15, years: "2007–2019" },
  { name: "Josip Šimunić", caps: 105, goals: 3, years: "2001–2013" },
  { name: "Domagoj Vida", caps: 105, goals: 4, years: "2010–2024" },
  { name: "Ivica Olić", caps: 104, goals: 20, years: "2002–2015" },
];
export const SCORERS = [
  { name: "Davor Šuker", goals: 45, caps: 68, years: "1991–2002" },
  { name: "Ivan Perišić", goals: 40, caps: 162, years: "2011–", active: true },
  { name: "Andrej Kramarić", goals: 36, caps: 119, years: "2014–", active: true },
  { name: "Mario Mandžukić", goals: 33, caps: 89, years: "2007–2018" },
  { name: "Luka Modrić", goals: 30, caps: 206, years: "2006–", active: true },
  { name: "Eduardo", goals: 29, caps: 64, years: "2004–2014" },
  { name: "Darijo Srna", goals: 22, caps: 134, years: "2002–2016" },
  { name: "Ivica Olić", goals: 20, caps: 104, years: "2002–2015" },
  { name: "Niko Kranjčar", goals: 16, caps: 81, years: "2004–2013" },
  { name: "Nikola Kalinić", goals: 15, caps: 42, years: "2008–2018" },
  { name: "Goran Vlaović", goals: 15, caps: 51, years: "1992–2002" },
  { name: "Ivan Rakitić", goals: 15, caps: 106, years: "2007–2019" },
];

interface Tile { big: string; label: string; text: string; url: string }

const DE = {
  nav: "Momente",
  navZ: "In Zahlen",
  m: {
    metaTitle: "Vatreni-Momente – Kroatiens größte Spiele mit Videos",
    metaDesc: "Von EURO 1996 über WM-Bronze 1998 und das WM-Finale 2018 bis Bronze 2022: Kroatiens legendäre Spiele mit geprüften Fakten, offiziellen FIFA-Videos und der kompletten Turnierbilanz.",
    h1: "Vatreni-Momente",
    intro: "Ein Land mit knapp vier Millionen Einwohnern, drei WM-Medaillen und einem WM-Finale. Hier sind die Spiele, über die Kroatien heute noch spricht – chronologisch, mit offiziellen Videos der FIFA und der kompletten Turnierbilanz.",
    medals: "Medaillen",
    medalList: [
      { e: "🥉", t: "WM 1998", s: "Bronze bei der ersten WM-Teilnahme" },
      { e: "🥈", t: "WM 2018", s: "Vizeweltmeister" },
      { e: "🥉", t: "WM 2022", s: "Bronze in Katar" },
      { e: "🥈", t: "Nations League 2023", s: "Finale gegen Spanien" },
    ],
    timeline: "Die legendären Spiele",
    video: "Offizielles Video (FIFA) laden",
    clipLink: (by: string) => `▶ Video auf der offiziellen ${by}-Seite`,
    source: "Quelle",
    videoNote: "Videos stammen vom offiziellen YouTube-Kanal der FIFA und werden erst nach Klick von youtube-nocookie.com geladen. UEFA-Videos öffnen die Originalseite.",
    record: "Turnierbilanz",
    wc: "Weltmeisterschaften",
    euro: "Europameisterschaften",
    cols: { year: "Jahr", host: "Gastgeber", round: "Ergebnis", p: "Sp", w: "S", d: "U", l: "N", goals: "Tore" },
    rounds: { final: "🥈 Finale (2.)", third: "🥉 Platz 3", qf: "Viertelfinale", r16: "Achtelfinale", r32: "Sechzehntelfinale", group: "Gruppenphase", dnq: "nicht qualifiziert" } as Record<Round, string>,
    recordNote: "Unentschieden schließen im Elfmeterschießen entschiedene Spiele ein. Vor 1996 spielte Kroatien als Teil Jugoslawiens. Quelle: Wikipedia (Daten laut HNS), geprüft am 28.10.2026.",
    more: "Mehr Rekorde: Kroatien in Zahlen →",
  },
  z: {
    metaTitle: "Kroatien in Zahlen – Rekordspieler, Rekordtorschützen, Rekorde",
    metaDesc: "Modrić mit 206 Länderspielen, Šuker mit 45 Toren, Platz 125 auf 3 der Weltrangliste: die Rekorde der Vatreni – geprüft und mit Quelle.",
    h1: "Kroatien in Zahlen",
    intro: "Rekordnationalspieler, Rekordtorschützen und Bestmarken der Vatreni – jede Zahl mit Quelle.",
    asOf: "Stand: 6. Oktober 2026 (nach Kroatien – Spanien)",
    tilesH: "Die großen Zahlen",
    tiles: [
      { big: "206", label: "Länderspiele", text: "Luka Modrić ist Kroatiens Rekordnationalspieler – Debüt am 1. März 2006, 97 Spiele als Kapitän.", url: WP_RECORDS },
      { big: "45", label: "Tore", text: "Davor Šuker ist seit 1998 Rekordtorschütze – 45 Tore in 68 Spielen, die beste Quote aller Kroaten.", url: WP_TEAM },
      { big: "3", label: "WM-Medaillen", text: "Silber 2018, Bronze 1998 und 2022 – dazu Silber in der Nations League 2023.", url: WP_TEAM },
      { big: "125 → 3", label: "Weltrangliste", text: "1994 stieg Kroatien auf Platz 125 in die FIFA-Weltrangliste ein, im Januar 1999 stand es auf Platz 3 – der schnellste Aufstieg der Ranglisten-Geschichte.", url: WP_TEAM },
      { big: "4 / 4", label: "WM-Elfmeterschießen", text: "Dänemark und Russland 2018, Japan und Brasilien 2022: Kroatien hält den WM-Rekord für die meisten Elfmeterschießen (4) und Siege (4).", url: WP_TEAM },
      { big: "7", label: "WM-Tore", text: "Ivan Perišić ist Kroatiens bester WM-Torschütze – und mit 6 Vorlagen auch der beste WM-Vorbereiter.", url: WP_RECORDS },
      { big: "10:0", label: "höchster Sieg", text: "Gegen San Marino am 4. Juni 2016 in Rijeka.", url: WP_TEAM },
      { big: "5", label: "WM-Turniere", text: "Luka Modrić spielte bei fünf Weltmeisterschaften und fünf Europameisterschaften – kroatischer Rekord.", url: WP_RECORDS },
    ] as Tile[],
    caps: "Rekordnationalspieler",
    scorers: "Rekordtorschützen",
    cols: { rank: "#", name: "Spieler", caps: "Spiele", goals: "Tore", years: "Zeitraum" },
    activeNote: "fett = noch aktiv",
    oddH: "Kurios & rekordverdächtig",
    odd: [
      { big: "60 Sek.", label: "kürzeste Karriere", text: "Mario Bazina kam am 12. Februar 2002 zu seinem einzigen Länderspiel – es dauerte 60 Sekunden.", url: WP_RECORDS },
      { big: "16 J.", label: "jüngster Spieler", text: "Alen Halilović debütierte am 10. Juni 2013 mit 16 Jahren und 357 Tagen.", url: WP_RECORDS },
      { big: "40 J.", label: "ältester Spieler", text: "Luka Modrić – mit 40 Jahren und 296 Tagen der älteste Kroate in einem Länderspiel.", url: WP_RECORDS },
      { big: "4", label: "Tore in einem Spiel", text: "Mladen Petrić hält den Rekord für die meisten Tore in einem Länderspiel.", url: WP_RECORDS },
      { big: "3 Min.", label: "schnellstes EM-Tor", text: "Mario Mandžukić traf bei der EURO 2012 schon nach drei Minuten.", url: WP_RECORDS },
      { big: "🏆", label: "Auszeichnungen", text: "Šuker: Goldener Schuh und Silberner Ball (WM 1998). Modrić: Goldener Ball (WM 2018), Bronzener Ball (WM 2022) und Ballon d'Or 2018.", url: WP_TEAM },
    ] as Tile[],
    source: "Quelle",
    note: "Alle Zahlen: Wikipedia (Einzelstatistik laut Kroatischem Fußballverband HNS, aktualisiert am 6. Oktober 2026), geprüft am 28.10.2026. Neue Länderspiele fließen erst nach Prüfung ein.",
    more: "Die legendären Spiele mit Videos: Vatreni-Momente →",
  },
};

const HR: typeof DE = {
  nav: "Trenuci",
  navZ: "U brojkama",
  m: {
    metaTitle: "Trenuci Vatrenih – najveće utakmice Hrvatske uz videe",
    metaDesc: "Od EURA 1996. preko bronce 1998. i finala SP-a 2018. do bronce 2022.: legendarne utakmice Hrvatske uz provjerene činjenice, službene FIFA videe i cjelokupnu bilancu na turnirima.",
    h1: "Trenuci Vatrenih",
    intro: "Zemlja s nešto manje od četiri milijuna stanovnika, tri medalje sa Svjetskih prvenstava i jedno finale SP-a. Ovo su utakmice o kojima Hrvatska i danas priča – kronološki, uz službene FIFA videe i cjelokupnu bilancu na turnirima.",
    medals: "Medalje",
    medalList: [
      { e: "🥉", t: "SP 1998.", s: "Bronca na prvom nastupu" },
      { e: "🥈", t: "SP 2018.", s: "Viceprvaci svijeta" },
      { e: "🥉", t: "SP 2022.", s: "Bronca u Kataru" },
      { e: "🥈", t: "Liga nacija 2023.", s: "Finale protiv Španjolske" },
    ],
    timeline: "Legendarne utakmice",
    video: "Učitaj službeni video (FIFA)",
    clipLink: (by: string) => `▶ Video na službenoj stranici ${by}`,
    source: "Izvor",
    videoNote: "Videozapisi su sa službenog YouTube kanala FIFA-e i učitavaju se s youtube-nocookie.com tek nakon klika. UEFA videi otvaraju izvornu stranicu.",
    record: "Bilanca na turnirima",
    wc: "Svjetska prvenstva",
    euro: "Europska prvenstva",
    cols: { year: "Godina", host: "Domaćin", round: "Plasman", p: "Ut", w: "P", d: "N", l: "I", goals: "Golovi" },
    rounds: { final: "🥈 finale (2.)", third: "🥉 3. mjesto", qf: "četvrtfinale", r16: "osmina finala", r32: "šesnaestina finala", group: "skupina", dnq: "nije se kvalificirala" },
    recordNote: "Neriješeni ishodi uključuju utakmice odlučene jedanaestercima. Prije 1996. Hrvatska je igrala u sastavu Jugoslavije. Izvor: Wikipedia (podaci HNS-a), provjereno 28. 10. 2026.",
    more: "Još rekorda: Hrvatska u brojkama →",
  },
  z: {
    metaTitle: "Hrvatska u brojkama – rekorderi po nastupima, golovima i rekordi",
    metaDesc: "Modrić s 206 nastupa, Šuker s 45 golova, sa 125. na 3. mjesto ljestvice: rekordi Vatrenih – provjereni i uz izvor.",
    h1: "Hrvatska u brojkama",
    intro: "Rekorderi po nastupima i golovima te najveća postignuća Vatrenih – svaki broj uz izvor.",
    asOf: "Stanje: 6. listopada 2026. (nakon utakmice Hrvatska – Španjolska)",
    tilesH: "Veliki brojevi",
    tiles: [
      { big: "206", label: "nastupa", text: "Luka Modrić rekorder je po broju nastupa – debitirao 1. ožujka 2006., 97 utakmica kao kapetan.", url: WP_RECORDS },
      { big: "45", label: "golova", text: "Davor Šuker od 1998. je najbolji strijelac – 45 golova u 68 utakmica, najbolji omjer od svih Hrvata.", url: WP_TEAM },
      { big: "3", label: "medalje sa SP-a", text: "Srebro 2018., bronca 1998. i 2022. – uz srebro u Ligi nacija 2023.", url: WP_TEAM },
      { big: "125 → 3", label: "FIFA ljestvica", text: "Hrvatska je 1994. ušla na FIFA ljestvicu na 125. mjestu, a u siječnju 1999. bila je treća – najbrži uspon u povijesti ljestvice.", url: WP_TEAM },
      { big: "4 / 4", label: "raspucavanja na SP-u", text: "Danska i Rusija 2018., Japan i Brazil 2022.: Hrvatska drži rekord SP-a po broju raspucavanja (4) i pobjeda u njima (4).", url: WP_TEAM },
      { big: "7", label: "golova na SP-u", text: "Ivan Perišić najbolji je hrvatski strijelac na Svjetskim prvenstvima – a sa 6 asistencija i najbolji asistent.", url: WP_RECORDS },
      { big: "10:0", label: "najveća pobjeda", text: "Protiv San Marina 4. lipnja 2016. u Rijeci.", url: WP_TEAM },
      { big: "5", label: "Svjetskih prvenstava", text: "Luka Modrić igrao je na pet Svjetskih i pet Europskih prvenstava – hrvatski rekord.", url: WP_RECORDS },
    ],
    caps: "Rekorderi po nastupima",
    scorers: "Najbolji strijelci",
    cols: { rank: "#", name: "Igrač", caps: "Nastupi", goals: "Golovi", years: "Razdoblje" },
    activeNote: "podebljano = još aktivan",
    oddH: "Zanimljivosti i rekordi",
    odd: [
      { big: "60 s", label: "najkraća karijera", text: "Mario Bazina 12. veljače 2002. odigrao je svoju jedinu utakmicu za reprezentaciju – trajala je 60 sekundi.", url: WP_RECORDS },
      { big: "16 g.", label: "najmlađi igrač", text: "Alen Halilović debitirao je 10. lipnja 2013. sa 16 godina i 357 dana.", url: WP_RECORDS },
      { big: "40 g.", label: "najstariji igrač", text: "Luka Modrić – s 40 godina i 296 dana najstariji Hrvat na reprezentativnoj utakmici.", url: WP_RECORDS },
      { big: "4", label: "gola na utakmici", text: "Mladen Petrić drži rekord po broju golova na jednoj reprezentativnoj utakmici.", url: WP_RECORDS },
      { big: "3 min", label: "najbrži gol na EURU", text: "Mario Mandžukić zabio je na EURU 2012. već u 3. minuti.", url: WP_RECORDS },
      { big: "🏆", label: "nagrade", text: "Šuker: Zlatna kopačka i Srebrna lopta (SP 1998.). Modrić: Zlatna lopta (SP 2018.), Brončana lopta (SP 2022.) i Ballon d'Or 2018.", url: WP_TEAM },
    ],
    source: "Izvor",
    note: "Svi brojevi: Wikipedia (pojedinačna statistika prema podacima HNS-a, ažurirano 6. listopada 2026.), provjereno 28. 10. 2026. Nove utakmice unose se tek nakon provjere.",
    more: "Legendarne utakmice uz videe: Trenuci Vatrenih →",
  },
};

export const vhist = (lang: Lang) => (lang === "hr" ? HR : DE);
