/**
 * Legale Free-Streams / Mediatheken (öffentlich-rechtlich & Free-to-Air).
 * Keine illegalen Streams. Geo-Rechte und AGB der Anbieter gelten.
 */

export type FreeStream = {
  id: string;
  name: string;
  url: string;
  /** ISO 3166-1 alpha-2 Länder, in denen der Dienst typisch free/legal erreichbar ist */
  countries: string[];
  /** Kurz: was man bekommt */
  note: { de: string; en: string; hr: string };
  /** Für VPN-Hinweis: z.B. "DE" */
  vpnCountry?: string;
};

/** Free-to-Air / öffentlich-rechtliche Mediatheken */
export const FREE_LEGAL_STREAMS: FreeStream[] = [
  {
    id: "hrt",
    name: "HRT – HRTi",
    url: "https://player.hrt.hr/",
    countries: ["HR"],
    note: {
      de: "Kroatischer öffentlich-rechtlicher Stream (lokal free).",
      en: "Croatian public broadcaster stream (free in-region).",
      hr: "Hrvatski javni servis – besplatno u regiji.",
    },
    vpnCountry: "HR",
  },
  {
    id: "orf",
    name: "ORF ON",
    url: "https://on.orf.at/",
    countries: ["AT"],
    note: {
      de: "Österreichischer ORF – Sport je nach Rechte free in AT.",
      en: "Austrian ORF – sports free in AT depending on rights.",
      hr: "Austrijski ORF – sport ovisno o pravima free u AT.",
    },
    vpnCountry: "AT",
  },
  {
    id: "ard",
    name: "ARD Mediathek / Sportschau",
    url: "https://www.sportschau.de/",
    countries: ["DE"],
    note: {
      de: "Kostenlose Mediathek – Länderspiele je nach ARD-Rechten.",
      en: "Free media library – internationals when ARD holds rights.",
      hr: "Besplatna medijateka – reprezentacija kad ARD ima prava.",
    },
    vpnCountry: "DE",
  },
  {
    id: "zdf",
    name: "ZDF Mediathek",
    url: "https://www.zdf.de/sport",
    countries: ["DE"],
    note: {
      de: "Kostenloser ZDF-Sport – je nach Übertragungsrechten.",
      en: "Free ZDF sports – depending on broadcast rights.",
      hr: "Besplatni ZDF sport – ovisno o pravima prijenosa.",
    },
    vpnCountry: "DE",
  },
  {
    id: "rai",
    name: "RaiPlay Sport",
    url: "https://www.raiplay.it/sport",
    countries: ["IT"],
    note: {
      de: "Italienischer Free-Service – Geo IT.",
      en: "Italian free service – geo IT.",
      hr: "Talijanski free servis – geo IT.",
    },
    vpnCountry: "IT",
  },
  {
    id: "rtve",
    name: "RTVE Play",
    url: "https://www.rtve.es/play/deportes/",
    countries: ["ES"],
    note: {
      de: "Spanischer öffentlich-rechtlicher Sportstream (ES).",
      en: "Spanish public sports stream (ES).",
      hr: "Španjolski javni sportski stream (ES).",
    },
    vpnCountry: "ES",
  },
  {
    id: "france-tv",
    name: "france.tv Sport",
    url: "https://www.france.tv/sport/",
    countries: ["FR"],
    note: {
      de: "Französischer Free-Stream – Geo FR.",
      en: "French free stream – geo FR.",
      hr: "Francuski free stream – geo FR.",
    },
    vpnCountry: "FR",
  },
  {
    id: "bbc-sport",
    name: "BBC Sport",
    url: "https://www.bbc.com/sport",
    countries: ["GB"],
    note: {
      de: "News/Highlights free; Live je nach Rechte oft UK-only.",
      en: "News/highlights free; live often UK-only by rights.",
      hr: "Vijesti/highlights free; live često samo UK.",
    },
    vpnCountry: "GB",
  },
  {
    id: "fifa-plus",
    name: "FIFA+",
    url: "https://www.fifa.com/fifaplus",
    countries: ["*"],
    note: {
      de: "Offizielle FIFA-Plattform – ausgewählte Spiele/Dokus free weltweit.",
      en: "Official FIFA platform – selected matches/docs free worldwide.",
      hr: "Službena FIFA platforma – odabrane utakmice/dokumentarci free.",
    },
  },
  {
    id: "uefa-tv",
    name: "UEFA.tv",
    url: "https://www.uefa.tv/",
    countries: ["*"],
    note: {
      de: "Offizielle UEFA-Inhalte – Highlights & ausgewählter Free-Content.",
      en: "Official UEFA content – highlights & selected free shows.",
      hr: "Službeni UEFA sadržaj – highlights i odabrani free program.",
    },
  },
  {
    id: "yt-uefa",
    name: "YouTube · UEFA",
    url: "https://www.youtube.com/@UEFA",
    countries: ["*"],
    note: {
      de: "Offizielle Highlights & Clips (legal, free).",
      en: "Official highlights & clips (legal, free).",
      hr: "Službeni highlights i clipovi (legalno, free).",
    },
  },
  {
    id: "yt-fifa",
    name: "YouTube · FIFA",
    url: "https://www.youtube.com/@fifa",
    countries: ["*"],
    note: {
      de: "Offizielle FIFA-Clips und Zusammenfassungen.",
      en: "Official FIFA clips and recaps.",
      hr: "Službeni FIFA clipovi i sažeci.",
    },
  },
];

export function streamsForCountry(iso: string | null): FreeStream[] {
  if (!iso) return FREE_LEGAL_STREAMS.filter((s) => s.countries.includes("*"));
  const c = iso.toUpperCase();
  return FREE_LEGAL_STREAMS.filter(
    (s) => s.countries.includes("*") || s.countries.includes(c)
  );
}

export function vpnStreamsForCountry(iso: string | null): FreeStream[] {
  const local = new Set(streamsForCountry(iso).map((s) => s.id));
  // Andere Länder-Mediatheken (geo), die man oft per VPN ansteuert
  return FREE_LEGAL_STREAMS.filter(
    (s) =>
      s.vpnCountry &&
      !s.countries.includes("*") &&
      !local.has(s.id) &&
      (!iso || s.vpnCountry !== iso.toUpperCase())
  );
}

export const COUNTRY_LABELS: Record<string, { de: string; en: string; hr: string }> = {
  HR: { de: "Kroatien", en: "Croatia", hr: "Hrvatska" },
  DE: { de: "Deutschland", en: "Germany", hr: "Njemačka" },
  AT: { de: "Österreich", en: "Austria", hr: "Austrija" },
  CH: { de: "Schweiz", en: "Switzerland", hr: "Švicarska" },
  IT: { de: "Italien", en: "Italy", hr: "Italija" },
  ES: { de: "Spanien", en: "Spain", hr: "Španjolska" },
  FR: { de: "Frankreich", en: "France", hr: "Francuska" },
  GB: { de: "Großbritannien", en: "United Kingdom", hr: "Ujedinjeno Kraljevstvo" },
  BA: { de: "Bosnien", en: "Bosnia", hr: "BiH" },
  SI: { de: "Slowenien", en: "Slovenia", hr: "Slovenija" },
  RS: { de: "Serbien", en: "Serbia", hr: "Srbija" },
  US: { de: "USA", en: "USA", hr: "SAD" },
};
