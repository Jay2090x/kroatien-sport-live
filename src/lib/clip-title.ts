import { detectLang } from "./lang-detect";
import type { Video } from "./sources/videos";
import type { Lang } from "./i18n";

const SPORT: Record<Lang, Record<string, string>> = {
  de: { football: "Fußball", mma: "MMA", basketball: "Basketball", handball: "Handball", tennis: "Tennis", boxing: "Boxen", volleyball: "Volleyball", waterpolo: "Wasserball" },
  hr: { football: "nogomet", mma: "MMA", basketball: "košarka", handball: "rukomet", tennis: "tenis", boxing: "boks", volleyball: "odbojka", waterpolo: "vaterpolo" },
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
  // Sprachneutrale Paarung mit Ergebnis im Originaltitel, z. B. "TRIER vs SPLIT 100:80 (3. kolo, …)"
  const m = v.title.match(/^\s*([^()|:]{2,40}?)\s+(?:vs\.?|–|-)\s+([^()|:]{2,40}?)\s+(\d{1,3})\s*:\s*(\d{1,3})\b/i);
  if (m) {
    const nice = (t: string) => t.trim().replace(/\p{Lu}{2,}/gu, (w) => w.charAt(0) + w.slice(1).toLowerCase());
    return `${word}: ${nice(m[1])} – ${nice(m[2])} ${m[3]}:${m[4]} (${v.channel})`;
  }
  return `Video (${SPORT[lang][v.sport] ?? v.sport}) – ${v.channel}`;
}
