/**
 * Recent form (W/D/L) derived only from finished match scores we already show.
 * No invented results – empty if scores missing.
 */

import type { Match, Player } from "@/types";

export type FormResult = "W" | "D" | "L";

export function computePlayerForm(
  playerId: string,
  matches: Match[],
  max = 5
): FormResult[] {
  const finished = matches
    .filter(
      (m) =>
        m.status === "finished" &&
        m.homeScore != null &&
        m.awayScore != null &&
        m.croatianPlayers.some((p) => p.playerId === playerId)
    )
    .sort(
      (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    )
    .slice(0, max);

  const out: FormResult[] = [];
  for (const m of finished) {
    const side = m.croatianPlayers.find((p) => p.playerId === playerId)
      ?.teamSide;
    if (!side || m.homeScore == null || m.awayScore == null) continue;
    const hs = m.homeScore;
    const as = m.awayScore;
    if (hs === as) {
      out.push("D");
      continue;
    }
    const homeWin = hs > as;
    if (side === "home") out.push(homeWin ? "W" : "L");
    else out.push(homeWin ? "L" : "W");
  }
  return out;
}

export function formSummary(form: FormResult[]): string {
  if (form.length === 0) return "";
  return form.join("");
}

/** Suggested “star” players when favorites empty: most upcoming appearances */
export function suggestPlayers(
  players: Player[],
  matches: Match[],
  limit = 6
): Player[] {
  const scores = new Map<string, number>();
  const upcoming = matches.filter(
    (m) =>
      m.status === "scheduled" ||
      m.status === "live" ||
      m.status === "halftime" ||
      m.status === "postponed"
  );
  for (const m of upcoming) {
    for (const p of m.croatianPlayers) {
      scores.set(p.playerId, (scores.get(p.playerId) ?? 0) + 2);
    }
  }
  // slight boost for active players with image (recognizable)
  for (const p of players) {
    if (!p.isActive) continue;
    let s = scores.get(p.id) ?? 0;
    if (p.imageUrl) s += 0.5;
    scores.set(p.id, s);
  }
  return [...players]
    .filter((p) => p.isActive)
    .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
    .slice(0, limit);
}
