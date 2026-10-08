/**
 * Anzeige-Metadaten für die Spielerseite.
 * WICHTIG: Alle Zuordnungen laufen über ESPN-IDs (Athlet / Team), nie über
 * Namensähnlichkeit. Diese Tabellen dienen nur der schöneren Darstellung.
 */

/** Korrekte kroatische Schreibweise (ESPN liefert Namen ohne Diakritika). */
export const PLAYER_NAME: Record<string, string> = {
  "187946": "Dominik Livaković",
  "239411": "Dominik Kotarski",
  "277234": "Ivor Pandur",
  "299910": "Joško Gvardiol",
  "364962": "Luka Vušković",
  "276329": "Josip Stanišić",
  "323273": "Ivan Smolčić",
  "305552": "Josip Šutalo",
  "255650": "Marin Pongračić",
  "238929": "Kristijan Jakić",
  "76762": "Luka Modrić",
  "154595": "Mateo Kovačić",
  "341494": "Petar Sučić",
  "306263": "Luka Sučić",
  "311475": "Martin Baturina",
  "206378": "Nikola Vlašić",
  "189668": "Mario Pašalić",
  "175812": "Josip Mišić",
  "237549": "Lovro Majer",
  "324270": "Marco Pašalić",
  "139520": "Andrej Kramarić",
  "277128": "Petar Musa",
  "310883": "Igor Matanović",
  "207288": "Ante Budimir",
  "306647": "Dion Drena Beljo",
  "364180": "Franjo Ivanović",
  "103485": "Ivan Perišić",
};

/** ESPN-Team-ID → TheSportsDB-HNL-Kurzname (ESPN führt keine HNL-Ligaspiele). */
export const ESPN_TEAM_TO_HNL: Record<string, string> = {
  "597": "Dinamo Zagreb",
  "489": "Hajduk Split",
  "2988": "Rijeka",
  "567": "Osijek",
  "4413": "Lokomotiva",
  "133685": "Varaždin",
  "132405": "Gorica",
  "13252": "Slaven Belupo",
};

export const CLUB_DE: Record<string, string> = {
  "Bayern Munich": "Bayern München",
  Internazionale: "Inter Mailand",
  "AC Milan": "AC Mailand",
  "1. FC Union Berlin": "Union Berlin",
  "Brighton & Hove Albion": "Brighton",
  "PSV Eindhoven": "PSV",
  "Orlando City SC": "Orlando City",
  "AEK Athens": "AEK Athen",
};

export function clubDe(name: string): string {
  return CLUB_DE[name] ?? name;
}

export const POSITION_GROUP: Record<string, { order: number; label: string }> = {
  G: { order: 0, label: "Tor" },
  D: { order: 1, label: "Abwehr" },
  M: { order: 2, label: "Mittelfeld" },
  F: { order: 3, label: "Angriff" },
};

export const CLUB_COMPETITION_DE: Record<string, string> = {
  "eng.1": "Premier League",
  "eng.fa": "FA Cup",
  "eng.league_cup": "League Cup",
  "esp.1": "LaLiga",
  "esp.copa_del_rey": "Copa del Rey",
  "ita.1": "Serie A",
  "ita.coppa_italia": "Coppa Italia",
  "ger.1": "Bundesliga",
  "ger.dfb_pokal": "DFB-Pokal",
  "fra.1": "Ligue 1",
  "fra.coupe_de_france": "Coupe de France",
  "ned.1": "Eredivisie",
  "sco.1": "Scottish Premiership",
  "gre.1": "Super League (GRE)",
  "usa.1": "MLS",
  "den.1": "Superliga (DEN)",
  "uefa.champions": "Champions League",
  "uefa.europa": "Europa League",
  "uefa.europa.conf": "Conference League",
  "hnl": "SuperSport HNL",
};

/**
 * Kader-Hinweise je Länderspielphase (Ende = letztes Spiel, YYYY-MM-DD).
 * Wird nur angezeigt, solange genau diese Phase die aktuelle ist.
 */
export const SQUAD_NOTES: Record<string, { text: string; source: string; url: string }> = {
  "2026-10-06": {
    text: "Wegen Verletzungen abgesagt: Josip Juranović (Union Berlin) und Martin Erlić (Midtjylland). Nachnominiert: Marin Pongračić, Kristijan Jakić, Lovro Majer.",
    source: "HNS, 21.09.2026",
    url: "https://hns.team/vijesti/31751/slaven-bilic-aktivirao-pretpozive-marinu-pongracicu-kristijanu-jakicu-i-lovri-majeru/",
  },
};
