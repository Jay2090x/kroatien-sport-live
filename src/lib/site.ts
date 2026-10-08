export const SITE = {
  name: "Kroatien Sport Live",
  tagline: "Vatreni · SuperSport HNL · News",
  description:
    "Nächstes Länderspiel, letzte Ergebnisse der Vatreni, die aktuelle SuperSport-HNL-Tabelle und kroatische Fußball-Headlines – automatisch aktualisiert.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL || "https://kroatien-sport-live.vercel.app",
  /** Kontakt nur per E-Mail – keine personenbezogenen Daten im Impressum. */
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "kontakt@kroatien-sport-live.app",
} as const;

export const TIME_ZONE = "Europe/Vienna";
