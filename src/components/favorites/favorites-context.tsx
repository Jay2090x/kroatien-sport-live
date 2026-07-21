"use client";

import * as React from "react";
import { STORAGE_KEYS, safeJsonParse } from "@/lib/utils";

interface FavoritesState {
  favoriteIds: string[];
  isFavorite: (playerId: string) => boolean;
  toggleFavorite: (playerId: string) => void;
  setFavorites: (ids: string[]) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (v: boolean) => void;
}

const FavoritesContext = React.createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = React.useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const ids = safeJsonParse<string[]>(
      localStorage.getItem(STORAGE_KEYS.favoritePlayers),
      []
    );
    setFavoriteIds(ids.filter((id) => typeof id === "string"));
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEYS.favoritePlayers,
      JSON.stringify(favoriteIds)
    );
    // keep notification prefs in sync for future push targeting
    try {
      const notif = safeJsonParse<{
        favoritePlayerIds?: string[];
      }>(localStorage.getItem(STORAGE_KEYS.notifications), {});
      localStorage.setItem(
        STORAGE_KEYS.notifications,
        JSON.stringify({ ...notif, favoritePlayerIds: favoriteIds })
      );
    } catch {
      /* ignore */
    }
  }, [favoriteIds, hydrated]);

  const isFavorite = React.useCallback(
    (playerId: string) => favoriteIds.includes(playerId),
    [favoriteIds]
  );

  const toggleFavorite = React.useCallback((playerId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }, []);

  const value = React.useMemo(
    () => ({
      favoriteIds,
      isFavorite,
      toggleFavorite,
      setFavorites: setFavoriteIds,
      favoritesOnly,
      setFavoritesOnly,
    }),
    [favoriteIds, isFavorite, toggleFavorite, favoritesOnly]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = React.useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
