/**
 * Nächstes + letztes Club-Spiel pro Spieler.
 * Matcht über clubId / strikten Club-Namen – auch wenn API
 * den Spieler nicht in croatianPlayers listet (häufig).
 */

import type { Match, Player } from "@/types";
import { teamsMatch } from "@/lib/team-match";
import { appearanceChip } from "@/lib/player-form";
import { isLiveStatus } from "@/lib/utils";

export type PlayerScheduleRow = {
  player: Player;
  next: Match | null;
  last: Match | null;
  /** e.g. "1:0 W · vs Arsenal · 90' XI" or "1:0 · vs Arsenal" */
  lastLabel: string | null;
  nextLabel: string | null;
  /** Form from last up to 5 club results (W/D/L) */
  form: Array<"W" | "D" | "L">;
};

function playerInMatch(player: Player, m: Match): boolean {
  if (m.croatianPlayers?.some((p) => p.playerId === player.id)) return true;
  if (!player.club) return false;
  return teamsMatch(player.club, m.homeTeam) || teamsMatch(player.club, m.awayTeam);
}

function sideOf(player: Player, m: Match): "home" | "away" | null {
  const listed = m.croatianPlayers?.find((p) => p.playerId === player.id);
  if (listed?.teamSide) return listed.teamSide;
  if (player.club && teamsMatch(player.club, m.homeTeam)) return "home";
  if (player.club && teamsMatch(player.club, m.awayTeam)) return "away";
  return null;
}

function formFor(
  player: Player,
  m: Match
): "W" | "D" | "L" | null {
  if (m.status !== "finished") return null;
  if (m.homeScore == null || m.awayScore == null) return null;
  const side = sideOf(player, m);
  if (!side) return null;
  if (m.homeScore === m.awayScore) return "D";
  const homeWin = m.homeScore > m.awayScore;
  return side === "home" ? (homeWin ? "W" : "L") : homeWin ? "L" : "W";
}

function oppLabel(player: Player, m: Match): string {
  const side = sideOf(player, m);
  if (side === "home") return m.awayTeam;
  if (side === "away") return m.homeTeam;
  return `${m.homeTeam} – ${m.awayTeam}`;
}

function scoreLabel(m: Match): string {
  if (m.homeScore != null && m.awayScore != null)
    return `${m.homeScore}:${m.awayScore}`;
  return "–";
}

export function formatLastLabel(
  player: Player,
  m: Match,
  locale = "de"
): string {
  const score = scoreLabel(m);
  const form = formFor(player, m);
  const vs = oppLabel(player, m);
  const shortVs = vs.length > 22 ? `${vs.slice(0, 20)}…` : vs;
  const app = m.croatianPlayers?.find((p) => p.playerId === player.id);
  const chip = app ? appearanceChip(app) : null;
  const bits = [
    score,
    form,
    `vs ${shortVs}`,
    chip && chip !== "·" && chip !== "Kader" ? chip : null,
  ].filter(Boolean);
  void locale;
  return bits.join(" · ");
}

export function formatNextLabel(
  player: Player,
  m: Match,
  locale: string,
  liveLabel: string
): string {
  const vs = oppLabel(player, m);
  const shortVs = vs.length > 22 ? `${vs.slice(0, 20)}…` : vs;
  if (isLiveStatus(m.status)) return `${liveLabel} · vs ${shortVs}`;
  try {
    const d = new Date(m.kickoff);
    const when = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    return `${when} · vs ${shortVs}`;
  } catch {
    return `vs ${shortVs}`;
  }
}

/** All fixtures involving player's club (strict), sorted by kickoff */
export function clubMatchesForPlayer(
  player: Player,
  matches: Match[]
): Match[] {
  return matches
    .filter((m) => playerInMatch(player, m))
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
}

export function buildPlayerSchedule(
  players: Player[],
  matches: Match[],
  locale: string,
  liveLabel: string,
  opts?: { limit?: number; onlyWithFixture?: boolean }
): PlayerScheduleRow[] {
  const limit = opts?.limit ?? 24;
  const rows: PlayerScheduleRow[] = [];

  for (const player of players) {
    if (!player.isActive) continue;
    const clubMs = clubMatchesForPlayer(player, matches);
    const next =
      clubMs.find(
        (m) =>
          m.status === "scheduled" ||
          m.status === "live" ||
          m.status === "halftime" ||
          m.status === "postponed"
      ) ?? null;
    const past = clubMs
      .filter((m) => m.status === "finished")
      .sort(
        (a, b) =>
          new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
      );
    const last = past[0] ?? null;
    const form = past
      .slice(0, 5)
      .map((m) => formFor(player, m))
      .filter((f): f is "W" | "D" | "L" => f != null);

    if (opts?.onlyWithFixture && !next && !last) continue;

    rows.push({
      player,
      next,
      last,
      lastLabel: last ? formatLastLabel(player, last, locale) : null,
      nextLabel: next
        ? formatNextLabel(player, next, locale, liveLabel)
        : null,
      form,
    });
  }

  // Prioritize: live → has next soon → has last → name
  const now = Date.now();
  rows.sort((a, b) => {
    const score = (r: PlayerScheduleRow) => {
      let s = 0;
      if (r.next && isLiveStatus(r.next.status)) s += 1000;
      if (r.next) {
        const t = new Date(r.next.kickoff).getTime() - now;
        if (t >= 0 && t < 3 * 24 * 3600_000) s += 400;
        else if (t >= 0 && t < 7 * 24 * 3600_000) s += 200;
        else if (t >= 0) s += 50;
      }
      if (r.last) s += 30;
      if (r.form.length) s += 10;
      return s;
    };
    const d = score(b) - score(a);
    if (d !== 0) return d;
    return a.player.name.localeCompare(b.player.name);
  });

  return rows.slice(0, limit);
}

/** Next match map for cards – club-aware, not only croatianPlayers */
export function buildNextMatchByPlayer(
  players: Player[],
  matches: Match[]
): Map<string, Match> {
  const map = new Map<string, Match>();
  for (const p of players) {
    const clubMs = clubMatchesForPlayer(p, matches);
    const next = clubMs.find(
      (m) =>
        m.status === "scheduled" ||
        m.status === "live" ||
        m.status === "halftime" ||
        m.status === "postponed"
    );
    if (next) map.set(p.id, next);
  }
  return map;
}
