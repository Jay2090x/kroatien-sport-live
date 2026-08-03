/**
 * News – recherchiert aus HNS, ESPN, BBC, Reuters (Stand Juli 2026).
 * Redaktionell + Live-Anker aus Fixtures. DE / EN / HR.
 */

import type { Locale } from "@/i18n/routing";
import type { Match, Player } from "@/types";
import { isLiveStatus } from "@/lib/utils";
import { filterNationalTeamMatches } from "@/lib/data/national-team";
import { assignUniqueNewsImages } from "@/lib/data/news-images";

export type NewsLocaleText = Record<Locale, string>;

export interface NewsImage {
  url: string;
  alt: NewsLocaleText;
}

export interface NewsArticle {
  id: string;
  date: string;
  category: "vatreni" | "clubs" | "transfer" | "hnl" | "preview" | "live";
  tag: NewsLocaleText;
  title: NewsLocaleText;
  summary: NewsLocaleText;
  body: NewsLocaleText;
  image?: NewsImage;
  playerId?: string;
  featured?: boolean;
  /** Externer Original-Link (Auto-RSS) */
  sourceUrl?: string;
}

/** URL-Slug = Artikel-ID (bereits kebab-case) */
export function newsSlug(article: NewsArticle): string {
  return article.id;
}

function todayIso(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function fmtKick(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleString(
      locale === "hr" ? "hr-HR" : locale === "en" ? "en-GB" : "de-DE",
      { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
    );
  } catch {
    return iso;
  }
}

function fmtDate(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(
      locale === "hr" ? "hr-HR" : locale === "en" ? "en-GB" : "de-DE",
      { day: "numeric", month: "long", year: "numeric" }
    );
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * Thematische Vorschaubilder (TheSportsDB / ESPN) – Person, Logo, Wettbewerb.
 * Unsplash nur als letzter Fallback.
 */
const IMG = {
  /** Slaven Bilić (TheSportsDB) */
  bilic:
    "https://r2.thesportsdb.com/images/media/player/thumb/3ik08u1562602501.jpg",
  modric:
    "https://r2.thesportsdb.com/images/media/player/cutout/msewdx1758892756.png",
  gvardiol:
    "https://r2.thesportsdb.com/images/media/player/cutout/mmowa11769183247.png",
  vuskovic:
    "https://r2.thesportsdb.com/images/media/player/cutout/bw06uk1765729531.png",
  croatia:
    "https://r2.thesportsdb.com/images/media/team/badge/vvtsyu1455465317.png",
  croatiaEspn:
    "https://a.espncdn.com/i/teamlogos/countries/500/cro.png",
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
  europaLeague:
    "https://r2.thesportsdb.com/images/media/league/badge/mlsr7d1718774547.png",
  brighton:
    "https://r2.thesportsdb.com/images/media/team/badge/ywypts1448810904.png",
  milan:
    "https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png",
  hajduk:
    "https://r2.thesportsdb.com/images/media/team/badge/23mvtk1579955412.png",
  manCity:
    "https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png",
  dinamo:
    "https://r2.thesportsdb.com/images/media/team/badge/araidi1579955395.png",
  hnl:
    "https://r2.thesportsdb.com/images/media/league/badge/bgo85e1781975278.png",
  /** Aliase / Fallback */
  coach:
    "https://r2.thesportsdb.com/images/media/player/thumb/3ik08u1562602501.jpg",
  stadium:
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&h=400&q=80",
  night:
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&h=400&q=80",
  pitch:
    "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=400&h=400&q=80",
  transfer:
    "https://r2.thesportsdb.com/images/media/league/badge/gasy9d1737743125.png",
  crowd:
    "https://r2.thesportsdb.com/images/media/team/badge/vvtsyu1455465317.png",
  action:
    "https://r2.thesportsdb.com/images/media/league/badge/e7er5g1696521789.png",
};

/**
 * Top-Stories Juli 2026 – belegt unter anderem über HNS.team, ESPN, BBC, Reuters, Goal, AS, Wikipedia.
 * Sortierung: neueste zuerst (siehe getDailyNews).
 */
export const EDITORIAL_NEWS: NewsArticle[] = [
  {
    id: "modric-milan-contract-2027",
    date: "2026-07-23",
    featured: true,
    category: "clubs",
    tag: {
      de: "Serie A",
      en: "Serie A",
      hr: "Serie A",
    },
    title: {
      de: "Offiziell: Modrić verlängert bei Milan bis 2027",
      en: "Official: Modrić extends at Milan until 2027",
      hr: "Službeno: Modrić produžio s Milanom do 2027.",
    },
    summary: {
      de: "Am 23. Juli 2026 unterschrieb der Kapitän einen Einjahresvertrag bis 30. Juni 2027 – zweite Saison bei den Rossoneri.",
      en: "On 23 July 2026 the captain signed a one-year deal until 30 June 2027 – second season with the Rossoneri.",
      hr: "23. srpnja 2026. kapetan je potpisao jednogodišnji ugovor do 30. lipnja 2027. – druga sezona u Rossonerima.",
    },
    body: {
      de: "Laut übereinstimmenden Berichten (u. a. Wikipedia/Club-Meldungen, italienische Presse) hat Luka Modrić am 23. Juli 2026 seinen Vertrag bei AC Milan um ein Jahr bis Ende Juni 2027 verlängert. Damit bleibt der WM-Teilnehmer 2026 und A-Nationalspieler mindestens eine weitere Saison in der Serie A.\n\nFür die Vatreni unter Slaven Bilić ist das ein Signal: Club-Minuten und Fitness bleiben planbar. Parallel läuft die Frage, ob er auch international weitermacht – Bilić hatte den Kapitän als erste Priorität genannt. Im Tracker dieser Seite: Club, Status und nächste Termine.",
      en: "According to converging reports (including club filings and Italian press), Luka Modrić signed a one-year extension at AC Milan on 23 July 2026 through 30 June 2027. The World Cup 2026 player and senior international stays in Serie A for at least another season.\n\nFor Croatia under Slaven Bilić this helps planning club minutes and fitness. In parallel remains the national-team question – Bilić called the captain his first priority. On this site’s tracker: club, status and next fixtures.",
      hr: "Prema usklađenim izvještajima (klupski podaci, talijanski tisak) Luka je Modrić 23. srpnja 2026. produžio ugovor s AC Milanom za godinu dana do 30. lipnja 2027. Sudionik SP-a 2026. i A reprezentativac ostaje barem još jednu sezonu u Serie A.\n\nZa Vatrene pod Slavenom Bilićem to olakšava planiranje minuta i forme. Paralelno ostaje pitanje reprezentacije – Bilić je kapetana nazvao prvim prioritetom. Na trackeru: klub, status i idući termini.",
    },
    playerId: "modric",
    image: {
      url: IMG.milan,
      alt: {
        de: "AC Milan Logo",
        en: "AC Milan logo",
        hr: "Grb AC Milana",
      },
    },
  },
  {
    id: "bilic-modric-call-july-2026",
    date: "2026-07-22",
    featured: true,
    category: "vatreni",
    tag: {
      de: "Breaking",
      en: "Breaking",
      hr: "Breaking",
    },
    title: {
      de: "Bilić hat mit Modrić gesprochen: Kapitän soll bleiben",
      en: "Bilić has spoken with Modrić: captain should stay",
      hr: "Bilić razgovarao s Modrićem: kapetan treba ostati",
    },
    summary: {
      de: "Medien und Fan-Kanäle: Der neue Auswahler hat dem Kapitän klar gemacht, dass er ihn im A-Team will – Entscheidung liegt bei Modrić.",
      en: "Media and fan channels: the new coach told the captain he wants him in the senior side – final call is Modrić’s.",
      hr: "Mediji i fan kanali: novi izbornik jasno je rekao kapetanu da ga želi u A sastavu – odluka je Modrićeva.",
    },
    body: {
      de: "Nach der Ernennung vom 13. Juli und der ersten Pressekonferenz melden kroatische und internationale Kanäle ein Follow-up: Slaven Bilić habe mit Luka Modrić gesprochen und bekräftigt, den Kapitän im Kader der Vatreni zu wollen. Offizielle Nominierungslisten erscheinen erst vor den FIFA-Fenstern im Herbst.\n\nFür die Nations League (Start 26.09. in Prag gegen Tschechien) wäre Modrić sportlich und symbolisch zentral – parallel hat er bei Milan bis 2027 verlängert. Alle Länderspiel-Termine und Club-Spiele der Kroaten: Nationalteam- und Tracker-Sektion.",
      en: "After the 13 July appointment and first press conference, Croatian and international channels report a follow-up: Slaven Bilić has spoken with Luka Modrić and reaffirmed he wants the captain in the Vatreni squad. Official squads only appear before autumn FIFA windows.\n\nFor the Nations League (starts 26 Sep in Prague vs Czechia) Modrić would be central on and off the pitch – he has also extended at Milan to 2027. All internationals and club fixtures: national-team and tracker sections.",
      hr: "Nakon imenovanja 13. srpnja i prve konferencije hrvatski i strani kanali javljaju follow-up: Slaven Bilić razgovarao je s Lukom Modrićem i potvrdio da ga želi u sastavu Vatrenih. Službene liste tek pred jesenske FIFA prozore.\n\nZa Ligu nacija (start 26.9. u Pragu protiv Češke) Modrić bi bio središnji i sportski i simbolički – paralelno je produžio u Milanu do 2027. Svi termini reprezentacije i klubova: rubrike reprezentacije i trackera.",
    },
    playerId: "modric",
    image: {
      url: IMG.modric,
      alt: {
        de: "Luka Modrić",
        en: "Luka Modrić",
        hr: "Luka Modrić",
      },
    },
  },
  {
    id: "hnl-season-approach-2026",
    date: "2026-07-27",
    featured: true,
    category: "hnl",
    tag: {
      de: "HNL",
      en: "HNL",
      hr: "HNL",
    },
    title: {
      de: "HNL vor dem Start: Dinamo, Hajduk, Rijeka – Europa & Meisterschaft",
      en: "HNL about to kick off: Dinamo, Hajduk, Rijeka – Europe & title race",
      hr: "HNL pred startom: Dinamo, Hajduk, Rijeka – Europa i naslov",
    },
    summary: {
      de: "Ende Juli 2026: Saisonvorbereitung und Europacup-Quali prägen die Woche – kroatische Talente im Fokus für Bilić.",
      en: "Late July 2026: pre-season and European qualifying define the week – Croatian talents in focus for Bilić.",
      hr: "Kraj srpnja 2026.: pripreme i europske kvalifikacije obilježavaju tjedan – hrvatski talenti u fokusu za Bilića.",
    },
    body: {
      de: "Während die Vatreni nach dem WM-Aus und dem Trainerwechsel Bilić den Herbst vorbereiten, läuft in der HNL die heiße Phase vor dem Saisonstart: Europapokal-Qualifikation, Testspiele und Kaderplanung. Dinamo Zagreb, Hajduk Split, Rijeka und Osijek liefern Minuten für Spieler, die auch für U-21 und A-Team interessant sind.\n\nFür den Neuaufbau unter Bilić und U-21-Coach Ivica Olić zählt Club-Form. Live-Board und Tracker auf dieser Seite listen HNL- und Europa-Spiele mit kroatischer Beteiligung – inklusive TV-Hinweisen, wo verfügbar.",
      en: "While the Vatreni prepare the autumn after the World Cup exit and Bilić’s appointment, the HNL is in peak pre-season: European qualifying, friendlies and squad planning. Dinamo Zagreb, Hajduk Split, Rijeka and Osijek provide minutes for players interesting to U-21 and senior setups.\n\nFor the rebuild under Bilić and U-21 coach Ivica Olić, club form matters. This site’s live board and tracker list HNL and European games with Croatian involvement – including TV tips where available.",
      hr: "Dok Vatreni nakon SP-a i imenovanja Bilića spremaju jesen, u HNL-u je vrhunac priprema: europske kvalifikacije, prijateljske i planiranje kadra. Dinamo, Hajduk, Rijeka i Osijek daju minute igračima zanimljivima za U-21 i A sastav.\n\nZa obnovu pod Bilićem i U-21 trenerom Olićem broji klupska forma. Live board i tracker na ovoj stranici listaju HNL i europske utakmice s hrvatskim igračima – uključujući TV savjete gdje su dostupni.",
    },
    image: {
      url: IMG.dinamo,
      alt: {
        de: "Dinamo Zagreb",
        en: "Dinamo Zagreb",
        hr: "Dinamo Zagreb",
      },
    },
  },
  {
    id: "bilic-youth-dinamo-hnl-2026",
    date: "2026-07-26",
    category: "vatreni",
    tag: {
      de: "Kader",
      en: "Squad",
      hr: "Kadar",
    },
    title: {
      de: "Bilić-Blick auf HNL & Dinamo: Stojković, Beljo & U-21-Talente",
      en: "Bilić eyeing HNL & Dinamo: Stojković, Beljo & U-21 talents",
      hr: "Bilićev pogled na HNL i Dinamo: Stojković, Beljo i U-21 talenti",
    },
    summary: {
      de: "Kroatische Medien zur neuen Ära: Nähe zu Dinamo und junge Namen neben den etablierten Europäern – ohne vorzeitige Nominierung.",
      en: "Croatian media on the new era: closer ties to Dinamo and young names beside established Europe-based stars – no early squad lists.",
      hr: "Hrvatski mediji o novoj eri: bliža suradnja s Dinamom i mlada imena uz etablirane Europljane – bez ranih lista.",
    },
    body: {
      de: "Berichte (u. a. Sportske Novosti / Jutarnji) skizzieren Bilićs Linie: Kern aus erfahrenen Europäern behalten, dazu stärkere Anbindung an HNL-Clubs – besonders Dinamo – und schrittweise Integration von U-21-Talenten. Namen wie Stojković oder Beljo werden spekulativ genannt; offiziell gilt: Kader erst vor den FIFA-Fenstern.\n\nFür Fans: Profile und Club-Zuordnung im Tracker, Länderspiel-Termine in der Nationalteam-Sektion und im Live-Board.",
      en: "Reports (including Sportske Novosti / Jutarnji) outline Bilić’s approach: keep a core of experienced Europe-based players, deepen HNL club links – especially Dinamo – and gradually integrate U-21 talents. Names such as Stojković or Beljo are speculated; officially squads only come before FIFA windows.\n\nFor fans: profiles and clubs in the tracker, internationals under National team and on the live board.",
      hr: "Izvještaji (uključujući SN / Jutarnji) ocrtavaju Bilićev pristup: zadržati jezgru iskusnih Europljana, jača veza s HNL klubovima – posebno Dinamom – i postupna integracija U-21 talenata. Imena poput Stojkovića ili Belje spekulativna su; službeno sastavi tek pred FIFA prozore.\n\nZa navijače: profili i klubovi u trackeru, reprezentacija u rubrici i na live boardu.",
    },
    image: {
      url: IMG.bilic,
      alt: {
        de: "Slaven Bilić",
        en: "Slaven Bilić",
        hr: "Slaven Bilić",
      },
    },
  },
  {
    id: "preseason-europe-croatians-2026",
    date: "2026-07-25",
    category: "clubs",
    tag: {
      de: "Europa",
      en: "Europe",
      hr: "Europa",
    },
    title: {
      de: "Vorbereitung in Europa: City, Milan, Brighton – Kroaten im Trainingslager",
      en: "Pre-season in Europe: City, Milan, Brighton – Croatians in camp",
      hr: "Pripreme u Europi: City, Milan, Brighton – Hrvati u kampovima",
    },
    summary: {
      de: "Nach der WM kehren Gvardiol, Kovačić, Modrić, Vušković & Co. in die Club-Vorbereitung zurück – Form für die Herbst-NL.",
      en: "After the World Cup Gvardiol, Kovačić, Modrić, Vušković & co. return to club pre-season – form for autumn Nations League.",
      hr: "Nakon SP-a Gvardiol, Kovačić, Modrić, Vušković i ostali vraćaju se u klupske pripreme – forma za jesensku LN.",
    },
    body: {
      de: "Ende Juli 2026 ist für die kroatischen Legionäre Trainingslager-Zeit: Premier League, Serie A und weitere Ligen starten bald. Joško Gvardiol und Mateo Kovačić bei Manchester City, Luka Modrić bei Milan (Vertrag bis 2027), Luka Vušković nach dem Wechsel bei Brighton – plus HNL-Europacup.\n\nFür Bilićs ersten NL-Block im September zählt, wer fit und spielstark aus der Vorbereitung kommt. Tracker und Live-Board bündeln die nächsten Club-Spiele.",
      en: "Late July 2026 is training-camp season for Croatian legionnaires: Premier League, Serie A and more leagues start soon. Joško Gvardiol and Mateo Kovačić at Manchester City, Luka Modrić at Milan (deal to 2027), Luka Vušković after his move at Brighton – plus HNL European runs.\n\nFor Bilić’s first Nations League block in September, who emerges fit and sharp from pre-season matters. Tracker and live board list the next club fixtures.",
      hr: "Kraj srpnja 2026. vrijeme je kampova za hrvatske legionare: Premier liga, Serie A i ostale lige uskoro kreću. Joško Gvardiol i Mateo Kovačić u Manchester Cityju, Luka Modrić u Milanu (ugovor do 2027.), Luka Vušković nakon transfera u Brightonu – plus HNL Europa.\n\nZa Bilićev prvi LN blok u rujnu broji tko iz priprema izađe fit i oštar. Tracker i live board nudi iduće klupske utakmice.",
    },
    image: {
      url: IMG.premierLeague,
      alt: {
        de: "Premier League",
        en: "Premier League",
        hr: "Premier liga",
      },
    },
  },
  {
    id: "nl-tickets-prep-sept-2026",
    date: "2026-07-24",
    category: "preview",
    tag: {
      de: "Nations League",
      en: "Nations League",
      hr: "Liga nacija",
    },
    title: {
      de: "Countdown NL: 60+ Tage bis Prag – Fans und TV im Blick",
      en: "NL countdown: 60+ days to Prague – fans and TV in focus",
      hr: "Odbrojavanje LN: 60+ dana do Praga – navijači i TV u fokusu",
    },
    summary: {
      de: "Erstes Pflichtspiel der Bilić-Ära: 26.09. Tschechien auswärts – danach Spanien und England-Heimspiele.",
      en: "First competitive game of the Bilić era: 26 Sep Czechia away – then Spain and home vs England.",
      hr: "Prva obvezna utakmica Bilićeve ere: 26.9. Češka u gostima – zatim Španjolska i Engleska doma.",
    },
    body: {
      de: "Mit dem Kalender der Nations League 2026/27 im Gepäck startet der Countdown Richtung September: Tschechien in Prag, Spanien in Sevilla, England in Rijeka (ohne Publikum) und Spanien am Poljud. Ticket- und TV-Infos hängen von HNS, UEFA und lokalen Rechteinhabern ab – auf dieser Seite: Termine im Live-Board und Nationalteam, TV-Guide und legale Stream-Hinweise mit Geo.\n\nKader-Nominierungen folgen erst vor dem FIFA-Fenster. Bis dahin: Club-Form der Kroaten im Tracker verfolgen.",
      en: "With the Nations League 2026/27 calendar set, the countdown to September runs: Czechia in Prague, Spain in Seville, England in Rijeka (behind closed doors) and Spain at Poljud. Tickets and TV depend on HNS, UEFA and local rights – on this site: dates on the live board and national team, TV guide and legal stream tips with geo.\n\nSquads only before the FIFA window. Until then: track club form of Croatians in the tracker.",
      hr: "S rasporedom Lige nacija 2026./27. kreće odbrojavanje do rujna: Češka u Pragu, Španjolska u Sevilli, Engleska u Rijeci (bez publike) i Španjolska na Poljudu. Ulaznice i TV ovise o HNS-u, UEFA-i i lokalnim pravima – na ovoj stranici: termini na live boardu i reprezentaciji, TV vodič i legalni stream savjeti s geo.\n\nSastavi tek pred FIFA prozor. Do tada: klupska forma Hrvata u trackeru.",
    },
    image: {
      url: IMG.nationsLeague,
      alt: {
        de: "Nations League",
        en: "Nations League",
        hr: "Liga nacija",
      },
    },
  },
  {
    id: "modric-milan-injury-context-2026",
    date: "2026-07-24",
    category: "clubs",
    tag: {
      de: "Gesundheit",
      en: "Fitness",
      hr: "Forma",
    },
    title: {
      de: "Modrić nach Juve-Duell und WM: Backe verheilt, Fokus Serie A",
      en: "Modrić after Juve clash and World Cup: cheek healed, Serie A focus",
      hr: "Modrić nakon Juventusa i SP-a: jagodica sanirana, fokus Serie A",
    },
    summary: {
      de: "Im Frühjahr 2026 Wangenbeinbruch nach Zusammenstoß mit Locatelli – OP im April; Verlängerung bis 2027 unterstreicht Comeback-Plan.",
      en: "Spring 2026 cheekbone fracture after Locatelli clash – surgery in April; extension to 2027 underlines comeback plan.",
      hr: "Proljeće 2026. prijelom jagodice nakon duela s Locatellijem – operacija u travnju; produženje do 2027. potvrđuje plan povratka.",
    },
    body: {
      de: "Berichte zur Saison 2025/26: Luka Modrić erlitt im Serie-A-Spiel gegen Juventus nach einem Zusammenprall mit Manuel Locatelli einen Wangenbeinbruch und wurde im April 2026 operiert. Trotzdem gehörte er zum kroatischen WM-Kader 2026 und hat nun bei Milan bis 2027 verlängert.\n\nStatus im Tracker bleibt systemseitig vorsichtig, wo keine Redaktions-Override vorliegen. Für Bilić zählt langfristig Belastungssteuerung zwischen Club und Nationalteam.",
      en: "Reports from 2025/26: Luka Modrić suffered a cheekbone fracture in a Serie A match vs Juventus after a collision with Manuel Locatelli and had surgery in April 2026. He still featured in Croatia’s World Cup 2026 plans and has now extended at Milan to 2027.\n\nTracker status stays cautious where no editorial override exists. For Bilić, load management between club and country will matter long term.",
      hr: "Izvještaji o sezoni 2025./26.: Luka Modrić zadobio je prijelom jagodice u utakmici Serie A protiv Juventusa nakon sudara s Manuelom Locatellijem i operiran je u travnju 2026. Ipak je bio dio planova za SP 2026. i sada je produžio u Milanu do 2027.\n\nStatus u trackeru ostaje oprezan gdje nema redakcijskog overridea. Za Bilića dugoročno broji upravljanje opterećenjem klub–reprezentacija.",
    },
    playerId: "modric",
    image: {
      url: IMG.modric,
      alt: {
        de: "Luka Modrić",
        en: "Luka Modrić",
        hr: "Luka Modrić",
      },
    },
  },
  {
    id: "hns-wc-prize-money-2026",
    date: "2026-07-22",
    category: "vatreni",
    tag: {
      de: "HNS",
      en: "HNS",
      hr: "HNS",
    },
    title: {
      de: "Trotz WM-Aus: HNS kassiert – Millionen aus der K.-o.-Runde",
      en: "Despite World Cup exit: HNS cashes in – millions from knockout stage",
      hr: "Unatoč ispadanju sa SP-a: HNS zarađuje – milijuni iz nokaut faze",
    },
    summary: {
      de: "Medien zu FIFA-Prämien: Gruppenphase plus Round of 32 bringen dem Verband zweistellige Millionenbeträge – Basis für den Bilić-Zyklus.",
      en: "Media on FIFA prize money: group stage plus round of 32 bring the federation eight-figure sums – base for the Bilić cycle.",
      hr: "Mediji o FIFA premijama: skupina plus round of 32 donose savezu dvoznamenkaste milijune – baza za Bilićev ciklus.",
    },
    body: {
      de: "Nach dem Ausscheiden gegen Portugal (2:1) in Toronto rechnen kroatische Medien vor, dass allein der Einzug unter die letzten 32 und die Gruppenspiele dem HNS hohe FIFA-Prämien sichern – Berichte nannten rund um den Achtelfinal-Einzug Größenordnungen von über 10 Mio. Euro. Genaue Summen hängen von FIFA-Veröffentlichungen ab.\n\nSportlich beginnt mit Bilić ein neuer Zyklus Richtung EM 2028; finanziell stärkt die WM-Teilnahme den Verband. Für Fans zählt auf dieser Seite der sportliche Kalender: NL-Termine, News und Tracker.",
      en: "After the exit to Portugal (2–1) in Toronto, Croatian media note that reaching the last 32 and the group games alone secure large FIFA prize payments for the HNS – reports around knockout qualification cited figures above €10m. Exact sums depend on FIFA publications.\n\nSportingly a new cycle starts with Bilić towards EURO 2028; financially the World Cup strengthens the federation. On this site: NL calendar, news and tracker.",
      hr: "Nakon ispadanja od Portugala (2:1) u Torontu hrvatski mediji računaju da sam plasman među 32 i utakmice skupine HNS-u donose visoke FIFA premije – izvještaji oko prolaska u nokaut spominjali su iznose preko 10 mil. €. Točni iznosi ovise o FIFA objavama.\n\nSportski s Bilićem kreće novi ciklus prema Euru 2028.; financijski SP jača savez. Na ovoj stranici: LN kalendar, vijesti i tracker.",
    },
    image: {
      url: IMG.worldCup,
      alt: {
        de: "FIFA World Cup",
        en: "FIFA World Cup",
        hr: "SP FIFA",
      },
    },
  },
  {
    id: "vatreni-homecoming-2026",
    date: "2026-07-04",
    category: "vatreni",
    tag: {
      de: "WM 2026",
      en: "World Cup 2026",
      hr: "SP 2026",
    },
    title: {
      de: "Vatreni zurück in Zagreb: Fans empfangen die Mannschaft",
      en: "Vatreni back in Zagreb: fans welcome the team",
      hr: "Vatreni natrag u Zagrebu: navijači dočekali momčad",
    },
    summary: {
      de: "Nach dem dramatischen Aus gegen Portugal landete die Nationalmannschaft in Kroatien – hunderte Fans am Flughafen.",
      en: "After the dramatic exit to Portugal the national team landed in Croatia – hundreds of fans at the airport.",
      hr: "Nakon dramatičnog ispadanja od Portugala reprezentacija je sletjela u Hrvatsku – stotine navijača na aerodromu.",
    },
    body: {
      de: "Anfang Juli 2026 kehrten die Vatreni nach dem 1:2 gegen Portugal (Round of 32, Toronto) nach Zagreb zurück. Medien zeigten den Empfang am Flughafen Franjo Tuđman mit zahlreichen Fans trotz der Enttäuschung.\n\nWenige Tage später folgte der Abschied von Zlatko Dalić und die Ernennung von Slaven Bilić. Der Blick richtet sich jetzt auf die Nations League im September.",
      en: "In early July 2026 the Vatreni returned to Zagreb after the 1–2 loss to Portugal (round of 32, Toronto). Media showed the reception at Franjo Tuđman Airport with many fans despite the disappointment.\n\nDays later came Zlatko Dalić’s exit and Slaven Bilić’s appointment. Focus now turns to the Nations League in September.",
      hr: "Početkom srpnja 2026. Vatreni su se vratili u Zagreb nakon poraza 1:2 od Portugala (round of 32, Toronto). Mediji su pokazali doček na aerodromu Franje Tuđmana s brojnim navijačima unatoč razočaranju.\n\nNekoliko dana kasnije uslijedio je odlazak Zlatka Dalića i imenovanje Slavena Bilića. Pogled je sada na Ligu nacija u rujnu.",
    },
    image: {
      url: IMG.croatia,
      alt: {
        de: "Kroatien Nationalteam",
        en: "Croatia national team",
        hr: "Hrvatska reprezentacija",
      },
    },
  },
  {
    id: "sucic-baturina-form-watch-2026",
    date: "2026-07-26",
    category: "clubs",
    tag: {
      de: "Talente",
      en: "Talents",
      hr: "Talenti",
    },
    title: {
      de: "Form-Watch: Sučić, Baturina & Co. – Bilić beobachtet die Vorbereitung",
      en: "Form watch: Sučić, Baturina & co. – Bilić watching pre-season",
      hr: "Forma: Sučić, Baturina i ostali – Bilić prati pripreme",
    },
    summary: {
      de: "Junge Mittelfeld- und Offensivspieler in Club-Lagern – Kandidaten für erweiterte NL-Kader im Herbst.",
      en: "Young midfielders and attackers in club camps – candidates for expanded NL squads in autumn.",
      hr: "Mladi veznjaci i ofenzivci u klupskim kampovima – kandidati za proširene LN sastave u jesen.",
    },
    body: {
      de: "Neben den etablierten Europäern rücken Petar Sučić, Martin Baturina und weitere junge Kroaten in den Fokus der Bilić-Ära. Club-Minuten in Vorbereitung und Saisonstart entscheiden mit über NL-Chancen.\n\nIm Tracker: Club, Liga und nächste Spiele. Nominierungen erst vor den FIFA-Fenstern – keine Spekulation als Fakt.",
      en: "Besides established Europe-based stars, Petar Sučić, Martin Baturina and other young Croatians move into focus in the Bilić era. Pre-season and early-season minutes will influence NL chances.\n\nIn the tracker: club, league and next matches. Squads only before FIFA windows – no speculation as fact.",
      hr: "Uz etablirane Europljane u fokus Bilićeve ere ulaze Petar Sučić, Martin Baturina i drugi mladi Hrvati. Minute u pripremama i startu sezone utjecat će na šanse za LN.\n\nU trackeru: klub, liga i iduće utakmice. Sastavi tek pred FIFA prozore – bez spekulacija kao činjenica.",
    },
    image: {
      url: IMG.pitch,
      alt: {
        de: "Fußballplatz",
        en: "Football pitch",
        hr: "Nogometni teren",
      },
    },
  },
  {
    id: "budimir-spain-preseason-2026",
    date: "2026-07-25",
    category: "clubs",
    tag: {
      de: "La Liga",
      en: "La Liga",
      hr: "La Liga",
    },
    title: {
      de: "Budimir & Spanien-Kroaten: Vorbereitung vor dem Liga-Start",
      en: "Budimir & Spain-based Croatians: pre-season before league start",
      hr: "Budimir i Hrvati u Španjolskoj: pripreme pred start lige",
    },
    summary: {
      de: "Stürmer und Legionäre in La Liga rüsten für die Saison – relevant für NL-Nominierungen im September.",
      en: "Strikers and legionnaires in La Liga gear up for the season – relevant for September NL nominations.",
      hr: "Napadači i legionari u La Ligi spremaju sezonu – važno za LN nominacije u rujnu.",
    },
    body: {
      de: "Kroatische Spieler in Spanien – darunter erfahrene Offensivkräfte wie Ante Budimir – sind in der Vorbereitung. Nach dem WM-Turnier und dem Trainerwechsel bei den Vatreni zählt Club-Form für den Herbst.\n\nLive-Board und Tracker: nächste Termine, wo die APIs Daten liefern.",
      en: "Croatian players in Spain – including experienced attackers such as Ante Budimir – are in pre-season. After the World Cup and the national-team coaching change, club form matters for autumn.\n\nLive board and tracker: next fixtures where APIs provide data.",
      hr: "Hrvatski igrači u Španjolskoj – uključujući iskusne napadače poput Ante Budimira – u pripremama su. Nakon SP-a i smjene izbornika klupska forma broji za jesen.\n\nLive board i tracker: idući termini gdje API daje podatke.",
    },
    playerId: "budimir",
    image: {
      url: IMG.action,
      alt: {
        de: "Fußball",
        en: "Football",
        hr: "Nogomet",
      },
    },
  },
  {
    id: "majer-ivanusec-update-2026",
    date: "2026-07-24",
    category: "clubs",
    tag: {
      de: "Europa",
      en: "Europe",
      hr: "Europa",
    },
    title: {
      de: "Majer, Ivanušec & Co.: Club-Status nach der WM",
      en: "Majer, Ivanušec & co.: club status after the World Cup",
      hr: "Majer, Ivanušec i ostali: klupski status nakon SP-a",
    },
    summary: {
      de: "Mittelfeld und Flügel der Vatreni kehren in ihre Ligen zurück – Belastung und Einsatzminuten im Fokus.",
      en: "Vatreni midfield and wide players return to their leagues – load and minutes in focus.",
      hr: "Veznjaci i krila Vatrenih vraćaju se u lige – fokus na opterećenje i minute.",
    },
    body: {
      de: "Spieler wie Lovro Majer und Luka Ivanušec gehören zum erweiterten Kreis der Nationalmannschaft. Nach dem WM-Turnier 2026 und dem Wechsel auf der Trainerbank zählt, wer in den Clubs Vertrauen und Minuten bekommt.\n\nDiese Seite bündelt Club- und Länderspiel-Termine, wo Daten angebunden sind – ohne spekulative Kaderlisten.",
      en: "Players such as Lovro Majer and Luka Ivanušec sit in the wider national-team pool. After World Cup 2026 and the coaching change, who earns club trust and minutes matters.\n\nThis site lists club and international fixtures where data is connected – without speculative squad lists.",
      hr: "Igrači poput Lovre Majera i Luke Ivanušeca u širem su krugu reprezentacije. Nakon SP-a 2026. i smjene na klupi broji tko u klubovima dobiva povjerenje i minute.\n\nOva stranica nudi klupske i reprezentativne termine gdje su podaci spojeni – bez spekulativnih lista.",
    },
    image: {
      url: IMG.euro,
      alt: {
        de: "UEFA",
        en: "UEFA",
        hr: "UEFA",
      },
    },
  },
  {
    id: "dinamo-europe-path-2026",
    date: "2026-07-23",
    category: "clubs",
    tag: {
      de: "UCL / Europa",
      en: "UCL / Europe",
      hr: "UCL / Europa",
    },
    title: {
      de: "Dinamo im Europacup: Quali-Pfad und kroatische Talente",
      en: "Dinamo in Europe: qualifying path and Croatian talents",
      hr: "Dinamo u Europi: put kvalifikacija i hrvatski talenti",
    },
    summary: {
      de: "Maksimir-Club sucht den Weg in die Gruppenphase – Minuten für HNL-Talente unter Bilić-Beobachtung.",
      en: "Maksimir club seeks a path to the group stage – minutes for HNL talents under Bilić’s watch.",
      hr: "Maksimirski klub traži put u skupine – minute za HNL talente pod Bilićevim okom.",
    },
    body: {
      de: "Dinamo Zagreb ist traditionell Kroatiens Aushängeschild in der Champions-League- oder Europa-League-Qualifikation. Ende Juli 2026 laufen die Europacup-Wochen – für junge Kroaten wichtige Bühne, für Bilić Beobachtungsfeld.\n\nErgebnisse und Termine, sofern API-Daten vorliegen, im Live-Board und Spiele-Bereich der App.",
      en: "Dinamo Zagreb is traditionally Croatia’s standard-bearer in Champions League or Europa League qualifying. Late July 2026 is European week – a stage for young Croatians and a scouting ground for Bilić.\n\nResults and dates where APIs provide data: live board and matches area.",
      hr: "Dinamo Zagreb tradicionalno je hrvatski standard u kvalifikacijama Lige prvaka ili Europske lige. Kraj srpnja 2026. europski su tjedni – pozornica za mlade Hrvate i promatranje za Bilića.\n\nRezultati i termini gdje API daje podatke: live board i utakmice.",
    },
    image: {
      url: IMG.dinamo,
      alt: {
        de: "Dinamo Zagreb",
        en: "Dinamo Zagreb",
        hr: "Dinamo Zagreb",
      },
    },
  },
  {
    id: "livakovic-fener-prep-2026",
    date: "2026-07-22",
    category: "clubs",
    tag: {
      de: "Torwart",
      en: "Goalkeeper",
      hr: "Vratar",
    },
    title: {
      de: "Livaković: Club-Vorbereitung nach der WM – Konkurrenz im Tor",
      en: "Livaković: club pre-season after the World Cup – rivalry in goal",
      hr: "Livaković: klupske pripreme nakon SP-a – konkurencija na golu",
    },
    summary: {
      de: "Nationaltorwart kehrt in den Club-Alltag zurück – für die NL im September bleibt er eine zentrale Figur.",
      en: "National goalkeeper returns to club routine – for September NL he remains a central figure.",
      hr: "Reprezentativni vratar vraća se u klupsku rutinu – za LN u rujnu ostaje središnja figura.",
    },
    body: {
      de: "Dominik Livaković gehörte zum WM-Kader der Vatreni. Nach dem Turnier und dem Trainerwechsel unter Bilić zählt Club-Form und Konkurrenzsituation. Im Tracker: Club und nächste Spiele, sobald Daten angebunden sind.",
      en: "Dominik Livaković was in Croatia’s World Cup squad. After the tournament and Bilić’s appointment, club form and competition for the gloves matter. Tracker: club and next matches when data is connected.",
      hr: "Dominik Livaković bio je u SP sastavu Vatrenih. Nakon turnira i imenovanja Bilića broji klupska forma i konkurencija. Tracker: klub i iduće utakmice kad su podaci spojeni.",
    },
    playerId: "livakovic",
    image: {
      url: IMG.croatiaEspn,
      alt: {
        de: "Kroatien",
        en: "Croatia",
        hr: "Hrvatska",
      },
    },
  },
  {
    id: "pasalic-atalanta-2026",
    date: "2026-07-21",
    category: "clubs",
    tag: {
      de: "Serie A",
      en: "Serie A",
      hr: "Serie A",
    },
    title: {
      de: "Pašalić & Atalanta: Vorbereitung in Bergamo nach dem WM-Turnier",
      en: "Pašalić & Atalanta: Bergamo pre-season after the World Cup",
      hr: "Pašalić i Atalanta: pripreme u Bergamu nakon SP-a",
    },
    summary: {
      de: "Erfahrener Mittelfeldspieler der Vatreni startet in die Serie-A-Vorbereitung – Option für Bilićs Herbstkader.",
      en: "Experienced Vatreni midfielder starts Serie A pre-season – option for Bilić’s autumn squad.",
      hr: "Iskusni veznjak Vatrenih kreće u pripreme Serie A – opcija za Bilićev jesenski sastav.",
    },
    body: {
      de: "Mario Pašalić bleibt eine erfahrene Option im zentralen Mittelfeld. Nach WM und Trainerwechsel zählt, wie er in der Atalanta-Vorbereitung belastet wird. Tracker und News halten Club- und Nationalteam-Kontext zusammen.",
      en: "Mario Pašalić remains an experienced central-midfield option. After the World Cup and coaching change, how Atalanta manage his load in pre-season matters. Tracker and news keep club and national-team context together.",
      hr: "Mario Pašalić ostaje iskusna opcija u središini. Nakon SP-a i smjene izbornika broji kako ga Atalanta opterećuje u pripremama. Tracker i vijesti drže kontekst kluba i reprezentacije.",
    },
    playerId: "pasalic",
    image: {
      url: IMG.serieA,
      alt: {
        de: "Serie A",
        en: "Serie A",
        hr: "Serie A",
      },
    },
  },
  {
    id: "modric-bilic-continue-2026",
    date: "2026-07-21",
    featured: true,
    category: "vatreni",
    tag: {
      de: "Breaking",
      en: "Breaking",
      hr: "Breaking",
    },
    title: {
      de: "Modrić signalisiert Offenheit: Weitermachen unter Bilić möglich",
      en: "Modrić signals openness: continuing under Bilić possible",
      hr: "Modrić signalizira otvorenost: nastavak pod Bilićem moguć",
    },
    summary: {
      de: "Spanische und internationale Medien: Der Kapitän verfolgte die Bilić-Gespräche – und hält die Tür zur Nationalmannschaft offen.",
      en: "Spanish and international media: the captain followed Bilić’s talks closely – and is keeping the door to the national team open.",
      hr: "Španjolski i međunarodni mediji: kapetan je pratio Bilićeve pregovore – i drži vrata reprezentacije otvorenima.",
    },
    body: {
      de: "Wenige Tage nach der Ernennung von Slaven Bilić berichten Goal, Diario AS (über José Félix Díaz) und weitere Outlets: Luka Modrić habe die Verhandlungen des neuen Auswahler mit dem HNS eng verfolgt und signalisiert, dass er ein Weitermachen im A-Team unter Bilić ernsthaft erwägt. Offiziell ist nichts fixiert – Bilić hatte den Kontakt zum Kapitän als „erste Priorität“ genannt, die Entscheidung liege bei Modrić.\n\nFür Fans und für den Tracker auf dieser Seite zählt: Sobald der HNS nominiert, erscheinen Termine und Status live in der Nationalteam- und Spieler-Sektion. Parallel läuft bei AC Milan die Diskussion um eine Club-Verlängerung bis 2027. Nations-League-Start: 26. September in Prag gegen Tschechien.",
      en: "Days after Slaven Bilić’s appointment, Goal, Diario AS (via José Félix Díaz) and other outlets report that Luka Modrić closely followed the new coach’s talks with the HNS and is seriously considering continuing for the senior team under Bilić. Nothing is official yet – Bilić had called contact with the captain his “first priority,” with the final call Modrić’s alone.\n\nFor fans and this site’s tracker: once HNS names a squad, fixtures and status appear live under National team and Players. In parallel AC Milan continue talks about a club extension to 2027. Nations League starts 26 September in Prague vs Czechia.",
      hr: "Nekoliko dana nakon imenovanja Slavena Bilića Goal, Diario AS (preko José Félixa Díaza) i drugi mediji pišu da je Luka Modrić pomno pratio pregovore novog izbornika s HNS-om i ozbiljno razmatra nastavak u A sastavu pod Bilićem. Ništa još nije službeno – Bilić je kontakt s kapetanom nazvao „prvim prioritetom“, odluka je isključivo Modrićeva.\n\nZa navijače i tracker na ovoj stranici: čim HNS nominira, termini i status su uživo u rubrikama reprezentacije i igrača. Paralelno u AC Milanu traju razgovori o produženju do 2027. Start Lige nacija: 26. rujna u Pragu protiv Češke.",
    },
    playerId: "modric",
    image: {
      url: IMG.modric,
      alt: {
        de: "Luka Modrić",
        en: "Luka Modrić",
        hr: "Luka Modrić",
      },
    },
  },
  {
    id: "nl-group-death-preview-2026",
    date: "2026-07-21",
    featured: true,
    category: "preview",
    tag: {
      de: "Vorschau",
      en: "Preview",
      hr: "Najava",
    },
    title: {
      de: "„Gruppe des Todes“: Spanien, England, Tschechien – Bilićs erster Härtetest",
      en: "“Group of death”: Spain, England, Czechia – Bilić’s first acid test",
      hr: "„Skupina smrti“: Španjolska, Engleska, Češka – Bilićev prvi ispit",
    },
    summary: {
      de: "Sechs Pflichtspiele in Liga A bis Mitte November – Start in Prag, dann Sevilla, Rijeka (ohne Fans) und Poljud.",
      en: "Six League A fixtures by mid-November – start in Prague, then Seville, Rijeka (closed doors) and Poljud.",
      hr: "Šest utakmica Lige A do sredine studenoga – start u Pragu, zatim Sevilla, Rijeka (bez publike) i Poljud.",
    },
    body: {
      de: "Die Nations League 2026/27 steckt die Vatreni in Liga A mit Spanien, England und Tschechien – für den neuen Trainerstab unter Slaven Bilić der härteste denkbare Einstieg vor dem EM-Zyklus 2028. Kalender laut HNS: 26.09. Tschechien (Prag, 20:45), 29.09. Spanien (Sevilla, 20:45), 03.10. England (Rijeka, 18:00, ohne Publikum), 06.10. Spanien (Poljud, 20:45), 12.11. England (London), 15.11. Tschechien (Osijek, Opus Arena).\n\nSportlich zählt Tempo nach der WM: junge Abwehr um Gvardiol und Vušković, Erfahrung um Modrić/Kovačić, und klare Spielidee statt reiner Übergang. Alle Termine und TV-Hinweise findest du live in der Nationalteam-Liste dieser Seite – Kader erst vor den FIFA-Fenstern.",
      en: "Nations League 2026/27 places Croatia in League A with Spain, England and Czechia – the toughest possible start for Slaven Bilić’s staff before the EURO 2028 cycle. HNS calendar: 26 Sep Czechia (Prague, 20:45), 29 Sep Spain (Seville, 20:45), 3 Oct England (Rijeka, 18:00, behind closed doors), 6 Oct Spain (Poljud, 20:45), 12 Nov England (London), 15 Nov Czechia (Osijek, Opus Arena).\n\nSportingly the post-World Cup priority is tempo: young defence around Gvardiol and Vušković, experience around Modrić/Kovačić, and a clear idea of play rather than pure transition. Full fixtures and TV tips are live in this site’s national-team list – squads only before FIFA windows.",
      hr: "Liga nacija 2026./27. stavlja Vatrene u Ligu A sa Španjolskom, Engleskom i Češkom – najteži mogući uvod za stožer Slavena Bilića pred ciklus Eura 2028. Raspored HNS-a: 26.9. Češka (Prag, 20:45), 29.9. Španjolska (Sevilla, 20:45), 3.10. Engleska (Rijeka, 18:00, bez publike), 6.10. Španjolska (Poljud, 20:45), 12.11. Engleska (London), 15.11. Češka (Osijek, Opus Arena).\n\nSportski nakon SP-a broji tempo: mlada obrana oko Gvardiola i Vuškovića, iskustvo oko Modrića/Kovačića i jasna ideja igre umjesto puke tranzicije. Svi termini i TV savjeti su uživo u listi reprezentacije – sastavi tek pred FIFA prozore.",
    },
    image: {
      url: IMG.nationsLeague,
      alt: {
        de: "UEFA Nations League Logo",
        en: "UEFA Nations League logo",
        hr: "Logo UEFA Lige nacija",
      },
    },
  },
  {
    id: "gvardiol-city-return-2026",
    date: "2026-07-20",
    category: "clubs",
    tag: {
      de: "Premier League",
      en: "Premier League",
      hr: "Premier liga",
    },
    title: {
      de: "Gvardiol zurück bei City: Fokus Club-Saison nach dramatischem WM-Aus",
      en: "Gvardiol back at City: club season focus after dramatic World Cup exit",
      hr: "Gvardiol natrag u Cityju: fokus na klupsku sezonu nakon dramatičnog SP-a",
    },
    summary: {
      de: "Nach dem 1:2 gegen Portugal und der VAR-Diskussion startet der Innenverteidiger in die Premier-League-Vorbereitung – Vertrag bei den Citizens bis 2031.",
      en: "After the 1–2 vs Portugal and VAR debate, the centre-back starts Premier League pre-season – Citizens contract runs to 2031.",
      hr: "Nakon 1:2 protiv Portugala i VAR debate stoper kreće u pripreme Premier lige – ugovor s Citizensima do 2031.",
    },
    body: {
      de: "Joško Gvardiol war im WM-Achtelfinale gegen Portugal (Toronto, 3. Juli) im Zentrum der Diskussion: Sein später Ausgleich wurde per VAR aberkannt, Kroatien schied 1:2 aus. Kroatische und internationale Medien thematisierten danach Form und Belastung nach der langen Verletzungsphase 2025/26. Parallel gilt: Gvardiol hat bei Manchester City langfristig unterschrieben (Berichte bis 2031) und kehrt nun in den Club-Alltag zurück.\n\nFür die Vatreni bleibt er der defensive Anker der Bilić-Ära – nächste Pflichtspiele im September/Oktober. Im Player-Tracker: Club, Status und nächste Matches, sobald Termine anliegen.",
      en: "Joško Gvardiol was at the centre of the World Cup round-of-32 debate vs Portugal (Toronto, 3 July): his late equaliser was ruled out by VAR and Croatia lost 1–2. Croatian and international media later discussed form and load after his long 2025/26 injury lay-off. In parallel he is contracted long-term at Manchester City (reports to 2031) and returns to club pre-season.\n\nFor Croatia he remains the defensive anchor of the Bilić era – next competitive games in September/October. Tracker: club, status and next matches as fixtures land.",
      hr: "Joško Gvardiol bio je u središtu debate nakon SP-a protiv Portugala (Toronto, 3. srpnja): kasni izjednačujući pogodak poništen je VAR-om, Hrvatska ispala 1:2. Hrvatski i strani mediji kasnije su tematizirali formu i opterećenje nakon duge ozljede 2025./26. Paralelno ima dugoročni ugovor u Manchester Cityju (izvještaji do 2031.) i vraća se u klupske pripreme.\n\nZa Vatrene ostaje obrambeni sidro ere Bilića – iduće obvezne utakmice u rujnu/listopadu. Tracker: klub, status i idući mečevi čim stignu termini.",
    },
    playerId: "gvardiol",
    image: {
      url: IMG.gvardiol,
      alt: {
        de: "Joško Gvardiol",
        en: "Joško Gvardiol",
        hr: "Joško Gvardiol",
      },
    },
  },
  {
    id: "youth-pipeline-bilic-2026",
    date: "2026-07-20",
    category: "vatreni",
    tag: {
      de: "Nachwuchs",
      en: "Youth",
      hr: "Mlađi uzrasti",
    },
    title: {
      de: "Pipeline unter Bilić: Vušković, Sučić, Baturina & Co. im Blick",
      en: "Pipeline under Bilić: Vušković, Sučić, Baturina & co. in focus",
      hr: "Pipeline pod Bilićem: Vušković, Sučić, Baturina i ostali u fokusu",
    },
    summary: {
      de: "Nach dem WM-Turnier und dem Trainerwechsel wächst die Chance für die nächste Generation – enge Abstimmung mit U-21-Coach Ivica Olić geplant.",
      en: "After the World Cup and the coaching change, the next generation’s window widens – close coordination with U-21 coach Ivica Olić planned.",
      hr: "Nakon SP-a i smjene izbornika širi se prostor za iduću generaciju – planirana uska suradnja s U-21 trenerom Ivicom Olićem.",
    },
    body: {
      de: "Slaven Bilić betonte bei seiner Präsentation, er wolle mit U-21-Trainer Ivica Olić und Niko Kranjčar zusammenarbeiten. Praktisch rücken Profile wie Luka Vušković (Brighton, WM-Teilnehmer), Martin Baturina, Petar Sučić und weitere HNL-/Europa-Talente in den Fokus des Neuaufbaus – ohne dass der HNS vor den FIFA-Fenstern spekulative Aufstellungen veröffentlicht.\n\nFür den Herbst zählt: Wer in den Clubs Minuten macht, hat bessere Karten für die Nations-League-Nominierungen. Der Tracker auf dieser Seite listet Club, Liga und Verfügbarkeit der kroatischen Profis in Europa.",
      en: "At his unveiling Slaven Bilić stressed he wants to work with U-21 coach Ivica Olić and Niko Kranjčar. In practice profiles such as Luka Vušković (Brighton, World Cup player), Martin Baturina, Petar Sučić and other HNL/Europe talents move into the rebuild spotlight – without HNS publishing speculative line-ups before FIFA windows.\n\nFor autumn what matters: club minutes improve Nations League nomination odds. This site’s tracker lists club, league and availability of Croatians across Europe.",
      hr: "Na predstavljanju je Slaven Bilić naglasio suradnju s U-21 trenerom Ivicom Olićem i Nikom Kranjčarom. U praksi u fokus obnove ulaze profili poput Luke Vuškovića (Brighton, SP-igrač), Martina Baturine, Petra Sučića i drugih talenata iz HNL-a/Europe – bez spekulativnih sastava HNS-a prije FIFA prozora.\n\nZa jesen broji: tko skuplja minute u klubovima ima bolje šanse za nominacije Lige nacija. Tracker na ovoj stranici nudi klub, ligu i dostupnost Hrvata diljem Europe.",
    },
    image: {
      url: IMG.vuskovic,
      alt: {
        de: "Luka Vušković",
        en: "Luka Vušković",
        hr: "Luka Vušković",
      },
    },
  },
  {
    id: "hnl-preseason-euro-clubs-2026",
    date: "2026-07-20",
    category: "hnl",
    tag: {
      de: "HNL",
      en: "HNL",
      hr: "HNL",
    },
    title: {
      de: "HNL-Sommer: Europacup-Quali läuft, Saisonvorbereitung im Fokus",
      en: "HNL summer: European qualifying underway, pre-season in focus",
      hr: "HNL ljeto: europske kvalifikacije u tijeku, fokus na pripreme",
    },
    summary: {
      de: "Während Hajduk die EL-Quali vorantreibt, rüsten Dinamo und die restliche Liga für die neue Meisterschaft – kroatische Spieler im Europa-Radar.",
      en: "As Hajduk push Europa League qualifying, Dinamo and the rest of the league gear up for the new season – Croatians on the Europe radar.",
      hr: "Dok Hajduk gura EL kvalifikacije, Dinamo i ostatak lige spremaju se za novu sezonu – Hrvati na europskom radaru.",
    },
    body: {
      de: "Der kroatische Sommer 2026 steht im Zeichen von Europapokal-Qualifikation und Saisonstart der HNL. Hajduk Split hat sich trotz Rückspiel-Niederlage gegen Žilina für die nächste Europa-League-Runde qualifiziert; Dinamo Zagreb und weitere Klubs stecken in der Vorbereitung. Für den Neuaufbau der Vatreni sind Club-Minuten in HNL und Europa entscheidend – besonders für junge Mittelfeld- und Offensivspieler aus Zagreb und Split.\n\nSpiele mit kroatischer Beteiligung und TV-Hinweise findest du im Dashboard und unter TV & Streams. Nationalteam-Termine bleiben in der Vatreni-Sektion.",
      en: "Croatia’s summer 2026 is defined by European qualifying and HNL pre-season. Hajduk Split advanced in the Europa League despite a return-leg loss to Žilina; Dinamo Zagreb and other clubs are deep in preparations. For the national-team rebuild, club minutes in the HNL and Europe matter – especially for young midfielders and attackers from Zagreb and Split.\n\nMatches with Croatian involvement and TV tips are on the dashboard and under TV & Streams. National-team dates stay in the Vatreni section.",
      hr: "Hrvatsko ljeto 2026. u znaku je europskih kvalifikacija i priprema HNL-a. Hajduk Split prošao je dalje u Europskoj ligi unatoč porazu u uzvratu sa Žilinom; Dinamo Zagreb i ostali klubovi duboko su u pripremama. Za obnovu reprezentacije ključne su klupske minute u HNL-u i Europi – osobito za mlade veznjake i napadače iz Zagreba i Splita.\n\nUtakmice s hrvatskim igračima i TV savjete pratiš na dashboardu i pod TV i streamovi. Termini reprezentacije ostaju u rubrici Vatrenih.",
    },
    image: {
      url: IMG.dinamo,
      alt: {
        de: "Dinamo Zagreb Logo",
        en: "Dinamo Zagreb logo",
        hr: "Grb Dinama Zagreb",
      },
    },
  },
  {
    id: "kovacic-city-leadership-2026",
    date: "2026-07-19",
    category: "clubs",
    tag: {
      de: "Premier League",
      en: "Premier League",
      hr: "Premier liga",
    },
    title: {
      de: "Kovačić bei City: Erfahrener Anker für Club und Vatreni",
      en: "Kovačić at City: experienced anchor for club and Croatia",
      hr: "Kovačić u Cityju: iskusno sidro za klub i Vatrene",
    },
    summary: {
      de: "Nach dem WM-Turnier kehrt der Mittelfeldspieler in die Premier League zurück – für Bilić weiterhin zentrale Anspielstation im A-Team.",
      en: "After the World Cup the midfielder returns to the Premier League – still a central outlet for Bilić’s senior side.",
      hr: "Nakon SP-a veznjak se vraća u Premier ligu – i dalje središnja karika Bilićeva A sastava.",
    },
    body: {
      de: "Mateo Kovačić gehörte zum kroatischen WM-Kader und bildet mit Joško Gvardiol das City-Duo der Vatreni. Nach dem Ausscheiden gegen Portugal und dem Trainerwechsel im Nationalteam startet er in die Club-Saisonvorbereitung – seine Erfahrung im zentralen Mittelfeld bleibt für den Neuaufbau unter Slaven Bilić wertvoll, besonders wenn jüngere Spieler Minuten in Europa brauchen.\n\nStatus und nächste Club-Spiele: Player-Tracker. Länderspiel-Termine: Nationalteam-Sektion ab September.",
      en: "Mateo Kovačić was in Croatia’s World Cup squad and forms the City duo of the Vatreni with Joško Gvardiol. After the Portugal exit and the national-team coaching change he returns to club pre-season – his central-midfield experience remains valuable for Slaven Bilić’s rebuild, especially while younger players chase minutes in Europe.\n\nStatus and next club games: player tracker. Internationals: national-team section from September.",
      hr: "Mateo Kovačić bio je u SP-momčadi i s Joškom Gvardiolom čini City duo Vatrenih. Nakon ispadanja od Portugala i smjene izbornika vraća se u klupske pripreme – iskustvo u središini i dalje je dragocjeno za obnovu Slavena Bilića, osobito dok mlađi igrači love minute u Europi.\n\nStatus i iduće klupske utakmice: tracker. Reprezentacija: rubrika od rujna.",
    },
    playerId: "kovacic",
    image: {
      url: IMG.manCity,
      alt: {
        de: "Manchester City Logo",
        en: "Manchester City logo",
        hr: "Grb Manchester Cityja",
      },
    },
  },
  {
    id: "bilic-rebuild-july-2026",
    date: "2026-07-20",
    featured: true,
    category: "vatreni",
    tag: {
      de: "Aktuell",
      en: "Latest",
      hr: "Aktualno",
    },
    title: {
      de: "Bilić-Ära: Stožer steht, Fokus auf Nations League und EM 2028",
      en: "Bilić era: staff taking shape, focus on Nations League and EURO 2028",
      hr: "Era Bilića: stožer se formira, fokus na Ligu nacija i Euro 2028",
    },
    summary: {
      de: "Wenige Tage nach der Ernennung formiert der neue Auswahler seinen Stab. Der HNS hat ihm laut kroatischen Medien großes Vertrauen ausgesprochen – Zielhorizont EM 2028.",
      en: "Days after his appointment the new coach is forming his staff. Croatian media report strong FA backing – horizon set on EURO 2028.",
      hr: "Nekoliko dana nakon imenovanja novi izbornik formira stožer. Hrvatski mediji javljaju o velikom povjerenju HNS-a – horizont Euro 2028.",
    },
    body: {
      de: "Nach der einstimmigen Ernennung vom 13. Juli arbeitet Slaven Bilić an den ersten strukturellen Schritten: Trainerstab, Gespräche mit Schlüsselspielern und der Blick auf die Herbst-Nations-League. Kroatische Blätter (unter anderem Sportske Novosti, Slobodna Dalmacija, 24sata) berichten von einem starken Vertrauensbeweis des HNS – mit einem mehrjährigen Rahmen, der Richtung EM 2028 und darüber hinaus gedacht ist. Bilić selbst betonte, er sei für ein großes Ergebnis gekommen und sehe drei Fundamente: stabile Verbandsarbeit, Qualität des Kaders und die Erfolge der letzten Jahre.\n\nSportlich stehen die Vatreni in Liga A mit Spanien, England und Tschechien. Erster Pflichttermin: 26. September auswärts gegen Tschechien, danach Spanien, England in Rijeka und Spanien am Poljud. Die komplette Liste der kommenden Länderspiele findest du oben in der Nationalteam-Rubrik – ohne Spekulations-Aufstellungen vor der Nominierung.",
      en: "After the unanimous appointment on 13 July, Slaven Bilić is taking the first structural steps: staff, talks with key players and the autumn Nations League. Croatian outlets (including Sportske Novosti, Slobodna Dalmacija, 24sata) describe strong FA backing – a multi-year framework aimed at EURO 2028 and beyond. Bilić said he came to deliver a big result and named three foundations: federation stability, squad quality and recent success.\n\nCompetitively Croatia sits in League A with Spain, England and Czechia. First competitive date: 26 September away to Czechia, then Spain, England in Rijeka and Spain at Poljud. The full upcoming international list is in the national-team section above – no speculative line-ups before nomination.",
      hr: "Nakon jednoglasnog imenovanja 13. srpnja Slaven Bilić radi prve strukturne korake: stožer, razgovori s ključnim igračima i jesenska Liga nacija. Hrvatski mediji (uključujući Sportske Novosti, Slobodnu Dalmaciju, 24sata) pišu o snažnom povjerenju HNS-a – višegodišnji okvir prema Euru 2028. i dalje. Bilić je rekao da je došao po veliki rezultat i naveo tri temelja: stabilnost saveza, kvalitetu kadra i dosadašnje uspjehe.\n\nNatjecateljski su Vatreni u Ligi A sa Španjolskom, Engleskom i Češkom. Prvi obvezni termin: 26. rujna u gostima kod Češke, zatim Španjolska, Engleska u Rijeci i Španjolska na Poljudu. Kompletan popis idućih utakmica je gore u rubrici reprezentacije – bez spekulativnih sastava prije nominacije.",
    },
    image: {
      url: IMG.bilic,
      alt: {
        de: "Slaven Bilić",
        en: "Slaven Bilić",
        hr: "Slaven Bilić",
      },
    },
  },
  {
    id: "bilic-hns-contract-trust",
    date: "2026-07-19",
    featured: true,
    category: "vatreni",
    tag: {
      de: "HNS",
      en: "HNS",
      hr: "HNS",
    },
    title: {
      de: "HNS setzt auf Bilić: starkes Signal und langfristiger Rahmen",
      en: "HNS backs Bilić: strong signal and long-term framework",
      hr: "HNS uz Bilića: snažan signal i dugoročni okvir",
    },
    summary: {
      de: "Medien berichten von einem mehrjährigen Vertrag und historisch starkem Vertrauen – bei gleichzeitig bescheideneren Bezügen als unter Dalić.",
      en: "Media report a multi-year deal and historically strong trust – with more modest pay than under Dalić.",
      hr: "Mediji pišu o višegodišnjem ugovoru i povijesno jakom povjerenju – uz skromnija primanja nego pod Dalićem.",
    },
    body: {
      de: "Laut übereinstimmenden Berichten kroatischer Medien (u. a. Slobodna Dalmacija, 24sata, gol.dnevnik) hat der HNS mit der Berufung von Slaven Bilić ein bewusstes Signal gesetzt: Kontinuität und Vertrauen nach der Ära Dalić. Genannt werden mehrjährige Vertragsperspektiven (Berichte sprechen von einem Rahmen bis etwa 2028/2030) und ein Paket, das Boni an sportliche Ziele knüpft. Gleichzeitig sei das Grundgehalt spürbar niedriger als jenes von Zlatko Dalić – Bilić habe die Rolle primär als sportliche Mission angenommen.\n\nPraktisch zählt für Fans jetzt der Blick nach vorn: Nations League im September/Oktober gegen Tschechien, Spanien und England, dann der lange Zyklus bis zur EM 2028. Termine und Ergebnisse der Vatreni sind live in der Nationalteam-Sektion dieser Seite.",
      en: "According to converging Croatian media reports (including Slobodna Dalmacija, 24sata, gol.dnevnik), the FA’s appointment of Slaven Bilić was a deliberate signal of continuity and trust after the Dalić era. Reports mention multi-year horizons (around 2028/2030) and bonuses tied to sporting targets. At the same time base pay is said to be clearly lower than Zlatko Dalić’s – Bilić accepted the role primarily as a sporting mission.\n\nFor fans what matters now is the road ahead: Nations League in September/October vs Czechia, Spain and England, then the long cycle to EURO 2028. Fixtures and results are live in this site’s national-team section.",
      hr: "Prema usklađenim izvještajima hrvatskih medija (uključujući SD, 24sata, gol.dnevnik) HNS je imenovanjem Slavena Bilića poslao jasan signal kontinuiteta i povjerenja nakon ere Dalića. Spominju se višegodišnji horizonti (oko 2028./2030.) i bonusi vezani uz sportske ciljeve. Istodobno je osnovna plaća znatno niža od Dalićeve – Bilić je ulogu prihvatio prvenstveno kao sportsku misiju.\n\nNavijačima sada broji put naprijed: Liga nacija u rujnu/listopadu protiv Češke, Španjolske i Engleske, zatim ciklus do Eura 2028. Termini i rezultati su uživo u rubrici reprezentacije na ovoj stranici.",
    },
    image: {
      url: IMG.euro,
      alt: {
        de: "UEFA European Championship Logo",
        en: "UEFA European Championship logo",
        hr: "Logo UEFA Europskog prvenstva",
      },
    },
  },
  {
    id: "nl-autumn-ready-2026",
    date: "2026-07-19",
    category: "preview",
    tag: {
      de: "Nations League",
      en: "Nations League",
      hr: "Liga nacija",
    },
    title: {
      de: "Herbst-Kalender fix: Tschechien, Spanien, England – Osijek im November",
      en: "Autumn calendar set: Czechia, Spain, England – Osijek in November",
      hr: "Jesenski kalendar: Češka, Španjolska, Engleska – Osijek u studenom",
    },
    summary: {
      de: "HNS bestätigt: Heimspiel gegen Tschechien am 15.11. in der Opus Arena. Davor Prag, Sevilla, Rijeka (ohne Fans) und Poljud.",
      en: "HNS confirms: home vs Czechia on 15 Nov at Opus Arena. Before that Prague, Seville, Rijeka (behind closed doors) and Poljud.",
      hr: "HNS potvrđuje: doma protiv Češke 15.11. na Opus Areni. Prije toga Prag, Sevilla, Rijeka (bez publike) i Poljud.",
    },
    body: {
      de: "Der HNS hat die Spielorte für die Nations League 2026/27 (Liga A, Gruppe mit Spanien, England, Tschechien) bekräftigt: Start am 26.09. in Prag gegen Tschechien (20:45), 29.09. in Sevilla gegen Spanien, 03.10. England in Rijeka (18:00, ohne Publikum wegen UEFA-Sanktion), 06.10. Spanien am Poljud, 12.11. England in London, 15.11. Tschechien in Osijek (Opus Arena, 20:45).\n\nFür den Neuaufbau unter Bilić sind das sechs Pflichtspiele gegen absolute Top-Gegner – idealer Maßstab vor dem EM-Zyklus 2028. Alle Termine erscheinen live in der Nationalteam-Liste; Kader werden erst vor den FIFA-Fenstern nominiert.",
      en: "The HNS has confirmed venues for Nations League 2026/27 (League A with Spain, England, Czechia): start 26 Sep in Prague vs Czechia (20:45), 29 Sep in Seville vs Spain, 3 Oct England in Rijeka (18:00, behind closed doors under a UEFA sanction), 6 Oct Spain at Poljud, 12 Nov England in London, 15 Nov Czechia in Osijek (Opus Arena, 20:45).\n\nFor the rebuild under Bilić these are six competitive games against top sides – a clear benchmark before the EURO 2028 cycle. All dates appear live in the national-team list; squads are named only before FIFA windows.",
      hr: "HNS je potvrdio mjesta za Ligu nacija 2026./27. (Liga A sa Španjolskom, Engleskom, Češkom): start 26.9. u Pragu protiv Češke (20:45), 29.9. u Sevilli protiv Španjolske, 3.10. Engleska u Rijeci (18:00, bez publike zbog UEFA kazne), 6.10. Španjolska na Poljudu, 12.11. Engleska u Londonu, 15.11. Češka u Osijeku (Opus Arena, 20:45).\n\nZa obnovu pod Bilićem to je šest obveznih utakmica protiv top rivala – mjerilo pred ciklus Eura 2028. Svi termini su uživo u listi reprezentacije; sastavi se nominiraju tek pred FIFA prozore.",
    },
    image: {
      url: IMG.nationsLeague,
      alt: {
        de: "UEFA Nations League Logo",
        en: "UEFA Nations League logo",
        hr: "Logo UEFA Lige nacija",
      },
    },
  },
  {
    id: "bilic-modric-priority",
    date: "2026-07-18",
    featured: true,
    category: "vatreni",
    tag: {
      de: "Breaking",
      en: "Breaking",
      hr: "Breaking",
    },
    title: {
      de: "Bilić: „Modrić ist meine erste Priorität“",
      en: "Bilić: “Modrić is my first priority”",
      hr: "Bilić: „Modrić je moj prvi prioritet“",
    },
    summary: {
      de: "Der neue Auswahler will zuerst mit dem Kapitän sprechen: „Ich würde absolut, dass er weitermacht – die Entscheidung liegt bei ihm.“",
      en: "The new coach’s first step is talking to the captain: “I would absolutely love him to continue – the decision is entirely his.”",
      hr: "Novi izbornik prvo želi razgovarati s kapetanom: „Apsolutno bih volio da nastavi – odluka je isključivo njegova.“",
    },
    body: {
      de: "Bei seiner ersten Pressekonferenz nach der Ernennung (HNS, 13. Juli) nannte Slaven Bilić den Kontakt zu Luka Modrić als zweiten Schritt nach dem Aufbau des Trainerstabs: „Alle wissen, wer Luka ist – auf Weltniveau. Die Entscheidung ist absolut seine. Ein WM-Turnier mit Luka ist nicht dasselbe wie ohne ihn. Für die Nationalmannschaft ist er viel mehr als nur der beste Spieler. Ich würde absolut, dass er weiterspielt.“\n\nInternationale Medien (unter anderem Goal und Yahoo) griffen das Thema in den folgenden Tagen erneut auf. Parallel berichten italienische Quellen über eine mögliche Milan-Verlängerung um ein Jahr. Im Tracker und Profil auf dieser Seite: Club, Status und nächste Länderspiel-Termine – ohne spekulative Aufstellungen.",
      en: "At his first press conference after appointment (HNS, 13 July), Slaven Bilić named contact with Luka Modrić as the second step after building his staff: “Everyone knows who Luka is – at world level. The decision is absolutely his. A World Cup with Luka is not the same without him. For the national team he is much more than the best player. I would absolutely love him to continue.”\n\nInternational outlets including Goal and Yahoo kept the story alive in the days after. Italian media in parallel report a possible one-year Milan extension. On this site: club, status and next internationals in tracker and profile – no speculative line-ups.",
      hr: "Na prvoj konferenciji nakon imenovanja (HNS, 13. srpnja) Slaven Bilić je kontakt s Lukom Modrićem naveo kao drugi korak nakon formiranja stožera: „Svi znamo tko je Luka – na svjetskoj razini. Odluka je apsolutno njegova. Svjetsko prvenstvo nije isto kad je Luka na njemu i kad nije. U reprezentaciji je puno više od najboljeg igrača. Volio bih apsolutno da nastavi.“\n\nMeđunarodni mediji (uključujući Goal i Yahoo) temu su nastavili sljedećih dana. Talijanski izvori paralelno pišu o mogućem jednogodišnjem produženju u Milanu. Na ovoj stranici: klub, status i idući termini u trackeru i profilu – bez spekulativnih sastava.",
    },
    playerId: "modric",
    image: {
      url: IMG.modric,
      alt: {
        de: "Luka Modrić",
        en: "Luka Modrić",
        hr: "Luka Modrić",
      },
    },
  },
  {
    id: "zvonarek-estrela-2026",
    date: "2026-07-17",
    category: "transfer",
    tag: {
      de: "Transfer",
      en: "Transfer",
      hr: "Transfer",
    },
    title: {
      de: "Lovro Zvonarek wechselt zu Estrela Amadora",
      en: "Lovro Zvonarek moves to Estrela Amadora",
      hr: "Lovro Zvonarek preselio u Estrelu Amadoru",
    },
    summary: {
      de: "Der kroatische U-21-Nationalspieler wechselt nach Portugal – HNS meldete den Transfer am 17. Juli 2026.",
      en: "The Croatia U-21 international heads to Portugal – HNS reported the move on 17 July 2026.",
      hr: "Hrvatski U-21 reprezentativac seli u Portugal – HNS je transfer objavio 17. srpnja 2026.",
    },
    body: {
      de: "Laut HNS (17. Juli 2026) hat Lovro Zvonarek den Wechsel in die portugiesische Liga zu Estrela Amadora vollzogen. Der Offensivspieler gehört zum Nachwuchskader der Vatreni und sammelt damit Spielpraxis in einem europäischen Erstligaklub.\n\nSolche Bewegungen junger Kroaten sind für den Neuaufbau unter Bilić und U-21-Trainer Ivica Olić relevant – die A-Nationalmannschaft nominiert weiterhin erst vor den FIFA-Fenstern.",
      en: "Per HNS (17 July 2026), Lovro Zvonarek completed a move to Portuguese side Estrela Amadora. The attacker is part of Croatia’s youth setup and will gain minutes in a top-flight European club.\n\nYoung Croatian moves matter for the rebuild under Bilić and U-21 coach Ivica Olić – the senior team still names squads only before FIFA windows.",
      hr: "Prema HNS-u (17. srpnja 2026.) Lovro Zvonarek je preselio u portugalsku Estrelu Amadoru. Ofenzivac je dio mlađih uzrasta Vatrenih i sakupljat će minute u europskoj prvoj ligi.\n\nTakvi transferi mladih Hrvata važni su za obnovu pod Bilićem i U-21 izbornikom Ivicom Olićem – A sastav se i dalje nominira tek pred FIFA prozore.",
    },
    image: {
      url: IMG.premierLeague,
      alt: {
        de: "Premier League Logo",
        en: "Premier League logo",
        hr: "Logo Premier lige",
      },
    },
  },
  {
    id: "hajduk-el-qual-2026",
    date: "2026-07-16",
    category: "clubs",
    tag: {
      de: "Europa League",
      en: "Europa League",
      hr: "Europska liga",
    },
    title: {
      de: "Hajduk im EL-2. Vorrunde – trotz Rückspiel-Niederlage gegen Žilina",
      en: "Hajduk through to EL 2nd qualifying round despite Žilina return loss",
      hr: "Hajduk u 2. pretkolu EL-a – unatoč porazu u uzvratu sa Žilinom",
    },
    summary: {
      de: "Die Splitter setzten sich im Gesamtergebnis durch und sind im nächsten Europa-League-Quali-Runde – HNS/Hajduk-Berichterstattung 16. Juli.",
      en: "The Split side advanced on aggregate into the next Europa League qualifying round – HNS/Hajduk coverage 16 July.",
      hr: "Splićani su prošli ukupnim rezultatom u iduće pretkolo Europske lige – izvještaji HNS/Hajduk 16. srpnja.",
    },
    body: {
      de: "Am 16. Juli 2026 meldeten kroatische Medien und HNS: Im Rückspiel gegen MŠK Žilina reichte es für Hajduk Split trotz einer Niederlage im Einzelspiel, weil der Gesamtscore den Einzug ins zweite Europa-League-Vorrunde sicherte. Für kroatische Klubs ist der europäische Sommer der wichtigste Einstieg vor der HNL – Ergebnisse und kroatische Spieler in Europa findest du im Spiele-Dashboard dieser Seite.",
      en: "On 16 July 2026 Croatian media and HNS reported: despite losing the return leg to MŠK Žilina, Hajduk Split progressed on aggregate into the Europa League second qualifying round. For Croatian clubs the European summer is the key run-in before the HNL – results and Croatians in Europe are on this site’s matches dashboard.",
      hr: "16. srpnja 2026. hrvatski mediji i HNS javljaju: unatoč porazu u uzvratu protiv MŠK Žiline, Hajduk Split je ukupnim rezultatom osigurao prolaz u drugo pretkolo Europske lige. Za hrvatske klubove europsko ljeto ključni je uvod u HNL – rezultate i Hrvate u Europi pratiš na dashboardu utakmica.",
    },
    image: {
      url: IMG.hajduk,
      alt: {
        de: "Hajduk Split Logo",
        en: "Hajduk Split logo",
        hr: "Grb Hajduka",
      },
    },
  },
  {
    id: "skoric-retirement-2026",
    date: "2026-07-16",
    category: "vatreni",
    tag: {
      de: "Karriereende",
      en: "Retirement",
      hr: "Kraj karijere",
    },
    title: {
      de: "Mile Škorić beendet seine Profikarriere",
      en: "Mile Škorić ends professional career",
      hr: "Mile Škorić okončao nogometnu karijeru",
    },
    summary: {
      de: "Der Ex-Nationalspieler (7 Länderspiele) hört wegen Knieproblemen auf – zuletzt bei Rijeka, HNS 16. Juli 2026.",
      en: "The former international (7 caps) retires due to knee issues – last club Rijeka, HNS 16 July 2026.",
      hr: "Bivši reprezentativac (7 nastupa) završava zbog koljena – zadnji klub Rijeka, HNS 16. srpnja 2026.",
    },
    body: {
      de: "HNS.team (16.07.2026): Mile Škorić beendet seine Laufbahn. In den letzten 18 Monaten spielte er für Rijeka, kam wegen schwerer Knieprobleme aber nur noch auf drei Einsätze. „Jede Reise endet irgendwann. Wegen der Verletzung beende ich meine Profikarriere…“, schrieb er auf Social Media. Für die Vatreni brachte er es auf sieben Länderspiele; der letzte Einsatz war im März 2022 gegen Bulgarien. Stationen unter anderem: Osijek, Gorica, Cangzhou und Tianjin in China.",
      en: "HNS.team (16 July 2026): Mile Škorić has retired. In the last 18 months at Rijeka he managed only three appearances due to serious knee problems. “Every journey ends. Because of the injury I am ending my professional career…,” he wrote on social media. He earned seven Croatia caps; last appearance March 2022 vs Bulgaria. Clubs included Osijek, Gorica, and Chinese sides Cangzhou and Tianjin.",
      hr: "HNS.team (16.7.2026.): Mile Škorić završava karijeru. U zadnjih 18 mjeseci u Rijeci upisao je samo tri nastupa zbog teških problema s koljenom. „Svako putovanje jednom dođe kraju. Zbog ozljede završavam profesionalnu karijeru…“, napisao je na društvenim mrežama. Za Vatrene je imao sedam nastupa; zadnji u ožujku 2022. protiv Bugarske. Klubovi: Osijek, Gorica, te kineski Cangzhou i Tianjin.",
    },
    image: {
      url: IMG.croatia,
      alt: {
        de: "Kroatien Nationalteam",
        en: "Croatia national team",
        hr: "Hrvatska reprezentacija",
      },
    },
  },
  {
    id: "vuskovic-brighton-2026",
    date: "2026-07-14",
    featured: true,
    category: "transfer",
    tag: {
      de: "Premier League",
      en: "Premier League",
      hr: "Premier liga",
    },
    title: {
      de: "Vušković zu Brighton: Rekordtransfer ~£46 Mio.",
      en: "Vušković to Brighton: club-record ~£46m deal",
      hr: "Vušković u Brighton: rekordni transfer ~46 mil. £",
    },
    summary: {
      de: "Der 19-jährige WM-Teilnehmer wechselt von Tottenham zu den Seagulls – Fünfjahresvertrag plus Option (BBC, ESPN, HNS).",
      en: "The 19-year-old World Cup player leaves Tottenham for the Seagulls – five-year deal plus option (BBC, ESPN, HNS).",
      hr: "19-godišnji SP-igrač napušta Tottenham i ide u Seagullse – petogodišnji ugovor plus opcija (BBC, ESPN, HNS).",
    },
    body: {
      de: "Am 14. Juli 2026 bestätigten Brighton und HNS: Luka Vušković wechselt von Tottenham Hotspur zu Brighton & Hove Albion. BBC und Guardian nannten eine Klub-Rekordsumme von etwa 46 Mio. Pfund (bis ~50 Mio. mit Zusatzzahlungen); Transfermarkt nannte rund 54 Mio. €. Vertrag: fünf Jahre bis 2031 mit Option auf ein weiteres Jahr. Der Innenverteidiger spielte für Kroatien bei der WM 2026 und gilt als eines der größten Talente seiner Generation. Im Player-Tracker dieser Seite: Club-Update und Verfügbarkeit.",
      en: "On 14 July 2026 Brighton and HNS confirmed: Luka Vušković joins Brighton & Hove Albion from Tottenham Hotspur. BBC and The Guardian cited a club-record fee of about £46m (up to ~£50m with add-ons); Transfermarkt listed around €54m. Contract: five years to 2031 with a one-year option. The centre-back featured for Croatia at World Cup 2026 and is among Europe’s top young defenders. On this site’s tracker: club update and availability.",
      hr: "14. srpnja 2026. Brighton i HNS potvrdili: Luka Vušković prelazi iz Tottenhama u Brighton & Hove Albion. BBC i Guardian navode klupski rekord od oko 46 mil. £ (do ~50 mil. s bonusima); Transfermarkt oko 54 mil. €. Ugovor: pet godina do 2031. s opcijom. Stoper je igrao za Hrvatsku na SP-u 2026. i spada među najveće talente generacije. U trackeru na ovoj stranici: klub i dostupnost.",
    },
    playerId: "vuskovic",
    image: {
      url: IMG.vuskovic,
      alt: {
        de: "Luka Vušković",
        en: "Luka Vušković",
        hr: "Luka Vušković",
      },
    },
  },
  {
    id: "nl-osijek-czechia-2026",
    date: "2026-07-14",
    category: "preview",
    tag: {
      de: "Nations League",
      en: "Nations League",
      hr: "Liga nacija",
    },
    title: {
      de: "Nations League: Tschechien-Heimspiel in Osijek – voller Herbst-Fahrplan",
      en: "Nations League: Czechia at home in Osijek – full autumn roadmap",
      hr: "Liga nacija: Češka u Osijeku – kompletan jesenski raspored",
    },
    summary: {
      de: "HNS: 15.11. Tschechien in der Opus Arena. Davor Prag, Sevilla, England in Rijeka (ohne Fans), Spanien am Poljud.",
      en: "HNS: 15 Nov Czechia at Opus Arena. Before that Prague, Seville, England in Rijeka (behind closed doors), Spain at Poljud.",
      hr: "HNS: 15.11. Češka na Opus Areni. Prije toga Prag, Sevilla, Engleska u Rijeci (bez publike), Španjolska na Poljudu.",
    },
    body: {
      de: "Der HNS-Vorstand entschied am 14. Juli 2026: Das Heimspiel gegen Tschechien in der Nations League 2026/27 (Liga A, Gruppe 3 mit Spanien, England, Tschechien) findet am 15. November um 20:45 in Osijek (Opus Arena) statt. Vollständiger Kalender laut HNS: 26.09. Tschechien–Kroatien (Prag, 20:45), 29.09. Spanien–Kroatien (Sevilla, 20:45), 03.10. Kroatien–England (Rijeka, 18:00), 06.10. Kroatien–Spanien (Poljud Split, 20:45), 12.11. England–Kroatien (London, 20:45), 15.11. Kroatien–Tschechien (Osijek). UEFA-Sanktion: Heimspiel gegen England in Rijeka ohne Publikum; Auswärtsspiel in Prag ohne kroatische Auswärtskarten. Viertelfinale NL: 25.–30.03.2027; Final Four: 9.–13.06.2027. Details auch in der Nationalteam-Rubrik.",
      en: "The HNS executive board decided on 14 July 2026: home vs Czechia in Nations League 2026/27 (League A, Group 3 with Spain, England, Czechia) is on 15 November at 20:45 in Osijek (Opus Arena). Full HNS calendar: 26 Sep Czechia–Croatia (Prague, 20:45), 29 Sep Spain–Croatia (Seville, 20:45), 3 Oct Croatia–England (Rijeka, 18:00), 6 Oct Croatia–Spain (Poljud Split, 20:45), 12 Nov England–Croatia (London, 20:45), 15 Nov Croatia–Czechia (Osijek). UEFA sanction: home vs England in Rijeka behind closed doors; no away tickets for Croatians in Prague. NL quarters 25–30 Mar 2027; Final Four 9–13 Jun 2027. Also listed under National team.",
      hr: "Izvršni odbor HNS-a 14. srpnja 2026. odlučio: domaća utakmica protiv Češke u Ligi nacija 2026./27. (Liga A, skupina 3 sa Španjolskom, Engleskom i Češkom) igra se 15. studenoga u 20:45 u Osijeku (Opus Arena). Kompletan raspored: 26.9. Češka–Hrvatska (Prag, 20:45), 29.9. Španjolska–Hrvatska (Sevilla, 20:45), 3.10. Hrvatska–Engleska (Rijeka, 18:00), 6.10. Hrvatska–Španjolska (Poljud, 20:45), 12.11. Engleska–Hrvatska (London, 20:45), 15.11. Hrvatska–Češka (Osijek). UEFA kazna: doma protiv Engleske u Rijeci bez publike; u Pragu bez ulaznica za hrvatske navijače. Četvrtfinale LN 25.–30.3.2027.; Final Four 9.–13.6.2027. Detalji i u rubrici reprezentacije.",
    },
    image: {
      url: IMG.croatiaEspn,
      alt: {
        de: "Kroatien",
        en: "Croatia",
        hr: "Hrvatska",
      },
    },
  },
  {
    id: "modric-milan-extension",
    date: "2026-07-14",
    category: "clubs",
    tag: {
      de: "Serie A",
      en: "Serie A",
      hr: "Serie A",
    },
    title: {
      de: "Modrić vor Verlängerung bei Milan?",
      en: "Modrić set for Milan contract extension?",
      hr: "Modrić pred produženjem u Milanu?",
    },
    summary: {
      de: "Nach dem WM-Aus berichten Goal und italienische Medien von intensiven Gesprächen über ein weiteres Jahr bis 2027.",
      en: "After the World Cup exit, Goal and Italian media report intensive talks about another year through 2027.",
      hr: "Nakon SP-a Goal i talijanski mediji pišu o intenzivnim razgovorima o još godini dana do 2027.",
    },
    body: {
      de: "Mehrere Quellen (Goal, italienische Blätter, Zusammenfassungen unter anderem auf Yahoo) melden nach Kroatiens WM-Aus, dass AC Milan Luka Modrić von einer Vertragsverlängerung überzeugen will – Szenario oft: ein weiteres Jahr bis 2027 mit gesteuerten Minuten. Offiziell gilt: Solange kein Vertrag publiziert ist, bleibt der Tracker-Status an Club und Saisonfenster gekoppelt. Parallel ist die Nationalmannschaftsfrage unter Bilić das große Thema – siehe eigene Story.",
      en: "Several sources (Goal, Italian press, Yahoo round-ups) report after Croatia’s World Cup exit that AC Milan are pushing to keep Luka Modrić – often a one-year scenario to 2027 with managed minutes. Until a deal is official, tracker status follows club and season window. In parallel, the national-team question under Bilić is the big story – see separate article.",
      hr: "Više izvora (Goal, talijanski tisak, sažeci na Yahoo) nakon SP-a javlja da AC Milan gura produženje s Lukom Modrićem – često scenarij još godina dana do 2027. s kontroliranim minutama. Dok ugovor nije služben, status u trackeru prati klub. Paralelno je pitanje reprezentacije pod Bilićem glavna tema – vidi zasebnu vijest.",
    },
    playerId: "modric",
    image: {
      url: IMG.milan,
      alt: {
        de: "AC Milan Logo",
        en: "AC Milan logo",
        hr: "Grb AC Milana",
      },
    },
  },
  {
    id: "bilic-new-coach-2026",
    date: "2026-07-13",
    featured: true,
    category: "vatreni",
    tag: {
      de: "Breaking",
      en: "Breaking",
      hr: "Breaking",
    },
    title: {
      de: "Slaven Bilić ist neuer Trainer der Vatreni",
      en: "Slaven Bilić named new Croatia head coach",
      hr: "Slaven Bilić novi je izbornik Vatrene",
    },
    summary: {
      de: "HNS ernennt Bilić einstimmig – zweite Amtszeit nach 2006–2012. Nachfolger von Zlatko Dalić nach dem WM-Aus.",
      en: "HNS appoints Bilić unanimously – second spell after 2006–2012. Successor to Zlatko Dalić after the World Cup exit.",
      hr: "HNS jednoglasno imenuje Bilića – drugi mandat nakon 2006.–2012. Nasljednik Zlatka Dalića nakon ispadanja s SP-a.",
    },
    body: {
      de: "Am 13. Juli 2026 hat der Exekutivausschuss des HNS auf Vorschlag von Präsident Marijan Kustić einstimmig Slaven Bilić zum Auswahler der A-Nationalmannschaft ernannt – bestätigt unter anderem von ESPN, Reuters und Sky. Bilić trainierte die Vatreni bereits 2006–2012 und kehrt als erfahrenerer Coach zurück.\n\nKustić: „Es ist nicht leicht, Zlatko nachzufolgen, aber wir sind überzeugt, dass Slaven die richtige Person ist.“ Bilić: „Ich weiß, was erwartet wird. Ich habe großes Vertrauen in die Spieler – ich bringe Energie, Ambition und Entschlossenheit, damit Kroatien in der Elite bleibt. EM 2028 steht mir im Kopf.“ Erste Schritte: Trainerstab bilden, dann Spieler – allen voran Luka Modrić. Nächste Pflichtspiele: Nations League ab 26. September (Tschechien in Prag).",
      en: "On 13 July 2026 the HNS executive board, on president Marijan Kustić’s proposal, unanimously appointed Slaven Bilić as senior head coach – confirmed among others by ESPN, Reuters and Sky. Bilić led Croatia from 2006 to 2012 and returns more experienced.\n\nKustić: “It is not easy to succeed Zlatko, but we are sure Slaven is the right person.” Bilić: “I know what is expected. I have great faith in the players – I will bring energy, ambition and resolve so Croatia stays among the elite. EURO 2028 is in my head.” First steps: form staff, then talk to players – especially Luka Modrić. Next competitive fixtures: Nations League from 26 September (Czechia in Prague).",
      hr: "13. srpnja 2026. Izvršni odbor HNS-a na prijedlog predsjednika Marijana Kustića jednoglasno je imenovao Slavena Bilića izbornikom A reprezentacije – potvrđeno među ostalim na ESPN-u, Reutersu i Skyju. Bilić je Vatrene vodio 2006.–2012. i vraća se iskusniji.\n\nKustić: „Nije lako naslijediti Zlatka, ali uvjereni smo da je Slaven prava osoba.“ Bilić: „Znam što se očekuje. Imam veliku vjeru u igrače – donosim energiju, ambiciju i odlučnost da Hrvatska ostane u eliti. Euro 2028. mi je u glavi.“ Prvi koraci: stožer, zatim igrači – posebno Luka Modrić. Iduće utakmice: Liga nacija od 26. rujna (Češka u Pragu).",
    },
    image: {
      url: IMG.bilic,
      alt: {
        de: "Slaven Bilić",
        en: "Slaven Bilić",
        hr: "Slaven Bilić",
      },
    },
  },
  {
    id: "bilic-presser-pillars",
    date: "2026-07-13",
    category: "vatreni",
    tag: {
      de: "Pressekonferenz",
      en: "Press conference",
      hr: "Konferencija",
    },
    title: {
      de: "Bilić: „Drei Fundamente – Verband, Kader, Erfolge“",
      en: "Bilić: “Three foundations – federation, squad, past success”",
      hr: "Bilić: „Tri temelja – savez, momčad, dosadašnji rezultati“",
    },
    summary: {
      de: "Erste PK des neuen Auswahler: Stabilität des HNS, Qualität der WM-Mannschaft und die Erfolge seit 1998 – Ziel EM 2028.",
      en: "New coach’s first presser: HNS stability, quality of the World Cup squad and success since 1998 – target EURO 2028.",
      hr: "Prva konferencija novog izbornika: stabilnost HNS-a, kvaliteta SP-momčadi i uspjesi od 1998. – cilj Euro 2028.",
    },
    body: {
      de: "Bei der Inaugurations-PK (HNS, 13. Juli 2026) sagte Bilić, er sei gekommen, um ein großes Ergebnis zu liefern – drei Fundamente: Stabilität des Verbands, Qualität der WM-Mannschaft und die Erfolge seit 1998, besonders unter Dalić. „In meinem Kopf steht zuerst die EM 2028.“\n\nZur Nations League will er kein reines „Opfer für den Aufbau“. Zum WM-Auftritt: „Der Eindruck war besser als das Ergebnis.“ Die VAR-Szene am Ende empfand er als ungerecht. Zusammenarbeit mit U-21-Trainer Ivica Olić und Niko Kranjčar ist ausdrücklich erwünscht.",
      en: "At the inauguration presser (HNS, 13 July 2026) Bilić said he came to deliver a big result – three foundations: federation stability, quality of the World Cup squad and success since 1998, especially under Dalić. “EURO 2028 is first in my head.”\n\nOn the Nations League he rejects pure “sacrifice for preparation.” On the World Cup: “The impression was better than the result.” He felt the late VAR call was unjust. Working with U-21 coach Ivica Olić and Niko Kranjčar is explicitly desired.",
      hr: "Na inauguracijskoj konferenciji (HNS, 13. srpnja 2026.) Bilić je rekao da je došao napraviti veliki rezultat – tri temelja: stabilnost saveza, kvaliteta SP-momčadi i uspjesi od 1998., osobito pod Dalićem. „U glavi mi je prvo Euro 2028.“\n\nLigu nacija ne želi žrtvovati samo za uigravanje. O SP-u: „Dojam je bolji od rezultata.“ Za VAR na kraju smatra da su pokradeni. Suradnja s U-21 izbornikom Ivicom Olićem i Nikom Kranjčarom izričito je željena.",
    },
    image: {
      url: IMG.euro,
      alt: {
        de: "UEFA EM Logo",
        en: "UEFA EURO logo",
        hr: "Logo UEFA Eura",
      },
    },
  },
  {
    id: "dalic-steps-down-2026",
    date: "2026-07-08",
    category: "vatreni",
    tag: {
      de: "Nationalteam",
      en: "National team",
      hr: "Reprezentacija",
    },
    title: {
      de: "Ära Dalić beendet: Abschied nach fast neun Jahren",
      en: "Dalić era ends: departure after nearly nine years",
      hr: "Kraj ere Dalića: odlazak nakon gotovo devet godina",
    },
    summary: {
      de: "Zlatko Dalić tritt nach der WM 2026 zurück – Silber 2018, Bronze 2022, NL-Finale 2023. Vertrag endete mit dem Turnier.",
      en: "Zlatko Dalić steps down after World Cup 2026 – silver 2018, bronze 2022, NL final 2023. Contract ended with the tournament.",
      hr: "Zlatko Dalić odlazi nakon SP-a 2026. – srebro 2018., bronca 2022., finale LN 2023. Ugovor je istekao s turnirom.",
    },
    body: {
      de: "Anfang Juli 2026 endete die Amtszeit von Zlatko Dalić (seit Oktober 2017). Sky/Reuters und HNS-Berichterstattung: Nach dem Ausscheiden gegen Portugal und dem Vertragsende zum Turnierschluss verließ Kroatiens erfolgreichster Trainer den Posten – 111 Länderspiele als Coach. Bilanz: WM-Silber 2018, Bronze 2022, Nations-League-Finale 2023, ungeschlagene Quali zur WM 2026. Dalić kritisierte die VAR-Entscheidung beim aberkannten Ausgleich von Gvardiol. Nachfolger ab 13. Juli: Slaven Bilić.",
      en: "In early July 2026 Zlatko Dalić’s tenure (since October 2017) ended. Sky/Reuters and HNS reporting: after the Portugal exit and a contract that expired at the end of the tournament, Croatia’s most successful coach left the role – 111 matches as manager. Record: World Cup silver 2018, bronze 2022, Nations League final 2023, unbeaten path to World Cup 2026. Dalić criticized the VAR call that ruled out Gvardiol’s equaliser. Successor from 13 July: Slaven Bilić.",
      hr: "Početkom srpnja 2026. završio je mandat Zlatka Dalića (od listopada 2017.). Sky/Reuters i HNS: nakon ispadanja od Portugala i ugovora do kraja turnira otišao je najuspješniji hrvatski izbornik – 111 utakmica na klupi. Bilans: srebro SP 2018., bronca 2022., finale Lige nacija 2023., neporažene kvalifikacije za SP 2026. Dalić je kritizirao VAR zbog poništenog izjednačenja Gvardiola. Nasljednik od 13. srpnja: Slaven Bilić.",
    },
    image: {
      url: IMG.croatia,
      alt: {
        de: "Kroatien Nationalteam",
        en: "Croatia national team",
        hr: "Hrvatska reprezentacija",
      },
    },
  },
  {
    id: "wc-portugal-exit",
    date: "2026-07-03",
    category: "vatreni",
    tag: {
      de: "WM 2026",
      en: "World Cup 2026",
      hr: "SP 2026",
    },
    title: {
      de: "WM-Aus: Portugal schlägt Kroatien 2:1 in Toronto",
      en: "World Cup exit: Portugal beat Croatia 2–1 in Toronto",
      hr: "Ispadanje s SP-a: Portugal 2:1 Hrvatska u Torontu",
    },
    summary: {
      de: "Runde der letzten 32 – Gvardiols später Ausgleich per VAR aberkannt. Gruppe L: England 4:2, Panama 0:1, Ghana 2:1.",
      en: "Round of 32 – Gvardiol’s late equaliser ruled out by VAR. Group L: England 4–2, Panama 0–1, Ghana 2–1.",
      hr: "Round of 32 – Gvardiolovo kasno izjednačenje poništeno VAR-om. Skupina L: Engleska 4:2, Panama 0:1, Gana 2:1.",
    },
    body: {
      de: "Am 3. Juli 2026 (01:00 Ortszeit) verlor Kroatien im WM-Achtelfinale – in der neuen 48er-WM-Struktur die Runde der letzten 32 – mit 1:2 gegen Portugal im Toronto Stadium (HNS: „Round of 32“). Berichte nennen ein aberkanntes Ausgleichstor von Joško Gvardiol in der Nachspielzeit (unter anderem Snickometer/VAR). Gruppe L: Niederlage 2:4 gegen England (Dallas), Sieg 1:0 gegen Panama (Toronto, Budimir), Sieg 2:1 gegen Ghana (Philadelphia). Danach Abschied Dalićs und Start der Ära Bilić. Alle Termine der Nations League im Herbst stehen in der Nationalteam-Rubrik.",
      en: "On 3 July 2026 (01:00 local) Croatia lost 1–2 to Portugal in the World Cup knockout round of 32 at Toronto Stadium (HNS: “Round of 32” in the expanded 48-team format). Reports cite a disallowed Joško Gvardiol equaliser in stoppage time (VAR/snickometer). Group L: 2–4 loss to England (Dallas), 1–0 win over Panama (Toronto, Budimir), 2–1 win over Ghana (Philadelphia). Then Dalić’s exit and the Bilić era. Autumn Nations League dates are under National team.",
      hr: "3. srpnja 2026. (01:00) Hrvatska je izgubila 1:2 od Portugala u nokaut fazi SP-a – Round of 32 u proširenom formatu s 48 momčadi – na Toronto Stadiumu (HNS). Izvještaji spominju poništeni pogodak Joška Gvardiola u nadoknadi (VAR). Skupina L: poraz 2:4 od Engleske (Dallas), pobjeda 1:0 nad Panamom (Toronto, Budimir), pobjeda 2:1 nad Ganom (Philadelphia). Zatim odlazak Dalića i era Bilića. Jesenski termini Lige nacija su u rubrici reprezentacije.",
    },
    playerId: "gvardiol",
    image: {
      url: IMG.worldCup,
      alt: {
        de: "FIFA World Cup Logo",
        en: "FIFA World Cup logo",
        hr: "Logo FIFA Svjetskog prvenstva",
      },
    },
  },
];

/**
 * Live-Anker + redaktionelle Stories, neueste zuerst
 */
export function getDailyNews(
  now = new Date(),
  live?: { matches?: Match[]; players?: Player[] }
): NewsArticle[] {
  const today = todayIso(now);
  const matches = live?.matches ?? [];
  const generated: NewsArticle[] = [];

  const nt = filterNationalTeamMatches(matches);

  const nextNt = nt
    .filter(
      (m) =>
        m.status === "scheduled" ||
        m.status === "live" ||
        m.status === "halftime" ||
        m.status === "postponed"
    )
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())[0];

  if (nextNt) {
    generated.push({
      id: `live-next-${nextNt.id}`,
      date: today,
      featured: true,
      category: "live",
      tag: { de: "Termin", en: "Fixture", hr: "Termin" },
      title: {
        de: `Nächstes Länderspiel: ${nextNt.homeTeam} – ${nextNt.awayTeam}`,
        en: `Next international: ${nextNt.homeTeam} – ${nextNt.awayTeam}`,
        hr: `Iduća utakmica: ${nextNt.homeTeam} – ${nextNt.awayTeam}`,
      },
      summary: {
        de: `${fmtKick(nextNt.kickoff, "de")} · ${nextNt.leagueName}${nextNt.venue ? ` · ${nextNt.venue}` : ""}`,
        en: `${fmtKick(nextNt.kickoff, "en")} · ${nextNt.leagueName}${nextNt.venue ? ` · ${nextNt.venue}` : ""}`,
        hr: `${fmtKick(nextNt.kickoff, "hr")} · ${nextNt.leagueName}${nextNt.venue ? ` · ${nextNt.venue}` : ""}`,
      },
      body: {
        de: `Live-API-Stand: Das nächste Kroatien-Länderspiel ist ${nextNt.homeTeam} gegen ${nextNt.awayTeam} am ${fmtKick(nextNt.kickoff, "de")}. Wettbewerb: ${nextNt.leagueName}. ${nextNt.venue ? `Ort: ${nextNt.venue}.` : ""} Unter Bilić starten die Vatreni den neuen Zyklus – Details in der Nationalteam-Rubrik.`,
        en: `Live API: Croatia’s next international is ${nextNt.homeTeam} vs ${nextNt.awayTeam} on ${fmtKick(nextNt.kickoff, "en")}. Competition: ${nextNt.leagueName}. ${nextNt.venue ? `Venue: ${nextNt.venue}.` : ""} Under Bilić the new cycle begins – details in the national-team section.`,
        hr: `Live API: iduća utakmica je ${nextNt.homeTeam} – ${nextNt.awayTeam}, ${fmtKick(nextNt.kickoff, "hr")}. Natjecanje: ${nextNt.leagueName}. ${nextNt.venue ? `Mjesto: ${nextNt.venue}.` : ""} Pod Bilićem počinje novi ciklus – detalji u rubrici reprezentacije.`,
      },
      image: {
        url: IMG.nationsLeague,
        alt: {
          de: "UEFA Nations League",
          en: "UEFA Nations League",
          hr: "UEFA Liga nacija",
        },
      },
    });
  }

  const lastNt = nt
    .filter((m) => m.status === "finished" && m.homeScore != null && m.awayScore != null)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())[0];

  if (lastNt) {
    generated.push({
      id: `live-result-${lastNt.id}`,
      date: lastNt.kickoff.slice(0, 10),
      category: "live",
      tag: { de: "Ergebnis", en: "Result", hr: "Rezultat" },
      title: {
        de: `${lastNt.homeTeam} ${lastNt.homeScore}:${lastNt.awayScore} ${lastNt.awayTeam}`,
        en: `${lastNt.homeTeam} ${lastNt.homeScore}–${lastNt.awayScore} ${lastNt.awayTeam}`,
        hr: `${lastNt.homeTeam} ${lastNt.homeScore}:${lastNt.awayScore} ${lastNt.awayTeam}`,
      },
      summary: {
        de: `Beendetes Länderspiel · ${lastNt.leagueName} · ${fmtDate(lastNt.kickoff, "de")}`,
        en: `Finished international · ${lastNt.leagueName} · ${fmtDate(lastNt.kickoff, "en")}`,
        hr: `Završena utakmica · ${lastNt.leagueName} · ${fmtDate(lastNt.kickoff, "hr")}`,
      },
      body: {
        de: `Endstand laut Live-Daten: ${lastNt.homeTeam} ${lastNt.homeScore}:${lastNt.awayScore} ${lastNt.awayTeam}. Quelle: angebundene Sport-APIs. Vollständige Liste unter Nationalteam → Ergebnisse.`,
        en: `Final score per live data: ${lastNt.homeTeam} ${lastNt.homeScore}–${lastNt.awayScore} ${lastNt.awayTeam}. Source: connected sports APIs. Full list under National team → results.`,
        hr: `Konačni rezultat prema live podacima: ${lastNt.homeTeam} ${lastNt.homeScore}:${lastNt.awayScore} ${lastNt.awayTeam}. Izvor: sportski API-ji. Potpuni popis pod Reprezentacija.`,
      },
      image: {
        url: IMG.croatia,
        alt: {
          de: "Kroatien",
          en: "Croatia",
          hr: "Hrvatska",
        },
      },
    });
  }

  const liveClub = matches.find(
    (m) =>
      isLiveStatus(m.status) &&
      m.croatianPlayers.length > 0 &&
      !/croat|kroat|hrvat/i.test(`${m.homeTeam} ${m.awayTeam}`)
  );
  if (liveClub) {
    const names = liveClub.croatianPlayers
      .slice(0, 4)
      .map((p) => p.playerName)
      .join(", ");
    const allNames = liveClub.croatianPlayers.map((p) => p.playerName).join(", ");
    generated.push({
      id: `live-club-${liveClub.id}`,
      date: today,
      featured: true,
      category: "live",
      tag: { de: "LIVE", en: "LIVE", hr: "UŽIVO" },
      title: {
        de: `Live: ${liveClub.homeTeam} – ${liveClub.awayTeam}`,
        en: `Live: ${liveClub.homeTeam} – ${liveClub.awayTeam}`,
        hr: `Uživo: ${liveClub.homeTeam} – ${liveClub.awayTeam}`,
      },
      summary: {
        de: `Stand ${liveClub.homeScore ?? "–"}:${liveClub.awayScore ?? "–"}${liveClub.minute != null ? ` (${liveClub.minute}')` : ""} · ${names || "Kroaten im Spiel"}`,
        en: `Score ${liveClub.homeScore ?? "–"}–${liveClub.awayScore ?? "–"}${liveClub.minute != null ? ` (${liveClub.minute}')` : ""} · ${names || "Croatians involved"}`,
        hr: `Rezultat ${liveClub.homeScore ?? "–"}:${liveClub.awayScore ?? "–"}${liveClub.minute != null ? ` (${liveClub.minute}')` : ""} · ${names || "Hrvati u igri"}`,
      },
      body: {
        de: `Live aus angebundenen APIs: ${liveClub.homeTeam} gegen ${liveClub.awayTeam} (${liveClub.leagueName}). Aktueller Stand ${liveClub.homeScore ?? "–"}:${liveClub.awayScore ?? "–"}${liveClub.minute != null ? ` in Minute ${liveClub.minute}` : ""}.\n\nKroatische Spieler: ${allNames || "siehe Live-Board"}.\n\nDetails und bestätigte TV-Hinweise (falls vorhanden) im Live-Board.`,
        en: `Live from connected APIs: ${liveClub.homeTeam} vs ${liveClub.awayTeam} (${liveClub.leagueName}). Score ${liveClub.homeScore ?? "–"}–${liveClub.awayScore ?? "–"}${liveClub.minute != null ? ` at ${liveClub.minute}'` : ""}.\n\nCroatian players: ${allNames || "see live board"}.\n\nDetails and confirmed TV tips (if any) on the live board.`,
        hr: `Uživo s API-ja: ${liveClub.homeTeam} – ${liveClub.awayTeam} (${liveClub.leagueName}). Rezultat ${liveClub.homeScore ?? "–"}:${liveClub.awayScore ?? "–"}${liveClub.minute != null ? ` u ${liveClub.minute}'` : ""}.\n\nHrvatski igrači: ${allNames || "vidi live board"}.\n\nDetalji i potvrđeni TV savjeti (ako postoje) na live boardu.`,
      },
      image: {
        url: IMG.pitch,
        alt: { de: "Fußball", en: "Football", hr: "Nogomet" },
      },
      playerId: liveClub.croatianPlayers[0]?.playerId,
    });
  }

  // Club-Spiele mit Kroaten in den nächsten 7 Tagen – je Spiel eine knappe News
  const weekClub = matches
    .filter((m) => {
      if (m.status !== "scheduled" && m.status !== "postponed") return false;
      if (!m.croatianPlayers.length) return false;
      if (/croat|kroat|hrvat/i.test(`${m.homeTeam} ${m.awayTeam}`)) return false;
      const t = new Date(m.kickoff).getTime();
      return t >= now.getTime() && t <= now.getTime() + 7 * 24 * 3600_000;
    })
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, 12);

  for (const nextClub of weekClub) {
    const names = nextClub.croatianPlayers
      .slice(0, 4)
      .map((p) => p.playerName)
      .join(", ");
    const allNames = nextClub.croatianPlayers
      .map((p) => p.playerName)
      .join(", ");
    const pid = nextClub.croatianPlayers[0]?.playerId;
    generated.push({
      id: `live-upcoming-club-${nextClub.id}`,
      date: today,
      featured: weekClub.indexOf(nextClub) < 3,
      category: "live",
      tag: { de: "Diese Woche", en: "This week", hr: "Ovaj tjedan" },
      title: {
        de: `${nextClub.homeTeam} – ${nextClub.awayTeam}: ${names || "Kroaten"} im Spiel`,
        en: `${nextClub.homeTeam} – ${nextClub.awayTeam}: ${names || "Croatians"} involved`,
        hr: `${nextClub.homeTeam} – ${nextClub.awayTeam}: ${names || "Hrvati"} na utakmici`,
      },
      summary: {
        de: `${fmtKick(nextClub.kickoff, "de")} · ${nextClub.leagueName}${nextClub.venue ? ` · ${nextClub.venue}` : ""}`,
        en: `${fmtKick(nextClub.kickoff, "en")} · ${nextClub.leagueName}${nextClub.venue ? ` · ${nextClub.venue}` : ""}`,
        hr: `${fmtKick(nextClub.kickoff, "hr")} · ${nextClub.leagueName}${nextClub.venue ? ` · ${nextClub.venue}` : ""}`,
      },
      body: {
        de: `Aus den Live-Daten (nächste 7 Tage): ${nextClub.homeTeam} gegen ${nextClub.awayTeam} in der ${nextClub.leagueName}. Kick-off ${fmtKick(nextClub.kickoff, "de")}.${nextClub.venue ? ` Stadion: ${nextClub.venue}.` : ""}\n\nKroatische Spieler laut Datenlage: ${allNames || "noch nicht zugeordnet"}.\n\nKein spekulativer TV-Hinweis – nur wenn redaktionell bestätigt. Mehr im Live-Board und Spieler-Tracker.`,
        en: `From live data (next 7 days): ${nextClub.homeTeam} vs ${nextClub.awayTeam} in ${nextClub.leagueName}. Kick-off ${fmtKick(nextClub.kickoff, "en")}.${nextClub.venue ? ` Venue: ${nextClub.venue}.` : ""}\n\nCroatian players per data: ${allNames || "not yet mapped"}.\n\nNo speculative TV tip – only if editorially confirmed. More on the live board and player tracker.`,
        hr: `Iz live podataka (sljedećih 7 dana): ${nextClub.homeTeam} – ${nextClub.awayTeam} u ${nextClub.leagueName}. Početak ${fmtKick(nextClub.kickoff, "hr")}.${nextClub.venue ? ` Stadion: ${nextClub.venue}.` : ""}\n\nHrvatski igrači prema podacima: ${allNames || "još nisu mapirani"}.\n\nBez spekulativnog TV savjeta – samo ako je urednički potvrđeno. Više na live boardu i trackeru.`,
      },
      // Sichere thematische Bilder (Liga/Wettbewerb), keine Spieler-Cutouts aus Dritt-CDNs
      image: {
        url:
          /premier|pl\b/i.test(nextClub.leagueName)
            ? IMG.premierLeague
            : /bundesliga/i.test(nextClub.leagueName)
              ? IMG.euro
              : /serie/i.test(nextClub.leagueName)
                ? IMG.serieA
                : /hnl/i.test(nextClub.leagueName)
                  ? IMG.hnl
                  : IMG.stadium,
        alt: {
          de: nextClub.leagueName,
          en: nextClub.leagueName,
          hr: nextClub.leagueName,
        },
      },
      playerId: pid,
    });
  }

  // Editorial: frisch halten – 21 Tage, Featured bis 45 Tage
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 21);
  const featuredCutoff = new Date(now);
  featuredCutoff.setDate(featuredCutoff.getDate() - 45);
  const cutoffIso = todayIso(cutoff);
  const featuredIso = todayIso(featuredCutoff);
  const editorial = EDITORIAL_NEWS.filter(
    (a) =>
      a.date <= today &&
      (a.date >= cutoffIso || (a.featured && a.date >= featuredIso))
  );
  const map = new Map<string, NewsArticle>();
  for (const a of [...generated, ...editorial]) map.set(a.id, a);

  return assignUniqueNewsImages(Array.from(map.values()).sort(sortNews), 40);
}

/**
 * Tages-Ranking: Frische zuerst, dann Live-Anker, dann starke Auto-Headlines,
 * dann redaktionelle Backgrounder. Verhindert „alte Basic-Stories“ oben.
 */
function freshnessBoost(date: string, now = new Date()): number {
  const age =
    (now.getTime() - new Date(date + "T12:00:00Z").getTime()) /
    (24 * 3600_000);
  if (Number.isNaN(age)) return 0;
  if (age <= 0.5) return 100;
  if (age <= 1) return 90;
  if (age <= 2) return 75;
  if (age <= 3) return 55;
  if (age <= 7) return 35;
  if (age <= 14) return 15;
  if (age <= 30) return 5;
  return -20;
}

function rankNews(a: NewsArticle, now = new Date()): number {
  let score = freshnessBoost(a.date, now);
  if (a.featured) score += 12;
  if (a.category === "live") score += 28;
  if (a.id.startsWith("auto-")) score += 22; // daily external headlines
  if (a.id.startsWith("live-")) score += 18;
  if (a.sourceUrl) score += 8;
  if (a.category === "transfer") score += 6;
  if (a.category === "vatreni") score += 5;
  // Alte rein redaktionelle Stories absenken
  if (!a.id.startsWith("auto-") && !a.id.startsWith("live-")) {
    const age =
      (now.getTime() - new Date(a.date + "T12:00:00Z").getTime()) /
      (24 * 3600_000);
    if (age > 14) score -= 25;
  }
  return score;
}

function sortNews(a: NewsArticle, b: NewsArticle): number {
  const now = new Date();
  const byRank = rankNews(b, now) - rankNews(a, now);
  if (byRank !== 0) return byRank;
  return b.date.localeCompare(a.date);
}

/**
 * Live-Anker + redaktionell + viele frische Auto-Headlines (async).
 * Primärer Weg für „täglich beste News“.
 */
export async function getDailyNewsAsync(
  now = new Date(),
  live?: { matches?: Match[]; players?: Player[] }
): Promise<NewsArticle[]> {
  const baseRaw = getDailyNews(now, live);
  try {
    const { fetchAutoNews } = await import("@/lib/data/auto-news");
    const auto = await fetchAutoNews(16);
    const map = new Map<string, NewsArticle>();
    // Auto + live first in map insertion; sort decides final order
    for (const a of [...auto, ...baseRaw]) map.set(a.id, a);
    return assignUniqueNewsImages(
      Array.from(map.values()).sort((x, y) => sortNews(x, y)),
      36
    );
  } catch {
    return baseRaw;
  }
}

/** Einzelartikel (editorial + live-generiert + auto, ohne Match-Context) */
export async function getNewsBySlug(
  slug: string,
  live?: { matches?: Match[]; players?: Player[] }
): Promise<NewsArticle | null> {
  const all = await getDailyNewsAsync(new Date(), live);
  return all.find((a) => a.id === slug) ?? null;
}

/** Alle bekannten Slugs für generateStaticParams / Sitemap */
export async function getAllNewsSlugs(): Promise<string[]> {
  const all = await getDailyNewsAsync(new Date());
  return all.map((a) => a.id);
}

export function tNews(text: NewsLocaleText, locale: string): string {
  const l = (
    locale === "hr" || locale === "en" || locale === "de" ? locale : "de"
  ) as Locale;
  return text[l] || text.de;
}

export const NEWS_CATEGORY_LABEL: Record<
  NewsArticle["category"],
  NewsLocaleText
> = {
  vatreni: { de: "Nationalteam", en: "National team", hr: "Reprezentacija" },
  clubs: { de: "Clubs", en: "Clubs", hr: "Klubovi" },
  transfer: { de: "Transfer", en: "Transfer", hr: "Transfer" },
  hnl: { de: "HNL", en: "HNL", hr: "HNL" },
  preview: { de: "Vorschau", en: "Preview", hr: "Najava" },
  live: { de: "Live", en: "Live", hr: "Uživo" },
};
