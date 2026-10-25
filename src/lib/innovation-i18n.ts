import type { Lang } from "./i18n";

/**
 * Texte für "Kroatien innovativ" – jede Aussage aus der verlinkten Wikipedia-Seite
 * (geprüft am 25.10.2026). DE und HR strikt getrennt.
 */
export interface Fact { emoji: string; title: string; text: string; url: string }

const W = (l: string, p: string) => `https://${l}.wikipedia.org/wiki/${p}`;

const DE = {
  metaTitle: "Kroatien innovativ – Erfindungen, Startups, Rimac & mehr",
  metaDesc: "Aktuelle Schlagzeilen über kroatische Erfindungen, Forschung, Startups und Großaufträge – dazu Videos, berühmte Erfindungen und ein Firmen-Spotlight.",
  nav: "Innovativ",
  h1: "Kroatien innovativ",
  intro: "Kroatien jenseits des Sports: Erfindungen, Forschung, Startups, große Aufträge und Auszeichnungen. Schlagzeilen aus deutschsprachigen Medien, jeweils mit Link zum Original.",
  news: "Aktuelle Schlagzeilen",
  newsNote: "Quelle: Google News (deutschsprachige Medien). Höchstens 2 Meldungen pro Firma, gleiche Geschichte nur einmal. Politik, Kriminalität und Sport sind ausgeblendet.",
  none: "Gerade keine passenden Meldungen gefunden.",
  videos: "Videos",
  videosNote: "Neueste Videos der offiziellen YouTube-Kanäle von Rimac, Verne und Infobip (Originalsprache, meist Englisch). Das Video wird erst nach Klick von youtube-nocookie.com geladen.",
  load: "Video laden",
  did: "Wusstest du?",
  didNote: "Berühmte Erfindungen mit kroatischen Wurzeln – jeweils mit Quelle.",
  spot: "Firmen-Spotlight",
  source: "Quelle",
  more: "Alle Innovations-News",
  teaser: "Erfindungen, Startups und Großaufträge aus Kroatien",
  facts: [
    { emoji: "👔", title: "Die Krawatte", text: "Der Name kommt vom französischen „à la cravate“ – „nach kroatischer Art“.", url: W("de", "Krawatte") },
    { emoji: "✏️", title: "Druckbleistift & Füller", text: "Slavoljub Penkala meldete 1906 in Zagreb einen „automatischen Bleistift“ zum Patent an, 1907 folgte ein Füllfederhalter mit fester Tinte.", url: W("en", "Slavoljub_Penkala") },
    { emoji: "🚀", title: "Der Torpedo", text: "Marineoffizier Ivan Lupis aus Rijeka entwickelte einen unbemannten Sprengkörper, der zum ersten propellergetriebenen Torpedo führte.", url: W("de", "Ivan_Lupis") },
    { emoji: "🖐️", title: "Fingerabdrücke", text: "Ivan Vučetić von der Insel Hvar entwickelte in Argentinien die Daktyloskopie; 1892 wurde dort erstmals ein Mord per Fingerabdruck aufgeklärt.", url: W("de", "Juan_Vucetich") },
    { emoji: "🪂", title: "Fallschirm", text: "Faust Vrančić aus Šibenik zeichnete in „Machinae Novae“ den „Homo Volans“, einen Vorläufer des Fallschirms.", url: W("de", "Faust_Vrančić") },
    { emoji: "⚡", title: "Nikola Tesla", text: "Der Wechselstrom-Pionier wurde 1856 in Smiljan in der Lika geboren – im heutigen Kroatien.", url: W("de", "Nikola_Tesla") },
  ] as Fact[],
  companies: [
    { emoji: "🏎️", title: "Rimac Automobili", text: "2009 von Mate Rimac gegründet, Sitz in Sveta Nedelja bei Zagreb. Der Nevera erreichte 412 km/h und stellte 2023 an einem Tag 23 Rekorde auf.", url: W("de", "Rimac_Automobili") },
    { emoji: "🚕", title: "Verne", text: "Robotaxi-Marke aus dem Rimac-Umfeld, im Juni 2024 vorgestellt.", url: W("en", "Rimac_Automobili") },
    { emoji: "💬", title: "Infobip", text: "2006 in Vodnjan (Istrien) gegründet; 2020 als erstes kroatisches Unternehmen mit über 1 Mrd. US-Dollar bewertet („Einhorn“).", url: W("en", "Infobip") },
    { emoji: "🧮", title: "Photomath", text: "App, die Matheaufgaben per Handykamera erkennt und Schritt für Schritt erklärt – inzwischen im Besitz von Google.", url: W("en", "Photomath") },
    { emoji: "🎮", title: "Nanobit", text: "Spieleentwickler aus Zagreb für iOS und Android, Tochter der Stillfront Group.", url: W("en", "Nanobit") },
  ] as Fact[],
};

const HR: typeof DE = {
  metaTitle: "Hrvatska inovativna – izumi, startupi, Rimac i više",
  metaDesc: "Najnoviji naslovi o hrvatskim izumima, istraživanjima, startupima i velikim poslovima – uz videe, poznate izume i predstavljanje tvrtki.",
  nav: "Inovacije",
  h1: "Hrvatska inovativna",
  intro: "Hrvatska izvan sporta: izumi, istraživanja, startupi, veliki poslovi i nagrade. Naslovi hrvatskih medija, uvijek s poveznicom na izvornik.",
  news: "Najnoviji naslovi",
  newsNote: "Izvori: hrvatski mediji (Netokracija, Poslovni dnevnik, Index.hr, tportal, Bug.hr, Večernji list) i Google News. Najviše 2 vijesti po tvrtki, ista priča samo jednom. Politika, crna kronika i sport nisu prikazani.",
  none: "Trenutačno nema odgovarajućih vijesti.",
  videos: "Videozapisi",
  videosNote: "Najnoviji videi sa službenih YouTube kanala tvrtki Rimac, Verne i Infobip (izvorni jezik, uglavnom engleski). Video se s youtube-nocookie.com učitava tek nakon klika.",
  load: "Učitaj video",
  did: "Jeste li znali?",
  didNote: "Poznati izumi s hrvatskim korijenima – uz izvor.",
  spot: "Tvrtke u fokusu",
  source: "Izvor",
  more: "Sve vijesti o inovacijama",
  teaser: "Izumi, startupi i veliki poslovi iz Hrvatske",
  facts: [
    { emoji: "👔", title: "Kravata", text: "Naziv dolazi od francuskog „à la cravate“ – „na hrvatski način“.", url: W("hr", "Kravata") },
    { emoji: "✏️", title: "Tehnička olovka i nalivpero", text: "Slavoljub Penkala 1906. patentirao je „automatsku olovku“, a 1907. nalivpero s krutom tintom.", url: W("hr", "Slavoljub_Eduard_Penkala") },
    { emoji: "🚀", title: "Torpedo", text: "Riječanin Ivan Vukić (Luppis), časnik austrijske mornarice, osmislio je bespilotno eksplozivno plovilo iz kojeg je nastao prvi torpedo s propelerom.", url: W("hr", "Ivan_Vukić") },
    { emoji: "🖐️", title: "Otisci prstiju", text: "Ivan Vučetić s Hvara razvio je u Argentini daktiloskopiju; ondje je 1892. prvi put otisak prsta razriješio ubojstvo.", url: W("hr", "Ivan_Vučetić") },
    { emoji: "🪂", title: "Padobran", text: "Šibenčanin Faust Vrančić u djelu „Machinae Novae“ nacrtao je „Homo Volans“, preteču padobrana.", url: W("hr", "Faust_Vrančić") },
    { emoji: "⚡", title: "Nikola Tesla", text: "Pionir izmjenične struje rođen je 1856. u Smiljanu u Lici, u današnjoj Hrvatskoj.", url: W("hr", "Nikola_Tesla") },
  ],
  companies: [
    { emoji: "🏎️", title: "Rimac Automobili", text: "Osnovao ju je Mate Rimac 2009., sjedište je u Svetoj Nedelji kraj Zagreba. Nevera je postigla 412 km/h i 2023. u jednom danu postavila 23 rekorda.", url: W("hr", "Rimac_Automobili") },
    { emoji: "🚕", title: "Verne", text: "Robotaksi marka iz Rimčeva okruženja, predstavljena u lipnju 2024.", url: W("en", "Rimac_Automobili") },
    { emoji: "💬", title: "Infobip", text: "Osnovan 2006. u Vodnjanu; 2020. prva hrvatska tvrtka procijenjena na više od milijardu dolara („jednorog“).", url: W("hr", "Infobip") },
    { emoji: "🧮", title: "Photomath", text: "Aplikacija koja kamerom mobitela prepoznaje matematičke zadatke i objašnjava rješenje korak po korak – danas u vlasništvu Googlea.", url: W("en", "Photomath") },
    { emoji: "🎮", title: "Nanobit", text: "Zagrebački razvijatelj mobilnih igara za iOS i Android, dio grupe Stillfront.", url: W("en", "Nanobit") },
  ],
};

export const inno = (lang: Lang) => (lang === "hr" ? HR : DE);
