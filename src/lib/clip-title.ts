import { detectLang } from "./lang-detect";
import type { Video } from "./sources/videos";
import type { Lang } from "./i18n";

const SPORT: Record<Lang, Record<string, string>> = {
  de: { football: "Fußball", mma: "MMA" },
  hr: { football: "nogomet", mma: "MMA" },
};

/**
 * Clip-Titel in Seitensprache: Originaltitel nur, wenn er erkennbar in der Seitensprache ist
 * (oder sprachneutral, z. B. "Rijeka 3:0 Hajduk"). Sonst ein eigener Titel aus den Spieldaten.
 */
export function clipTitle(v: Pick<Video, "title" | "channel" | "pairing" | "sport">, lang: Lang): string {
  const p = v.pairing;
  // Mit erkannter Paarung immer einheitlicher Titel in Seitensprache (Originaltitel mischen "Sažetak"/"Highlights")
  if (!p && detectLang(v.title) === lang) return v.title;
  const word = lang === "de" ? "Zusammenfassung" : "Sažetak";
  // HNS-Titel nennen Ländernamen auf Kroatisch → auf DE ohne Paarung (die steht ohnehin beim Spiel)
  if (p && v.channel === "HNS" && lang === "de") return `${word} des Spiels (offizieller Kanal ${v.channel})`;
  if (p) {
    const score = p.homeScore != null && p.awayScore != null ? ` ${p.homeScore}:${p.awayScore}` : "";
    return `${word}: ${p.home} – ${p.away}${score} (${v.channel})`;
  }
  return `Video (${SPORT[lang][v.sport] ?? v.sport}) – ${v.channel}`;
}
