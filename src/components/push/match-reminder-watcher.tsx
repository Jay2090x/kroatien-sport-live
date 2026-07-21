"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useFavorites } from "@/components/favorites/favorites-context";
import { STORAGE_KEYS, safeJsonParse, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes before kickoff
const POLL_MS = 60_000;

/**
 * Local browser notifications ~15 min before kickoff for favorite players' matches
 * (and all matches if matchStart pref is on).
 */
export function MatchReminderWatcher() {
  const { matches } = useDashboard();
  const { favoriteIds } = useFavorites();
  const locale = useLocale();

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    function tick() {
      const notif = safeJsonParse<{
        matchStart?: boolean;
        favoritePlayerIds?: string[];
      }>(localStorage.getItem(STORAGE_KEYS.notifications), {
        matchStart: true,
      });
      if (notif.matchStart === false) return;

      const sent = new Set(
        safeJsonParse<string[]>(
          localStorage.getItem(STORAGE_KEYS.matchRemindersSent),
          []
        )
      );

      const fav =
        favoriteIds.length > 0
          ? new Set(favoriteIds)
          : new Set(notif.favoritePlayerIds ?? []);

      const now = Date.now();
      let changed = false;

      for (const m of matches) {
        if (m.status !== "scheduled" && !isLiveStatus(m.status)) continue;
        if (sent.has(m.id)) continue;

        const kick = new Date(m.kickoff).getTime();
        const delta = kick - now;
        const inWindow =
          (delta > 0 && delta <= WINDOW_MS) ||
          (isLiveStatus(m.status) && delta > -5 * 60_000 && delta < WINDOW_MS);

        if (!inWindow) continue;

        if (fav.size > 0) {
          const hasFav = m.croatianPlayers.some((p) => fav.has(p.playerId));
          if (!hasFav) continue;
        }

        const home = localizeTeamName(m.homeTeam, locale);
        const away = localizeTeamName(m.awayTeam, locale);
        const body = isLiveStatus(m.status)
          ? `LIVE: ${home} – ${away}`
          : `${home} – ${away}`;

        try {
          new Notification("Kroatien Sport Live", {
            body,
            icon: "/icon-192.png",
            tag: `ksl-match-${m.id}`,
          });
          sent.add(m.id);
          changed = true;
        } catch {
          /* ignore */
        }
      }

      if (changed) {
        localStorage.setItem(
          STORAGE_KEYS.matchRemindersSent,
          JSON.stringify([...sent].slice(-80))
        );
      }
    }

    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [matches, favoriteIds, locale]);

  return null;
}
