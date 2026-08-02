/**
 * Legale Free-to-Air / öffentlich-rechtliche Mediatheken.
 * Keine illegalen Streams, kein VPN-Framing, kein Affiliate.
 */

export type FreeStream = {
  id: string;
  name: string;
  url: string;
  /** ISO 3166-1 alpha-2 */
  countries: string[];
  note: { de: string; en: string; hr: string };
};

export const FREE_LEGAL_STREAMS: FreeStream[] = [
  {
    id: "hrt",
    name: "HRT – HRTi",
    url: "https://player.hrt.hr/",
    countries: ["HR"],
    note: {
      de: "Kroatischer öffentlich-rechtlicher Dienst (Verfügbarkeit regional).",
      en: "Croatian public broadcaster (regional availability).",
      hr: "Hrvatski javni servis (regionalna dostupnost).",
    },
  },
  {
    id: "orf",
    name: "ORF ON",
    url: "https://on.orf.at/",
    countries: ["AT"],
    note: {
      de: "Österreichischer ORF – Inhalte je nach Rechten in AT.",
      en: "Austrian ORF – content by rights in AT.",
      hr: "Austrijski ORF – sadržaj ovisno o pravima u AT.",
    },
  },
  {
    id: "ard",
    name: "ARD Mediathek / Sportschau",
    url: "https://www.sportschau.de/",
    countries: ["DE"],
    note: {
      de: "Öffentlich-rechtliche Mediathek – nur bei bestehenden Senderechten.",
      en: "Public media library – only when broadcast rights exist.",
      hr: "Javna medijateka – samo kad postoje prava prijenosa.",
    },
  },
  {
    id: "zdf",
    name: "ZDF Mediathek",
    url: "https://www.zdf.de/sport",
    countries: ["DE"],
    note: {
      de: "ZDF-Sport je nach Übertragungsrechten.",
      en: "ZDF sports depending on rights.",
      hr: "ZDF sport ovisno o pravima.",
    },
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
  },
  {
    id: "rtve",
    name: "RTVE Play",
    url: "https://www.rtve.es/play/deportes/",
    countries: ["ES"],
    note: {
      de: "Spanischer öffentlich-rechtlicher Dienst (ES).",
      en: "Spanish public service (ES).",
      hr: "Španjolski javni servis (ES).",
    },
  },
  {
    id: "france-tv",
    name: "france.tv Sport",
    url: "https://www.france.tv/sport/",
    countries: ["FR"],
    note: {
      de: "Französischer Free-Service – Geo FR.",
      en: "French free service – geo FR.",
      hr: "Francuski free servis – geo FR.",
    },
  },
  {
    id: "bbc-sport",
    name: "BBC Sport",
    url: "https://www.bbc.com/sport",
    countries: ["GB"],
    note: {
      de: "News/Highlights; Live oft nur mit UK-Rechten.",
      en: "News/highlights; live often UK rights only.",
      hr: "Vijesti/highlights; live često samo UK prava.",
    },
  },
  {
    id: "fifa-plus",
    name: "FIFA+",
    url: "https://www.fifa.com/fifaplus",
    countries: ["*"],
    note: {
      de: "Offizielle FIFA-Plattform – ausgewählte Inhalte.",
      en: "Official FIFA platform – selected content.",
      hr: "Službena FIFA platforma – odabrani sadržaj.",
    },
  },
  {
    id: "uefa-tv",
    name: "UEFA.tv",
    url: "https://www.uefa.tv/",
    countries: ["*"],
    note: {
      de: "Offizielle UEFA-Inhalte / Highlights.",
      en: "Official UEFA content / highlights.",
      hr: "Službeni UEFA sadržaj / highlights.",
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

/** VPN-Funktion entfernt – bleibt als No-Op für eventuelle Importe */
export function vpnStreamsForCountry(): FreeStream[] {
  return [];
}

export const COUNTRY_LABELS: Record<
  string,
  { de: string; en: string; hr: string }
> = {
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
