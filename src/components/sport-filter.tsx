"use client";

import { useCallback, useSyncExternalStore } from "react";
import { SPORT_EMOJI, SPORT_SLUG, SPORTS, sportFromSlug, type Sport } from "@/lib/sport-meta";
import type { Dict } from "@/lib/i18n";

/**
 * Sportfilter für die ganze Seite. Zustand steckt in der URL (?sport=mma), damit
 * Links teilbar sind. Ein kleines Inline-Skript im <head> setzt <html data-sf="…">
 * schon vor dem ersten Zeichnen; CSS blendet damit Nicht-Passendes sofort aus
 * (kein Aufblitzen). Nach dem Laden filtern die Komponenten zusätzlich selbst.
 */
const EVENT = "ksl:sport";

function read(): Sport | null {
  if (typeof window === "undefined") return null;
  return sportFromSlug(new URLSearchParams(window.location.search).get("sport"));
}

function subscribe(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useSportFilter(): [Sport | null, (s: Sport | null) => void] {
  const sport = useSyncExternalStore(subscribe, read, () => null);
  const set = useCallback((s: Sport | null) => {
    const url = new URL(window.location.href);
    if (s) url.searchParams.set("sport", SPORT_SLUG[s]);
    else url.searchParams.delete("sport");
    window.history.replaceState(window.history.state, "", url);
    if (s) document.documentElement.dataset.sf = SPORT_SLUG[s];
    else delete document.documentElement.dataset.sf;
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [sport, set];
}

export function SportFilterBar({ t, available = SPORTS }: { t: Pick<Dict, "filter">; available?: Sport[] }) {
  const [sport, setSport] = useSportFilter();
  const label: Record<Sport, string> = {
    football: t.filter.football,
    mma: t.filter.mma,
    boxing: t.filter.boxing,
    tennis: t.filter.tennis,
    basketball: t.filter.basketball,
    handball: t.filter.handball,
  };
  const chip = (s: Sport | null) => {
    const active = sport === s;
    return (
      <a
        key={s ?? "all"}
        href={s ? `?sport=${SPORT_SLUG[s]}` : "?"}
        className={`chip${active ? " chip-on" : ""}`}
        data-chip={s ? SPORT_SLUG[s] : "alle"}
        aria-pressed={active}
        role="button"
        onClick={(e) => {
          e.preventDefault();
          setSport(s);
        }}
      >
        {s ? <span aria-hidden="true">{SPORT_EMOJI[s]} </span> : null}
        {s ? label[s] : t.filter.all}
      </a>
    );
  };
  return (
    <nav className="chips" aria-label={t.filter.label}>
      {chip(null)}
      {available.map(chip)}
    </nav>
  );
}

/** Blendet Inhalte aus, die nicht zur gewählten Sportart passen. */
export function SportGate({ sport, children }: { sport: Sport; children: React.ReactNode }) {
  const [current] = useSportFilter();
  if (current && current !== sport) return null;
  return (
    <div className="gate" data-gate={SPORT_SLUG[sport]}>
      {children}
    </div>
  );
}

/** Blendet "Weitere Sportarten" aus, wenn Fußball gewählt ist. */
export function NotFootballGate({ children }: { children: React.ReactNode }) {
  const [current] = useSportFilter();
  if (current === "football") return null;
  return <div className="gate gate-other">{children}</div>;
}

/** Inline-Skript (vor dem Rendern): ?sport= → <html data-sf>. */
export const SPORT_FILTER_BOOT = `(function(){try{var s=new URLSearchParams(location.search).get("sport");var ok=${JSON.stringify(
  SPORTS.map((s) => SPORT_SLUG[s])
)};if(s&&ok.indexOf(s.toLowerCase())>=0)document.documentElement.dataset.sf=s.toLowerCase();}catch(e){}})();`;

/** CSS für das Ausblenden vor dem Hydrieren (pro Sportart eine Regel). */
export const SPORT_FILTER_CSS = SPORTS.map((s) => {
  const v = SPORT_SLUG[s];
  return `html[data-sf="${v}"] [data-sport]:not([data-sport="${v}"]),html[data-sf="${v}"] [data-gate]:not([data-gate="${v}"]){display:none!important}html[data-sf="${v}"] .chip[data-chip="${v}"]{background:var(--blue);color:#fff;border-color:var(--blue)}html[data-sf="${v}"] .chip[data-chip="alle"]:not(.chip-on){background:var(--card);color:var(--ink);border-color:var(--line)}`;
}).join("") + 'html[data-sf="fussball"] .gate-other{display:none!important}';
