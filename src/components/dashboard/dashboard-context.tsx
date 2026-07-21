"use client";

import * as React from "react";
import type {
  DateFilter,
  LeagueFilter,
  Match,
  MatchFilters,
  Player,
} from "@/types";
import { filterMatches, filterPlayersBySearch } from "@/lib/utils";
import { applySystemAvailability } from "@/lib/player-availability";
import {
  filterClubMatches,
  filterNationalTeamMatches,
} from "@/lib/data/national-team";

interface DashboardState {
  matches: Match[];
  /** Club-Spiele (ohne Nationalteam) */
  clubMatches: Match[];
  /** Nur Kroatien-Nationalmannschaft */
  nationalTeamMatches: Match[];
  players: Player[];
  /** Spieler gefiltert nach globaler Suche */
  filteredPlayers: Player[];
  lastUpdated: string;
  dataSource: string;
  dataErrors?: string[];
  filters: MatchFilters;
  selectedMatch: Match | null;
  settingsOpen: boolean;
  setLeague: (league: LeagueFilter) => void;
  setDate: (date: DateFilter) => void;
  setSearch: (search: string) => void;
  setPlayerId: (playerId: string | null) => void;
  setSelectedMatch: (match: Match | null) => void;
  setSettingsOpen: (open: boolean) => void;
  resetFilters: () => void;
  filteredMatches: Match[];
  refreshLive: () => Promise<void>;
  isRefreshing: boolean;
}

const defaultFilters: MatchFilters = {
  league: "all",
  date: "all",
  search: "",
  playerId: null,
};

const DashboardContext = React.createContext<DashboardState | null>(null);

export function DashboardProvider({
  children,
  initialMatches,
  initialPlayers,
  lastUpdated: initialLastUpdated,
  dataSource: initialDataSource,
  dataErrors: initialErrors,
}: {
  children: React.ReactNode;
  initialMatches: Match[];
  initialPlayers: Player[];
  lastUpdated: string;
  dataSource: string;
  dataErrors?: string[];
}) {
  const [matches, setMatches] = React.useState(initialMatches);
  const [rawPlayers, setRawPlayers] = React.useState(initialPlayers);
  const [lastUpdated, setLastUpdated] = React.useState(initialLastUpdated);
  const [dataSource, setDataSource] = React.useState(initialDataSource);
  const [dataErrors, setDataErrors] = React.useState(initialErrors);
  const [filters, setFilters] = React.useState<MatchFilters>(defaultFilters);
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    setMatches(initialMatches);
    setRawPlayers(initialPlayers);
    setLastUpdated(initialLastUpdated);
    setDataSource(initialDataSource);
    setDataErrors(initialErrors);
  }, [
    initialMatches,
    initialPlayers,
    initialLastUpdated,
    initialDataSource,
    initialErrors,
  ]);

  const players = React.useMemo(
    () => applySystemAvailability(rawPlayers, matches),
    [rawPlayers, matches]
  );

  const filteredPlayers = React.useMemo(
    () => filterPlayersBySearch(players, filters.search),
    [players, filters.search]
  );

  const clubMatches = React.useMemo(
    () => filterClubMatches(matches),
    [matches]
  );
  const nationalTeamMatches = React.useMemo(
    () => filterNationalTeamMatches(matches),
    [matches]
  );

  // Dashboard-Filter gilt für Club-Spiele
  const filteredMatches = React.useMemo(
    () => filterMatches(clubMatches, filters),
    [clubMatches, filters]
  );

  const refreshLive = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        matches: Match[];
        players: Player[];
        source: string;
        lastUpdated: string;
        errors?: string[];
      };
      setMatches(json.matches ?? []);
      setRawPlayers(json.players ?? []);
      setDataSource(json.source ?? "api");
      setLastUpdated(json.lastUpdated ?? new Date().toISOString());
      setDataErrors(json.errors);
    } catch (e) {
      setDataErrors([e instanceof Error ? e.message : "Refresh failed"]);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      void refreshLive();
    }, 120_000);
    return () => window.clearInterval(id);
  }, [refreshLive]);

  const value = React.useMemo<DashboardState>(
    () => ({
      matches,
      clubMatches,
      nationalTeamMatches,
      players,
      filteredPlayers,
      lastUpdated,
      dataSource,
      dataErrors,
      filters,
      selectedMatch,
      settingsOpen,
      setLeague: (league) => setFilters((f) => ({ ...f, league })),
      setDate: (date) => setFilters((f) => ({ ...f, date })),
      setSearch: (search) => setFilters((f) => ({ ...f, search, playerId: null })),
      setPlayerId: (playerId) => setFilters((f) => ({ ...f, playerId })),
      setSelectedMatch,
      setSettingsOpen,
      resetFilters: () => setFilters(defaultFilters),
      filteredMatches,
      refreshLive,
      isRefreshing,
    }),
    [
      matches,
      clubMatches,
      nationalTeamMatches,
      players,
      filteredPlayers,
      lastUpdated,
      dataSource,
      dataErrors,
      filters,
      selectedMatch,
      settingsOpen,
      filteredMatches,
      refreshLive,
      isRefreshing,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
