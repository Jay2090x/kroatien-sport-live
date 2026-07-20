/**
 * Lokalisiert API-Teamnamen (oft EN) für DE / EN / HR.
 * Unbekannte Namen bleiben unverändert.
 */

const TEAM_NAMES: Record<string, { de: string; en: string; hr: string }> = {
  croatia: { de: "Kroatien", en: "Croatia", hr: "Hrvatska" },
  hrvatska: { de: "Kroatien", en: "Croatia", hr: "Hrvatska" },
  kroatien: { de: "Kroatien", en: "Croatia", hr: "Hrvatska" },
  czechia: { de: "Tschechien", en: "Czechia", hr: "Češka" },
  "czech republic": { de: "Tschechien", en: "Czechia", hr: "Češka" },
  tschechien: { de: "Tschechien", en: "Czechia", hr: "Češka" },
  spain: { de: "Spanien", en: "Spain", hr: "Španjolska" },
  spanien: { de: "Spanien", en: "Spain", hr: "Španjolska" },
  england: { de: "England", en: "England", hr: "Engleska" },
  france: { de: "Frankreich", en: "France", hr: "Francuska" },
  frankreich: { de: "Frankreich", en: "France", hr: "Francuska" },
  germany: { de: "Deutschland", en: "Germany", hr: "Njemačka" },
  deutschland: { de: "Deutschland", en: "Germany", hr: "Njemačka" },
  italy: { de: "Italien", en: "Italy", hr: "Italija" },
  italien: { de: "Italien", en: "Italy", hr: "Italija" },
  portugal: { de: "Portugal", en: "Portugal", hr: "Portugal" },
  netherlands: { de: "Niederlande", en: "Netherlands", hr: "Nizozemska" },
  holland: { de: "Niederlande", en: "Netherlands", hr: "Nizozemska" },
  "the netherlands": { de: "Niederlande", en: "Netherlands", hr: "Nizozemska" },
  belgium: { de: "Belgien", en: "Belgium", hr: "Belgija" },
  belgien: { de: "Belgien", en: "Belgium", hr: "Belgija" },
  austria: { de: "Österreich", en: "Austria", hr: "Austrija" },
  österreich: { de: "Österreich", en: "Austria", hr: "Austrija" },
  switzerland: { de: "Schweiz", en: "Switzerland", hr: "Švicarska" },
  schweiz: { de: "Schweiz", en: "Switzerland", hr: "Švicarska" },
  poland: { de: "Polen", en: "Poland", hr: "Poljska" },
  polen: { de: "Polen", en: "Poland", hr: "Poljska" },
  denmark: { de: "Dänemark", en: "Denmark", hr: "Danska" },
  dänemark: { de: "Dänemark", en: "Denmark", hr: "Danska" },
  sweden: { de: "Schweden", en: "Sweden", hr: "Švedska" },
  schweden: { de: "Schweden", en: "Sweden", hr: "Švedska" },
  norway: { de: "Norwegen", en: "Norway", hr: "Norveška" },
  norwegen: { de: "Norwegen", en: "Norway", hr: "Norveška" },
  scotland: { de: "Schottland", en: "Scotland", hr: "Škotska" },
  schottland: { de: "Schottland", en: "Scotland", hr: "Škotska" },
  wales: { de: "Wales", en: "Wales", hr: "Wales" },
  ireland: { de: "Irland", en: "Ireland", hr: "Irska" },
  "republic of ireland": { de: "Irland", en: "Ireland", hr: "Irska" },
  "northern ireland": {
    de: "Nordirland",
    en: "Northern Ireland",
    hr: "Sjeverna Irska",
  },
  turkey: { de: "Türkei", en: "Turkey", hr: "Turska" },
  türkei: { de: "Türkei", en: "Turkey", hr: "Turska" },
  greece: { de: "Griechenland", en: "Greece", hr: "Grčka" },
  griechenland: { de: "Griechenland", en: "Greece", hr: "Grčka" },
  serbia: { de: "Serbien", en: "Serbia", hr: "Srbija" },
  serbien: { de: "Serbien", en: "Serbia", hr: "Srbija" },
  bosnia: { de: "Bosnien-Herzegowina", en: "Bosnia", hr: "BiH" },
  "bosnia and herzegovina": {
    de: "Bosnien-Herzegowina",
    en: "Bosnia and Herzegovina",
    hr: "Bosna i Hercegovina",
  },
  slovenia: { de: "Slowenien", en: "Slovenia", hr: "Slovenija" },
  slowenien: { de: "Slowenien", en: "Slovenia", hr: "Slovenija" },
  slovakia: { de: "Slowakei", en: "Slovakia", hr: "Slovačka" },
  hungary: { de: "Ungarn", en: "Hungary", hr: "Mađarska" },
  ungar: { de: "Ungarn", en: "Hungary", hr: "Mađarska" },
  romania: { de: "Rumänien", en: "Romania", hr: "Rumunjska" },
  ukraine: { de: "Ukraine", en: "Ukraine", hr: "Ukrajina" },
  russia: { de: "Russland", en: "Russia", hr: "Rusija" },
  brasil: { de: "Brasilien", en: "Brazil", hr: "Brazil" },
  brazil: { de: "Brasilien", en: "Brazil", hr: "Brazil" },
  argentina: { de: "Argentinien", en: "Argentina", hr: "Argentina" },
  mexico: { de: "Mexiko", en: "Mexico", hr: "Meksiko" },
  usa: { de: "USA", en: "USA", hr: "SAD" },
  "united states": { de: "USA", en: "USA", hr: "SAD" },
  japan: { de: "Japan", en: "Japan", hr: "Japan" },
  morocco: { de: "Marokko", en: "Morocco", hr: "Maroko" },
  albania: { de: "Albanien", en: "Albania", hr: "Albanija" },
  montenegro: { de: "Montenegro", en: "Montenegro", hr: "Crna Gora" },
  "north macedonia": {
    de: "Nordmazedonien",
    en: "North Macedonia",
    hr: "Sjeverna Makedonija",
  },
  macedonia: { de: "Nordmazedonien", en: "North Macedonia", hr: "Sjeverna Makedonija" },
};

function normKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function localizeTeamName(
  name: string | null | undefined,
  locale: string
): string {
  if (!name) return "";
  const key = normKey(name);
  const entry = TEAM_NAMES[key];
  if (!entry) return name;
  if (locale === "en") return entry.en;
  if (locale === "hr") return entry.hr;
  return entry.de;
}

/** Competition / competition-type labels that often stay EN from APIs */
const COMP_LABELS: Record<string, { de: string; en: string; hr: string }> = {
  "friendly": { de: "Freundschaftsspiel", en: "Friendly", hr: "Prijateljska" },
  "freundschaftsspiel": {
    de: "Freundschaftsspiel",
    en: "Friendly",
    hr: "Prijateljska",
  },
  "international friendly": {
    de: "Freundschaftsspiel",
    en: "International Friendly",
    hr: "Prijateljska",
  },
  "länderspiel": {
    de: "Länderspiel",
    en: "International",
    hr: "Reprezentacija",
  },
  "international": {
    de: "Länderspiel",
    en: "International",
    hr: "Reprezentacija",
  },
  "nations league": {
    de: "Nations League",
    en: "Nations League",
    hr: "Liga nacija",
  },
  "uefa nations league": {
    de: "UEFA Nations League",
    en: "UEFA Nations League",
    hr: "UEFA Liga nacija",
  },
  "world cup": { de: "WM", en: "World Cup", hr: "Svjetsko prvenstvo" },
  "world cup qualifier": {
    de: "WM-Quali",
    en: "World Cup Qualifier",
    hr: "SP kvalifikacije",
  },
  "european championship": {
    de: "EM",
    en: "European Championship",
    hr: "Europsko prvenstvo",
  },
  "euro qualifier": {
    de: "EM-Quali",
    en: "Euro Qualifier",
    hr: "EP kvalifikacije",
  },
};

export function localizeCompetitionLabel(
  label: string | null | undefined,
  locale: string
): string {
  if (!label) return "";
  // Often "Länderspiel · Stadium" or "League · Round"
  const parts = label.split(/\s*[·|–—-]\s*/);
  const head = parts[0]?.trim() ?? label;
  const rest = parts.slice(1).join(" · ").trim();
  const entry = COMP_LABELS[normKey(head)];
  const localizedHead = entry
    ? locale === "en"
      ? entry.en
      : locale === "hr"
        ? entry.hr
        : entry.de
    : head;
  return rest ? `${localizedHead} · ${rest}` : localizedHead;
}
