/**
 * Live-first Data Service
 * 1. Supabase (wenn befüllt)
 * 2. Immer Live-APIs (TheSportsDB + OpenLigaDB + optional football-data.org)
 * 3. Spieler-Seed nur für IDs/Bilder-Fallback – KEINE Fake-Matches
 */

import type { DashboardData, Match, Player, RefreshResult } from "@/types";
import { FALLBACK_PLAYERS } from "./fallback-players";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { fetchFromExternalApis } from "@/lib/api/sports";
import { applySystemAvailability } from "@/lib/player-availability";

function mapPlayerRow(row: Record<string, unknown>): Player {
  return {
    id: String(row.id),
    name: String(row.name),
    shortName: row.short_name ? String(row.short_name) : undefined,
    club: String(row.club),
    clubId: row.club_id ? String(row.club_id) : undefined,
    league: row.league as Player["league"],
    leagueName: String(row.league_name),
    position: row.position as Player["position"],
    positionLabel: String(row.position_label ?? row.position),
    nationality: "HR",
    shirtNumber: row.shirt_number != null ? Number(row.shirt_number) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : undefined,
    isActive: row.is_active !== false,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapMatchRow(row: Record<string, unknown>): Match {
  return {
    id: String(row.id),
    homeTeam: String(row.home_team),
    awayTeam: String(row.away_team),
    homeTeamLogo: row.home_team_logo ? String(row.home_team_logo) : undefined,
    awayTeamLogo: row.away_team_logo ? String(row.away_team_logo) : undefined,
    homeScore: row.home_score != null ? Number(row.home_score) : null,
    awayScore: row.away_score != null ? Number(row.away_score) : null,
    status: row.status as Match["status"],
    minute: row.minute != null ? Number(row.minute) : null,
    kickoff: String(row.kickoff),
    league: row.league as Match["league"],
    leagueName: String(row.league_name),
    venue: row.venue ? String(row.venue) : undefined,
    croatianPlayers: Array.isArray(row.croatian_players)
      ? (row.croatian_players as Match["croatianPlayers"])
      : [],
    tvChannels: Array.isArray(row.tv_channels)
      ? (row.tv_channels as Match["tvChannels"])
      : undefined,
    streamHints: Array.isArray(row.stream_hints)
      ? (row.stream_hints as string[])
      : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mergePlayers(primary: Player[], secondary: Player[]): Player[] {
  const map = new Map<string, Player>();
  for (const p of secondary) map.set(p.id, p);
  for (const p of primary) {
    const existing = map.get(p.id);
    if (!existing) {
      map.set(p.id, p);
      continue;
    }
    map.set(p.id, {
      ...existing,
      ...p,
      imageUrl: p.imageUrl || existing.imageUrl,
      club: p.club || existing.club,
      clubId: p.clubId || existing.clubId,
    });
  }
  return Array.from(map.values()).filter((p) => p.isActive !== false);
}

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return Boolean(url && !url.includes("YOUR_PROJECT") && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Immer Live-Daten laden (cached via Next fetch revalidate) */
export async function getLiveData(): Promise<{
  players: Player[];
  matches: Match[];
  source: DashboardData["source"];
  errors?: string[];
}> {
  const live = await fetchFromExternalApis();
  const matches = live.matches; // bewusst KEINE Fake-Matches
  const players = applySystemAvailability(
    mergePlayers(live.players, FALLBACK_PLAYERS),
    matches
  );
  return {
    players,
    matches,
    source: live.source === "empty" ? "api" : live.source === "partial" ? "partial" : "api",
    errors: live.errors.length ? live.errors : undefined,
  };
}

export async function getPlayers(): Promise<Player[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("players")
          .select("*")
          .eq("is_active", true)
          .order("name");
        if (!error && data?.length) {
          return mergePlayers(
            data.map((row) => mapPlayerRow(row as Record<string, unknown>)),
            FALLBACK_PLAYERS
          );
        }
      }
    } catch {
      // live
    }
  }

  const live = await getLiveData();
  return live.players;
}

export async function getMatches(): Promise<Match[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("matches")
          .select("*")
          .order("kickoff", { ascending: true });
        if (!error && data?.length) {
          return data.map((row) => mapMatchRow(row as Record<string, unknown>));
        }
      }
    } catch {
      // live
    }
  }

  const live = await getLiveData();
  return live.matches;
}

export async function getDashboardData(): Promise<DashboardData & { errors?: string[] }> {
  // Live first – immer frische API-Daten (mit Next-Cache)
  try {
    const live = await getLiveData();

    // Optional: Supabase-Matches mergen wenn neuer / mehr
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        if (supabase) {
          const { data } = await supabase
            .from("matches")
            .select("*")
            .order("kickoff", { ascending: true });
          if (data?.length) {
            const dbMatches = data.map((r) => mapMatchRow(r as Record<string, unknown>));
            // Live priorisieren, DB nur ergänzen
            const byId = new Map<string, Match>();
            for (const m of dbMatches) byId.set(m.id, m);
            for (const m of live.matches) byId.set(m.id, m);
            return {
              matches: Array.from(byId.values()).sort(
                (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
              ),
              players: live.players,
              lastUpdated: new Date().toISOString(),
              source: "supabase",
              errors: live.errors,
            };
          }
        }
      } catch {
        // ignore
      }
    }

    return {
      matches: live.matches,
      players: live.players,
      lastUpdated: new Date().toISOString(),
      source: live.source,
      errors: live.errors,
    };
  } catch (e) {
    // Absolute Notfall: echte Spieler-Seed, leere Matches (kein Fake-Live)
    return {
      matches: [],
      players: FALLBACK_PLAYERS,
      lastUpdated: new Date().toISOString(),
      source: "api",
      errors: [e instanceof Error ? e.message : "Live fetch failed"],
    };
  }
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const players = await getPlayers();
  return players.find((p) => p.id === id) ?? null;
}

export async function getMatchesForPlayer(playerId: string): Promise<Match[]> {
  const matches = await getMatches();
  return matches
    .filter((m) => m.croatianPlayers.some((p) => p.playerId === playerId))
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
}

export async function refreshData(apiKeys?: {
  theSportsDbKey?: string;
  footballDataKey?: string;
}): Promise<RefreshResult> {
  const errors: string[] = [];
  let matchesUpdated = 0;
  let playersUpdated = 0;
  let source = "api";

  try {
    const live = await fetchFromExternalApis(apiKeys);
    const players = mergePlayers(live.players, FALLBACK_PLAYERS);
    const matches = live.matches;
    source = live.source;
    if (live.errors.length) errors.push(...live.errors);

    const service = createServiceClient();
    if (service) {
      const playerRows = players.map((p) => ({
        id: p.id,
        name: p.name,
        short_name: p.shortName ?? null,
        club: p.club,
        club_id: p.clubId ?? null,
        league: p.league,
        league_name: p.leagueName,
        position: p.position,
        position_label: p.positionLabel,
        nationality: "HR",
        shirt_number: p.shirtNumber ?? null,
        image_url: p.imageUrl ?? null,
        date_of_birth: p.dateOfBirth ?? null,
        is_active: p.isActive,
        updated_at: new Date().toISOString(),
      }));

      const { error: pErr, count: pCount } = await service
        .from("players")
        .upsert(playerRows, { onConflict: "id", count: "exact" });

      if (pErr) errors.push(`players: ${pErr.message}`);
      else playersUpdated = pCount ?? playerRows.length;

      const matchRows = matches.map((m) => ({
        id: m.id,
        home_team: m.homeTeam,
        away_team: m.awayTeam,
        home_team_logo: m.homeTeamLogo ?? null,
        away_team_logo: m.awayTeamLogo ?? null,
        home_score: m.homeScore,
        away_score: m.awayScore,
        status: m.status,
        minute: m.minute ?? null,
        kickoff: m.kickoff,
        league: m.league,
        league_name: m.leagueName,
        venue: m.venue ?? null,
        croatian_players: m.croatianPlayers,
        tv_channels: m.tvChannels ?? [],
        updated_at: new Date().toISOString(),
      }));

      if (matchRows.length) {
        const { error: mErr, count: mCount } = await service
          .from("matches")
          .upsert(matchRows, { onConflict: "id", count: "exact" });

        if (mErr) errors.push(`matches: ${mErr.message}`);
        else matchesUpdated = mCount ?? matchRows.length;
      }

      source = "supabase";
    } else {
      playersUpdated = players.length;
      matchesUpdated = matches.length;
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Unknown refresh error");
  }

  return {
    success: errors.length === 0,
    matchesUpdated,
    playersUpdated,
    source,
    errors: errors.length ? errors : undefined,
    timestamp: new Date().toISOString(),
  };
}
