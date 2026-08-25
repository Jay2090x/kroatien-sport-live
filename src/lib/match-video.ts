/**
 * Highlight-Links: offizielles TSDB-Video falls vorhanden,
 * sonst YouTube-Suche (kein Hosting, kein Scraping).
 */

export type MatchVideoRef = {
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  videoUrl?: string;
};

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    query
  )}`;
}

export function youtubeMatchHighlightsUrl(m: MatchVideoRef): string {
  const d = new Date(m.kickoff);
  const year = Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
  const q = [m.homeTeam, m.awayTeam, year, "highlights", "football"]
    .filter(Boolean)
    .join(" ");
  return youtubeSearchUrl(q);
}

/** Player + last fixture – better chance of the right clip */
export function youtubePlayerMatchUrl(
  playerName: string,
  m?: MatchVideoRef | null
): string {
  if (!m) return youtubeSearchUrl(`${playerName} highlights football`);
  const d = new Date(m.kickoff);
  const year = Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
  return youtubeSearchUrl(
    `${playerName} ${m.homeTeam} ${m.awayTeam} ${year} highlights`
  );
}

export function highlightHref(m: MatchVideoRef): string {
  const raw = m.videoUrl?.trim();
  if (raw && /^https?:\/\//i.test(raw) && /youtube\.com|youtu\.be/i.test(raw)) {
    return raw;
  }
  return youtubeMatchHighlightsUrl(m);
}
