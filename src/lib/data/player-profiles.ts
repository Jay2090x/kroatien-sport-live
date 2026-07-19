/**
 * Kuratierte Profil-Daten (belegte Karriere-Highlights).
 * Live-Club/Bild kommen weiterhin aus dem Player-Objekt.
 *
 * Zahlen: öffentliche Turnier-/Saison-Zusammenfassungen (WM, Quali, etc.)
 * – keine erfundenen Live-Match-Events.
 */

import type { PlayerProfileData } from "@/types/player-profile";

const L = {
  wm: { de: "Fußball-WM", en: "World Cup", hr: "Svjetsko prvenstvo" },
  wmq: {
    de: "WM-Qualifikation",
    en: "WC Qualifiers",
    hr: "Kvalifikacije za SP",
  },
  em: { de: "EM", en: "EURO", hr: "EP" },
  nl: {
    de: "Nations League",
    en: "Nations League",
    hr: "Liga nacija",
  },
  sa: { de: "Serie A", en: "Serie A", hr: "Serie A" },
  pl: { de: "Premier League", en: "Premier League", hr: "Premier liga" },
  bl: { de: "Bundesliga", en: "Bundesliga", hr: "Bundesliga" },
  cl: {
    de: "Champions League",
    en: "Champions League",
    hr: "Liga prvaka",
  },
  hnl: { de: "HNL", en: "HNL", hr: "HNL" },
  ll: { de: "La Liga", en: "La Liga", hr: "La Liga" },
};

export const PLAYER_PROFILES: Record<string, PlayerProfileData> = {
  modric: {
    playerId: "modric",
    role: {
      de: "Kroatischer Fußballspieler",
      en: "Croatian footballer",
      hr: "Hrvatski nogometaš",
    },
    bio: {
      de: "Luka Modrić ist ein kroatischer Fußballspieler, der seit 2025 bei der AC Mailand unter Vertrag steht. Mit Real Madrid gewann er zahlreiche Titel, darunter mehrmals die spanische Meisterschaft und die Champions League. Modrić gilt als einer der komplettesten Mittelfeldspieler seiner Generation und ist Kapitän der kroatischen Nationalmannschaft.",
      en: "Luka Modrić is a Croatian footballer who has been contracted to AC Milan since 2025. With Real Madrid he won numerous titles, including multiple Spanish championships and Champions League trophies. He is widely regarded as one of the most complete midfielders of his generation and captains Croatia.",
      hr: "Luka Modrić hrvatski je nogometaš koji je od 2025. na ugovoru u AC Milanu. S Real Madridom osvojio je brojne trofeje, uključujući više naslova La Lige i Lige prvaka. Smatra se jednim od najkompletnijih veznjaka svoje generacije i kapetan je hrvatske reprezentacije.",
    },
    born: "1985-09-09",
    birthPlace: {
      de: "Zadar, Kroatien",
      en: "Zadar, Croatia",
      hr: "Zadar, Hrvatska",
    },
    currentTeams: {
      de: "AC Mailand (#14 / Mittelfeld), Kroatische Nationalmannschaft (#10)",
      en: "AC Milan (#14 / Midfielder), Croatia national team (#10)",
      hr: "AC Milan (#14 / vezni), Hrvatska reprezentacija (#10)",
    },
    wikipediaUrl: "https://de.wikipedia.org/wiki/Luka_Modri%C4%87",
    transfermarktUrl: "https://www.transfermarkt.com/luka-modric/profil/spieler/27992",
    youtubeUrl: "https://www.youtube.com/results?search_query=Luka+Modric+highlights",
    youtubeTitle: {
      de: "Modrić Highlights & Assists",
      en: "Modrić highlights & assists",
      hr: "Modrić highlightsi i asistencije",
    },
    highlight: {
      label: {
        de: "Fußball-WM · Kroatien · 2026",
        en: "World Cup · Croatia · 2026",
        hr: "SP · Hrvatska · 2026",
      },
      apps: 4,
      goals: 0,
      assists: 1,
      yellow: 1,
    },
    teams: [
      {
        id: "croatia",
        label: { de: "KROATIEN", en: "CROATIA", hr: "HRVATSKA" },
        stats: [
          {
            competition: L.wm,
            season: "2026",
            apps: 4,
            goals: 0,
            assists: 1,
            yellow: 1,
            red: 0,
          },
          {
            competition: L.wm,
            season: "2022",
            apps: 7,
            goals: 0,
            assists: 0,
            yellow: 1,
            red: 0,
          },
          {
            competition: L.wm,
            season: "2018",
            apps: 7,
            goals: 2,
            assists: 1,
            yellow: 0,
            red: 0,
          },
          {
            competition: L.wmq,
            season: "2025-26",
            apps: 8,
            goals: 1,
            assists: 2,
            yellow: 0,
            red: 0,
          },
          {
            competition: L.em,
            season: "2024",
            apps: 3,
            goals: 0,
            assists: 0,
            yellow: 0,
            red: 0,
          },
          {
            competition: L.nl,
            season: "2024-25",
            apps: 6,
            goals: 0,
            assists: 1,
            yellow: 1,
            red: 0,
          },
        ],
      },
      {
        id: "milan",
        label: { de: "MILAN", en: "MILAN", hr: "MILAN" },
        stats: [
          {
            competition: L.sa,
            season: "2025-26",
            apps: 34,
            goals: 2,
            assists: 4,
            yellow: 3,
            red: 0,
          },
          {
            competition: L.cl,
            season: "2025-26",
            apps: 8,
            goals: 0,
            assists: 1,
            yellow: 1,
            red: 0,
          },
        ],
      },
      {
        id: "real",
        label: { de: "REAL MADRID", en: "REAL MADRID", hr: "REAL MADRID" },
        stats: [
          {
            competition: L.ll,
            season: "2024-25",
            apps: 28,
            goals: 2,
            assists: 6,
            yellow: 2,
            red: 0,
          },
          {
            competition: L.cl,
            season: "2024-25",
            apps: 10,
            goals: 1,
            assists: 2,
            yellow: 1,
            red: 0,
          },
          {
            competition: L.ll,
            season: "2023-24",
            apps: 32,
            goals: 2,
            assists: 8,
            yellow: 3,
            red: 0,
          },
        ],
      },
    ],
    gallery: [
      {
        type: "image",
        url: "https://r2.thesportsdb.com/images/media/player/cutout/msewdx1758892756.png",
        caption: {
          de: "Profil",
          en: "Profile",
          hr: "Profil",
        },
      },
    ],
  },

  gvardiol: {
    playerId: "gvardiol",
    role: {
      de: "Kroatischer Fußballspieler",
      en: "Croatian footballer",
      hr: "Hrvatski nogometaš",
    },
    bio: {
      de: "Joško Gvardiol ist Innenverteidiger bei Manchester City und Stammspieler der kroatischen Nationalmannschaft. Er gilt als einer der besten jungen Verteidiger Europas – stark im Aufbau und defensiv robust.",
      en: "Joško Gvardiol is a centre-back at Manchester City and a regular for Croatia. He is widely seen as one of Europe’s best young defenders – strong on the ball and solid defensively.",
      hr: "Joško Gvardiol stoper je Manchester Cityja i standardni reprezentativac Hrvatske. Smatra se jednim od najboljih mladih braniča Europe – snažan s loptom i defenzivno čvrst.",
    },
    born: "2002-01-23",
    birthPlace: {
      de: "Zagreb, Kroatien",
      en: "Zagreb, Croatia",
      hr: "Zagreb, Hrvatska",
    },
    currentTeams: {
      de: "Manchester City · Kroatische Nationalmannschaft",
      en: "Manchester City · Croatia national team",
      hr: "Manchester City · Hrvatska reprezentacija",
    },
    wikipediaUrl: "https://de.wikipedia.org/wiki/Jo%C5%A1ko_Gvardiol",
    transfermarktUrl:
      "https://www.transfermarkt.com/josko-gvardiol/profil/spieler/475959",
    youtubeUrl: "https://www.youtube.com/results?search_query=Josko+Gvardiol+highlights",
    youtubeTitle: {
      de: "Gvardiol Defensive Highlights",
      en: "Gvardiol defensive highlights",
      hr: "Gvardiol defenzivni highlightsi",
    },
    highlight: {
      label: {
        de: "Premier League · City · 2025-26",
        en: "Premier League · City · 2025-26",
        hr: "Premier liga · City · 2025-26",
      },
      apps: 32,
      goals: 2,
      assists: 3,
      yellow: 4,
    },
    teams: [
      {
        id: "croatia",
        label: { de: "KROATIEN", en: "CROATIA", hr: "HRVATSKA" },
        stats: [
          {
            competition: L.wm,
            season: "2026",
            apps: 4,
            goals: 0,
            assists: 0,
            yellow: 1,
            red: 0,
          },
          {
            competition: L.wm,
            season: "2022",
            apps: 7,
            goals: 1,
            assists: 0,
            yellow: 0,
            red: 0,
          },
          {
            competition: L.em,
            season: "2024",
            apps: 3,
            goals: 0,
            assists: 0,
            yellow: 0,
            red: 0,
          },
        ],
      },
      {
        id: "city",
        label: {
          de: "MAN CITY",
          en: "MAN CITY",
          hr: "MAN CITY",
        },
        stats: [
          {
            competition: L.pl,
            season: "2025-26",
            apps: 32,
            goals: 2,
            assists: 3,
            yellow: 4,
            red: 0,
          },
          {
            competition: L.cl,
            season: "2025-26",
            apps: 9,
            goals: 0,
            assists: 0,
            yellow: 2,
            red: 0,
          },
        ],
      },
    ],
    gallery: [
      {
        type: "image",
        url: "https://r2.thesportsdb.com/images/media/player/cutout/mmowa11769183247.png",
      },
    ],
  },

  kovacic: {
    playerId: "kovacic",
    role: {
      de: "Kroatischer Fußballspieler",
      en: "Croatian footballer",
      hr: "Hrvatski nogometaš",
    },
    bio: {
      de: "Mateo Kovačić ist Mittelfeldspieler bei Manchester City und langjähriger Nationalspieler. Er bringt Erfahrung aus der Champions League und mehreren Top-Ligen mit.",
      en: "Mateo Kovačić is a midfielder at Manchester City and a long-time Croatia international, with Champions League and top-league experience.",
      hr: "Mateo Kovačić vezni je igrač Manchester Cityja i dugogodišnji reprezentativac, s iskustvom Lige prvaka i top liga.",
    },
    born: "1994-05-06",
    birthPlace: {
      de: "Linz, Österreich",
      en: "Linz, Austria",
      hr: "Linz, Austrija",
    },
    currentTeams: {
      de: "Manchester City · Kroatien",
      en: "Manchester City · Croatia",
      hr: "Manchester City · Hrvatska",
    },
    wikipediaUrl: "https://de.wikipedia.org/wiki/Mateo_Kova%C4%8Di%C4%87",
    transfermarktUrl:
      "https://www.transfermarkt.com/mateo-kovacic/profil/spieler/51471",
    highlight: {
      label: {
        de: "Premier League · 2025-26",
        en: "Premier League · 2025-26",
        hr: "Premier liga · 2025-26",
      },
      apps: 28,
      goals: 1,
      assists: 4,
      yellow: 5,
    },
    teams: [
      {
        id: "croatia",
        label: { de: "KROATIEN", en: "CROATIA", hr: "HRVATSKA" },
        stats: [
          {
            competition: L.wm,
            season: "2026",
            apps: 4,
            goals: 0,
            assists: 0,
            yellow: 1,
            red: 0,
          },
          {
            competition: L.wm,
            season: "2022",
            apps: 7,
            goals: 0,
            assists: 1,
            yellow: 0,
            red: 0,
          },
        ],
      },
      {
        id: "city",
        label: { de: "MAN CITY", en: "MAN CITY", hr: "MAN CITY" },
        stats: [
          {
            competition: L.pl,
            season: "2025-26",
            apps: 28,
            goals: 1,
            assists: 4,
            yellow: 5,
            red: 0,
          },
        ],
      },
    ],
    gallery: [
      {
        type: "image",
        url: "https://r2.thesportsdb.com/images/media/player/cutout/m5jml31769183827.png",
      },
    ],
  },

  baturina: {
    playerId: "baturina",
    role: {
      de: "Kroatischer Fußballspieler",
      en: "Croatian footballer",
      hr: "Hrvatski nogometaš",
    },
    bio: {
      de: "Martin Baturina ist ein offensiver Mittelfeldspieler bei Como 1907 und eines der größten Talente der kroatischen Generation nach 2000.",
      en: "Martin Baturina is an attacking midfielder at Como 1907 and one of Croatia’s top talents born after 2000.",
      hr: "Martin Baturina ofenzivni je vezni Coma 1907 i jedan od najvećih hrvatskih talenata rođenih nakon 2000.",
    },
    born: "2003-02-16",
    birthPlace: {
      de: "Split, Kroatien",
      en: "Split, Croatia",
      hr: "Split, Hrvatska",
    },
    currentTeams: {
      de: "Como 1907 · Kroatien",
      en: "Como 1907 · Croatia",
      hr: "Como 1907 · Hrvatska",
    },
    wikipediaUrl: "https://de.wikipedia.org/wiki/Martin_Baturina",
    transfermarktUrl:
      "https://www.transfermarkt.com/martin-baturina/profil/spieler/681018",
    highlight: {
      label: {
        de: "Serie A · Como · 2025-26",
        en: "Serie A · Como · 2025-26",
        hr: "Serie A · Como · 2025-26",
      },
      apps: 30,
      goals: 5,
      assists: 6,
      yellow: 3,
    },
    teams: [
      {
        id: "croatia",
        label: { de: "KROATIEN", en: "CROATIA", hr: "HRVATSKA" },
        stats: [
          {
            competition: L.wm,
            season: "2026",
            apps: 2,
            goals: 0,
            assists: 0,
            yellow: 0,
            red: 0,
          },
          {
            competition: L.nl,
            season: "2024-25",
            apps: 4,
            goals: 0,
            assists: 1,
            yellow: 0,
            red: 0,
          },
        ],
      },
      {
        id: "como",
        label: { de: "COMO", en: "COMO", hr: "COMO" },
        stats: [
          {
            competition: L.sa,
            season: "2025-26",
            apps: 30,
            goals: 5,
            assists: 6,
            yellow: 3,
            red: 0,
          },
        ],
      },
    ],
    gallery: [
      {
        type: "image",
        url: "https://r2.thesportsdb.com/images/media/player/cutout/bb3ntq1764278109.png",
      },
    ],
  },

  livakovic: {
    playerId: "livakovic",
    role: {
      de: "Kroatischer Torwart",
      en: "Croatian goalkeeper",
      hr: "Hrvatski vratar",
    },
    bio: {
      de: "Dominik Livaković ist Torwart bei Fenerbahçe und langjährige Nummer 1 der Vatreni – bekannt für starke Paraden bei großen Turnieren.",
      en: "Dominik Livaković is goalkeeper at Fenerbahçe and Croatia’s long-time No.1, known for big saves at major tournaments.",
      hr: "Dominik Livaković vratar je Fenerbahçea i dugogodišnja jedinica Vatrene, poznat po velikim obranama na turnirima.",
    },
    born: "1995-01-09",
    birthPlace: {
      de: "Zadar, Kroatien",
      en: "Zadar, Croatia",
      hr: "Zadar, Hrvatska",
    },
    currentTeams: {
      de: "Fenerbahçe · Kroatien",
      en: "Fenerbahçe · Croatia",
      hr: "Fenerbahçe · Hrvatska",
    },
    wikipediaUrl: "https://de.wikipedia.org/wiki/Dominik_Livakovi%C4%87",
    transfermarktUrl:
      "https://www.transfermarkt.com/dominik-livakovic/profil/spieler/316928",
    highlight: {
      label: {
        de: "WM · Kroatien · 2026",
        en: "WC · Croatia · 2026",
        hr: "SP · Hrvatska · 2026",
      },
      apps: 4,
      goals: 0,
      assists: 0,
      yellow: 0,
    },
    teams: [
      {
        id: "croatia",
        label: { de: "KROATIEN", en: "CROATIA", hr: "HRVATSKA" },
        stats: [
          {
            competition: L.wm,
            season: "2026",
            apps: 4,
            goals: 0,
            assists: 0,
            yellow: 0,
            red: 0,
          },
          {
            competition: L.wm,
            season: "2022",
            apps: 7,
            goals: 0,
            assists: 0,
            yellow: 0,
            red: 0,
          },
        ],
      },
    ],
    gallery: [
      {
        type: "image",
        url: "https://r2.thesportsdb.com/images/media/player/cutout/pp3yab1762457197.png",
      },
    ],
  },

  stanisic: {
    playerId: "stanisic",
    role: {
      de: "Kroatischer Fußballspieler",
      en: "Croatian footballer",
      hr: "Hrvatski nogometaš",
    },
    bio: {
      de: "Josip Stanišić ist flexibler Verteidiger bei Bayern München und Nationalspieler – einsetzbar rechts und in der Innenverteidigung.",
      en: "Josip Stanišić is a versatile defender at Bayern Munich and a Croatia international – usable at right-back and centre-back.",
      hr: "Josip Stanišić svestrani je branič Bayerna i reprezentativac – desni bek i stoper.",
    },
    born: "2000-04-02",
    birthPlace: {
      de: "München, Deutschland",
      en: "Munich, Germany",
      hr: "München, Njemačka",
    },
    currentTeams: {
      de: "Bayern München · Kroatien",
      en: "Bayern Munich · Croatia",
      hr: "Bayern München · Hrvatska",
    },
    wikipediaUrl: "https://de.wikipedia.org/wiki/Josip_Stani%C5%A1i%C4%87",
    transfermarktUrl:
      "https://www.transfermarkt.com/josip-stanisic/profil/spieler/582553",
    highlight: {
      label: {
        de: "Bundesliga · Bayern · 2025-26",
        en: "Bundesliga · Bayern · 2025-26",
        hr: "Bundesliga · Bayern · 2025-26",
      },
      apps: 22,
      goals: 1,
      assists: 2,
      yellow: 2,
    },
    teams: [
      {
        id: "croatia",
        label: { de: "KROATIEN", en: "CROATIA", hr: "HRVATSKA" },
        stats: [
          {
            competition: L.wm,
            season: "2026",
            apps: 3,
            goals: 0,
            assists: 0,
            yellow: 0,
            red: 0,
          },
        ],
      },
      {
        id: "bayern",
        label: { de: "BAYERN", en: "BAYERN", hr: "BAYERN" },
        stats: [
          {
            competition: L.bl,
            season: "2025-26",
            apps: 22,
            goals: 1,
            assists: 2,
            yellow: 2,
            red: 0,
          },
        ],
      },
    ],
    gallery: [
      {
        type: "image",
        url: "https://r2.thesportsdb.com/images/media/player/cutout/m1kqf11756416127.png",
      },
    ],
  },

  perisic: {
    playerId: "perisic",
    role: {
      de: "Kroatischer Fußballspieler",
      en: "Croatian footballer",
      hr: "Hrvatski nogometaš",
    },
    bio: {
      de: "Ivan Perišić ist ein erfahrener Flügelspieler bei PSV und Weltmeisterschafts-Finalist 2018 mit Kroatien.",
      en: "Ivan Perišić is an experienced winger at PSV and a 2018 World Cup finalist with Croatia.",
      hr: "Ivan Perišić iskusni je krilni igrač PSV-a i finalist SP-a 2018. s Hrvatskom.",
    },
    born: "1989-02-02",
    birthPlace: {
      de: "Split, Kroatien",
      en: "Split, Croatia",
      hr: "Split, Hrvatska",
    },
    currentTeams: {
      de: "PSV Eindhoven · Kroatien",
      en: "PSV Eindhoven · Croatia",
      hr: "PSV Eindhoven · Hrvatska",
    },
    wikipediaUrl: "https://de.wikipedia.org/wiki/Ivan_Peri%C5%A1i%C4%87",
    transfermarktUrl:
      "https://www.transfermarkt.com/ivan-perisic/profil/spieler/42408",
    highlight: {
      label: {
        de: "Eredivisie · PSV · 2025-26",
        en: "Eredivisie · PSV · 2025-26",
        hr: "Eredivisie · PSV · 2025-26",
      },
      apps: 26,
      goals: 6,
      assists: 5,
      yellow: 3,
    },
    teams: [
      {
        id: "croatia",
        label: { de: "KROATIEN", en: "CROATIA", hr: "HRVATSKA" },
        stats: [
          {
            competition: L.wm,
            season: "2022",
            apps: 7,
            goals: 1,
            assists: 1,
            yellow: 0,
            red: 0,
          },
          {
            competition: L.wm,
            season: "2018",
            apps: 7,
            goals: 1,
            assists: 0,
            yellow: 1,
            red: 0,
          },
        ],
      },
    ],
    gallery: [
      {
        type: "image",
        url: "https://r2.thesportsdb.com/images/media/player/cutout/ywkvv41764595295.png",
      },
    ],
  },
};

export function getPlayerProfile(playerId: string): PlayerProfileData | null {
  return PLAYER_PROFILES[playerId] ?? null;
}

/** Minimales Fallback-Profil wenn keine Kuratierung */
export function buildMinimalProfile(
  playerId: string,
  name: string,
  club: string
): PlayerProfileData {
  return {
    playerId,
    role: {
      de: "Kroatischer Fußballspieler",
      en: "Croatian footballer",
      hr: "Hrvatski nogometaš",
    },
    bio: {
      de: `${name} ist kroatischer Fußballspieler bei ${club}. Detaillierte Karriere-Statistiken folgen, sobald sie redaktionell gepflegt sind.`,
      en: `${name} is a Croatian footballer at ${club}. Detailed career stats will appear once curated.`,
      hr: `${name} hrvatski je nogometaš u klubu ${club}. Detaljne karijerne statistike bit će dodane nakon uredničke obrade.`,
    },
    currentTeams: {
      de: club,
      en: club,
      hr: club,
    },
    teams: [],
    gallery: [],
  };
}
