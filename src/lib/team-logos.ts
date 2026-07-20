/**
 * Team-Logos / Länderflaggen für UI (ESPN country crests + Club-Logos aus Match).
 */

const COUNTRY: Record<string, string> = {
  croatia: "cro",
  kroatien: "cro",
  hrvatska: "cro",
  cro: "cro",
  england: "eng",
  eng: "eng",
  spain: "esp",
  spanien: "esp",
  espana: "esp",
  esp: "esp",
  portugal: "por",
  por: "por",
  czechia: "cze",
  "czech republic": "cze",
  tschechien: "cze",
  cesko: "cze",
  france: "fra",
  frankreich: "fra",
  fra: "fra",
  germany: "ger",
  deutschland: "ger",
  ger: "ger",
  italy: "ita",
  italien: "ita",
  ita: "ita",
  netherlands: "ned",
  holland: "ned",
  niederlande: "ned",
  ned: "ned",
  poland: "pol",
  polen: "pol",
  pol: "pol",
  turkey: "tur",
  turkei: "tur",
  turkiye: "tur",
  tur: "tur",
  scotland: "sco",
  schottland: "sco",
  sco: "sco",
  wales: "wal",
  wal: "wal",
  belgium: "bel",
  belgien: "bel",
  bel: "bel",
  austria: "aut",
  osterreich: "aut",
  aut: "aut",
  switzerland: "sui",
  schweiz: "sui",
  sui: "sui",
  serbia: "srb",
  serbien: "srb",
  srb: "srb",
  slovenia: "svn",
  slowenien: "svn",
  svn: "svn",
  hungary: "hun",
  ungarn: "hun",
  hun: "hun",
  ghana: "gha",
  gha: "gha",
  panama: "pan",
  pan: "pan",
  denmark: "den",
  danemark: "den",
  den: "den",
  norway: "nor",
  norwegen: "nor",
  nor: "nor",
  sweden: "swe",
  schweden: "swe",
  swe: "swe",
  ukraine: "ukr",
  ukr: "ukr",
  albania: "alb",
  albanien: "alb",
  alb: "alb",
};

export function countryCodeFromTeam(name: string): string | null {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (COUNTRY[s]) return COUNTRY[s]!;
  for (const [key, code] of Object.entries(COUNTRY)) {
    if (s.includes(key) || key.includes(s)) return code;
  }
  return null;
}

export function countryFlagUrl(name: string): string | null {
  const code = countryCodeFromTeam(name);
  if (!code) return null;
  return `https://a.espncdn.com/i/teamlogos/countries/500/${code}.png`;
}

/** Prefer match logo, else country flag for national teams */
export function teamLogoUrl(
  teamName: string,
  matchLogo?: string | null
): string | null {
  if (matchLogo) return matchLogo;
  return countryFlagUrl(teamName);
}
