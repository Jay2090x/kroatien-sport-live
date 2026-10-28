import type { Lang } from "../i18n";

/** Ortsnamen der Momente auf Kroatisch (Daten sind auf Deutsch gepflegt). */
const HR: Record<string, string> = {
  "Nischni Nowgorod": "Nižnji Novgorod",
  "Fisht-Stadion, Sotschi": "stadion Fišt, Soči",
  "Luschniki, Moskau": "Lužnjiki, Moskva",
  "Wörthersee-Stadion, Klagenfurt": "stadion Wörthersee, Klagenfurt",
  "Al Wakrah, Katar": "Al Wakrah, Katar",
};
export const placeLabel = (p: string, lang: Lang) => (lang === "hr" ? (HR[p] ?? p) : p);
