/**
 * Recent form (W/D/L) + last appearances with real event data.
 * Club-aware: finds fixtures even if player not listed in croatianPlayers.
 * Only from matches already in the feed – nothing invented.
 */

import type { Match, MatchPlayerAppearance, Player } from "@/types";
import { teamsMatch } from "@/lib/team-match";

export type FormResult = "W" | "D" | "L";

export type PlayerAppearanceSummary = {
  matchId: string;
  kickoff: string;
  /** vs opponent short */
  vs: string;
  scoreLabel: string;
  form?: FormResult;
  app: MatchPlayerAppearance;
  /** Compact chip text e.g. "XI · 90' · ⚽" */
  chip: string;
};

export function computePlayerForm(
  playerId: string,
  matches: Match[],
  max = 5,
  player?: Player
): FormResult[] {
  return computePlayerAppearances(playerId, matches, max, player)
    .map((a) => a.form)
    .filter((f): f is FormResult => f != null);
}

function resolveSide(
  playerId: string,
  player: Player | undefined,
  m: Match
): "home" | "away" | null {
  const listed = m.croatianPlayers.find((p) => p.playerId === playerId);
  if (listed?.teamSide) return listed.teamSide;
  if (player?.club) {
    if (teamsMatch(player.club, m.homeTeam)) return "home";
    if (teamsMatch(player.club, m.awayTeam)) return "away";
  }
  return null;
}

function matchInvolvesPlayer(
  playerId: string,
  player: Player | undefined,
  m: Match
): boolean {
  if (m.croatianPlayers.some((p) => p.playerId === playerId)) return true;
  if (!player?.club) return false;
  return (
    teamsMatch(player.club, m.homeTeam) || teamsMatch(player.club, m.awayTeam)
  );
}

/**
 * Letzte Club-Spiele (live + beendet), neueste zuerst.
 */
export function computePlayerAppearances(
  playerId: string,
  matches: Match[],
  max = 5,
  player?: Player
): PlayerAppearanceSummary[] {
  const relevant = matches
    .filter(
      (m) =>
        (m.status === "finished" ||
          m.status === "live" ||
          m.status === "halftime") &&
        matchInvolvesPlayer(playerId, player, m)
    )
    .sort(
      (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    )
    .slice(0, max);

  const out: PlayerAppearanceSummary[] = [];
  for (const m of relevant) {
    const side = resolveSide(playerId, player, m);
    const listed = m.croatianPlayers.find((p) => p.playerId === playerId);
    const app: MatchPlayerAppearance = listed ?? {
      playerId,
      playerName: player?.name ?? playerId,
      teamSide: side ?? "home",
      position: player?.position,
      eventsKnown: false,
    };

    const vs =
      side === "home"
        ? m.awayTeam
        : side === "away"
          ? m.homeTeam
          : m.awayTeam;

    let form: FormResult | undefined;
    if (
      m.status === "finished" &&
      m.homeScore != null &&
      m.awayScore != null &&
      side
    ) {
      if (m.homeScore === m.awayScore) form = "D";
      else {
        const homeWin = m.homeScore > m.awayScore;
        form = side === "home" ? (homeWin ? "W" : "L") : homeWin ? "L" : "W";
      }
    }

    const scoreLabel =
      m.homeScore != null && m.awayScore != null
        ? `${m.homeScore}:${m.awayScore}`
        : "–";

    out.push({
      matchId: m.id,
      kickoff: m.kickoff,
      vs,
      scoreLabel,
      form,
      app,
      chip: listed ? appearanceChip(listed) : "Club",
    });
  }
  return out;
}

/** Compact event chip for UI – exported for guide merge */
export function appearanceChip(app: MatchPlayerAppearance): string {
  if (app.didPlay === false) return "DNP";
  const bits: string[] = [];
  if (app.isStarter === true) bits.push("XI");
  else if (app.substitutedOn != null) bits.push(`↑${app.substitutedOn}'`);
  else if (app.isStarter === false) bits.push("Bank");
  if (app.minutesPlayed != null && app.minutesPlayed > 0)
    bits.push(`${app.minutesPlayed}'`);
  if (app.goals && app.goals > 0)
    bits.push(app.goals > 1 ? `⚽×${app.goals}` : "⚽");
  if (app.assists && app.assists > 0)
    bits.push(app.assists > 1 ? `A×${app.assists}` : "A");
  if (app.yellowCards && app.yellowCards > 0) bits.push("🟨");
  if (app.redCard) bits.push("🟥");
  if (app.substitutedOff != null) bits.push(`↓${app.substitutedOff}'`);
  if (bits.length === 0) {
    // Im Kader gemappt, aber keine Timeline – ehrlich, kein leerer Strich
    if (app.eventsKnown === false) return "Kader";
    return "Kader";
  }
  return bits.join(" ");
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
