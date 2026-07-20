"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, User, Calendar, X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Input } from "@/components/ui/input";
import { cn, textMatchesQuery, isLiveStatus, formatKickoff } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import Image from "next/image";

/**
 * Globale Suche: Spieler + Spiele, Dropdown, Scroll zu Sektionen
 */
export function GlobalSearch({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const {
    filters,
    setSearch,
    setPlayerId,
    setSelectedMatch,
    players,
    clubMatches,
    nationalTeamMatches,
    resetFilters,
  } = useDashboard();

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const q = filters.search.trim();

  const playerHits = useMemo(() => {
    if (!q) return [];
    return players
      .filter(
        (p) =>
          textMatchesQuery(p.name, q) ||
          textMatchesQuery(p.shortName || "", q) ||
          textMatchesQuery(p.club, q)
      )
      .slice(0, 6);
  }, [players, q]);

  const matchHits = useMemo(() => {
    if (!q) return [];
    const all = [...nationalTeamMatches, ...clubMatches];
    return all
      .filter(
        (m) =>
          textMatchesQuery(m.homeTeam, q) ||
          textMatchesQuery(m.awayTeam, q) ||
          textMatchesQuery(m.leagueName, q) ||
          m.croatianPlayers.some((p) => textMatchesQuery(p.playerName, q))
      )
      .slice(0, 6);
  }, [clubMatches, nationalTeamMatches, q]);

  const hasHits = playerHits.length > 0 || matchHits.length > 0;
  const showPanel = open && q.length >= 1;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function goPlayers() {
    setOpen(false);
    document.getElementById("players")?.scrollIntoView({ behavior: "smooth" });
  }

  function goMatches() {
    setOpen(false);
    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
  }

  function pickPlayer(id: string) {
    setPlayerId(id);
    setOpen(false);
    document.getElementById("players")?.scrollIntoView({ behavior: "smooth" });
  }

  function pickMatch(id: string) {
    const m =
      clubMatches.find((x) => x.id === id) ||
      nationalTeamMatches.find((x) => x.id === id);
    if (m) setSelectedMatch(m);
    setOpen(false);
    document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" });
  }

  function clear() {
    setSearch("");
    resetFilters();
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative min-w-0 flex-1 transition-all sm:max-w-xs md:max-w-sm",
        focused && "sm:max-w-md",
        className
      )}
    >
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={filters.search}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (playerHits[0]) pickPlayer(playerHits[0].id);
            else if (matchHits[0]) pickMatch(matchHits[0].id);
            else if (q) goPlayers();
          }
          if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={t("search")}
        className="h-8 border-border bg-secondary/50 pl-8 pr-8 text-xs"
        aria-label={t("search")}
        aria-expanded={showPanel}
        autoComplete="off"
      />
      {q && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[70vh] overflow-y-auto rounded-xl border-2 border-border bg-card py-1 shadow-xl">
          {!hasHits && (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              Keine Treffer für „{q}“
            </p>
          )}

          {playerHits.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Spieler
              </p>
              <ul>
                {playerHits.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickPlayer(p.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary"
                    >
                      <div className="relative h-8 w-8 overflow-hidden rounded-full bg-secondary">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="h-full w-full object-contain object-bottom"
                            unoptimized
                          />
                        ) : (
                          <User className="m-1.5 h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {p.club} · {p.position}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={goPlayers}
                className="w-full px-3 py-1.5 text-left text-[11px] font-semibold text-primary hover:bg-secondary"
              >
                Alle Spieler-Treffer anzeigen →
              </button>
            </div>
          )}

          {matchHits.length > 0 && (
            <div className="border-t border-border">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Spiele
              </p>
              <ul>
                {matchHits.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickMatch(m.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-secondary"
                    >
                      <Calendar className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {localizeTeamName(m.homeTeam, locale)} –{" "}
                          {localizeTeamName(m.awayTeam, locale)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {isLiveStatus(m.status) ? `${tMatch("live")} · ` : ""}
                          {formatKickoff(
                            m.kickoff,
                            "EEE, d. MMM · HH:mm",
                            locale
                          )}{" "}
                          · {m.leagueName}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={goMatches}
                className="w-full px-3 py-1.5 text-left text-[11px] font-semibold text-primary hover:bg-secondary"
              >
                Spiele-Sektion öffnen →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
