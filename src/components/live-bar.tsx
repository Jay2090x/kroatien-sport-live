"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { LiveBarDto } from "@/app/api/live-bar/route";
import { BadgeView } from "@/components/badge-view";
import { liveBarLabels } from "@/lib/live-bar-i18n";
import type { Lang } from "@/lib/i18n";

const SHOW_DESKTOP = 3;
const SHOW_MOBILE = 2;
/** Spieler-Infos je Spiel, die ohne Aufklappen sichtbar sind */
const INFOS_VISIBLE = 2;
/** Älter als das → Daten gelten als veraltet, Leiste verschwindet (lieber nichts als falsch). */
const MAX_AGE_MS = 6 * 60_000;
/** Älter als das → deutlich als "verzögert" markieren, Minute wird nicht mehr weitergezählt. */
const STALE_MS = 2 * 60_000;
/** Minute höchstens so weit über den letzten Serverwert hinaus weiterzählen */
const MAX_EXTRAPOLATE_MIN = 3;

/**
 * Fußballminute zwischen zwei Abfragen weiterzählen (nur wenn die Uhr laut Server läuft).
 * "67'" + 2 min → "69'", "44'" + 3 → "45+2'", "45+1'" + 1 → "45+2'". NBA wird nie verändert.
 */
export function advanceMinute(minute: string, elapsedMs: number): string {
  const m = minute.match(/^(\d+)(?:\+(\d+))?'$/);
  if (!m) return minute;
  const add = Math.min(MAX_EXTRAPOLATE_MIN, Math.max(0, Math.floor(elapsedMs / 60_000)));
  if (!add) return minute;
  const base = Number(m[1]);
  if (m[2] != null) return `${base}+${Number(m[2]) + add}'`;
  const t = base + add;
  for (const end of [45, 90, 105, 120]) {
    if (base <= end && t > end) return `${end}+${t - end}'`;
  }
  return `${t}'`;
}

const hhmm = (ms: number, lang: Lang) =>
  new Date(ms).toLocaleTimeString(lang === "hr" ? "hr-HR" : "de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zagreb" });

/**
 * LIVE-Leiste ganz oben auf jeder Seite.
 * Wird nur im Browser geladen (die Seiten selbst bleiben statisch/ISR-gecacht) und fragt
 * /api/live-bar ab: alle 20 s solange etwas läuft, sonst alle 3 min; im Hintergrund-Tab pausiert,
 * bei Rückkehr (visibilitychange, focus, pageshow inkl. iOS-bfcache, online) sofort neu.
 * Eine Sekunden-Uhr zeigt "aktualisiert vor X s" und zählt die Fußballminute weiter.
 * Läuft nichts, bleibt nur eine dünne Zeile "Nächstes Spiel" (oder gar nichts).
 */
export function LiveBar({ lang }: { lang: Lang }) {
  const L = liveBarLabels(lang);
  const [data, setData] = useState<LiveBarDto | null>(null);
  const [all, setAll] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  /** Zeitpunkt (Browser-Uhr), zu dem die Daten an der Quelle abgerufen wurden */
  const [dataAt, setDataAt] = useState(0);
  const lastFetch = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stop = false;
    let busy = false;
    let ctl: AbortController | undefined;
    let wait = 180;
    const schedule = (sec: number) => {
      clearTimeout(timer);
      if (!stop) timer = setTimeout(run, sec * 1000);
    };
    const run = async () => {
      if (stop || busy) return;
      if (document.hidden) return schedule(wait); // Hintergrund: nichts abrufen
      busy = true;
      ctl = new AbortController();
      try {
        // no-store: Browser-Cache umgehen; der Zeit-Bucket teilt sich den CDN-Eintrag mit anderen Lesern
        const r = await fetch(`/api/live-bar?lang=${lang}&b=${Math.floor(Date.now() / 15_000)}`, {
          signal: ctl.signal,
          cache: "no-store",
        });
        if (r.ok) {
          const j = (await r.json()) as LiveBarDto;
          const recv = Date.now();
          // Alter = (Erzeugung − Quellabruf) + Alter im CDN; unabhängig von falsch gehenden Browser-Uhren
          const gen = Date.parse(j.serverTime ?? j.fetchedAt);
          const cdnAge = Number(r.headers.get("age") ?? 0) || 0;
          const ageMs = Math.max(0, gen - Date.parse(j.fetchedAt)) + cdnAge * 1000;
          lastFetch.current = recv;
          if (!stop) {
            setData(j);
            setDataAt(recv - ageMs);
            setNow(recv);
          }
          wait = j.pollSec || 180;
        }
      } catch {
        /* nächster Versuch */
      } finally {
        busy = false;
      }
      schedule(wait);
    };
    const wake = () => {
      if (document.hidden) return;
      // zurück im Tab/App: sofort neu laden (außer gerade eben schon geschehen)
      if (Date.now() - lastFetch.current > 5_000) void run();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) void run(); // iOS Safari bfcache: Timer waren eingefroren
      else wake();
    };
    void run();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    window.addEventListener("pageshow", onShow);
    return () => {
      stop = true;
      ctl?.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("pageshow", onShow);
    };
  }, [lang]);

  if (!data) return null;
  const age = Math.max(0, now - dataAt);
  if (age > MAX_AGE_MS) return null;
  const stale = age > STALE_MS;

  if (!data.items.length) {
    const n = data.next;
    if (!n) return null;
    return (
      <div className="lb lb-idle">
        <div className="container lb-in">
          <Link href={n.href} className="lb-next">
            <span className="lb-next-h">{L.next}:</span> {n.home} – {n.away}
            <span className="lb-next-t">
              {" "}
              · {n.text} {L.oclock}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const show = mobile ? SHOW_MOBILE : SHOW_DESKTOP;
  const shown = all ? data.items : data.items.slice(0, show);
  const rest = data.items.length - show;
  const hiddenInfos = shown.reduce((n, i) => n + Math.max(0, i.infos.length - INFOS_VISIBLE), 0);
  const toggle = rest > 0 ? L.more(rest) : hiddenInfos > 0 ? L.moreInfo(hiddenInfos) : null;
  return (
    <div className={`lb lb-live${stale ? " lb-stale" : ""}`} role="region" aria-label={L.region}>
      <div className="container lb-in">
        <div className="lb-side">
          <span className="lb-tag">
            <span className="live-dot" aria-hidden="true" />
            {L.live}
          </span>
          <span className={`lb-age${stale ? " lb-age-stale" : ""}`} aria-live="off">
            {stale ? L.delayed(hhmm(dataAt, lang)) : L.updated(Math.round(age / 1000))}
          </span>
          {toggle && (
            <button type="button" className="lb-more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
              {all ? L.less : toggle}
            </button>
          )}
        </div>
        <ul className="lb-list">
          {shown.map((i) => (
            <li key={i.id}>
              <Link href={i.href} className="lb-item">
                <span className="lb-comp">{i.competition}</span>
                <span className="lb-match">
                  <span className="lb-t lb-t-h">
                    <span className="lb-n">{i.home}</span>
                    <BadgeView b={i.homeBadge} size={20} />
                  </span>
                  <span className="lb-score" aria-label={`${i.homeScore}:${i.awayScore}`}>
                    {i.homeScore}:{i.awayScore}
                  </span>
                  <span className="lb-t lb-t-a">
                    <BadgeView b={i.awayBadge} size={20} />
                    <span className="lb-n">{i.away}</span>
                  </span>
                </span>
                <span className="lb-min">{i.halftime
                    ? L.halftime
                    : i.minute && i.clockRunning && !stale
                      ? advanceMinute(i.minute, age)
                      : i.minute ?? ""}</span>
                {i.infos.length > 0 ? (
                  <span className="lb-pl lb-infos">
                    {(all ? i.infos : i.infos.slice(0, INFOS_VISIBLE)).map((x) => (
                      <span key={x.text} className={`lb-info lb-info-${x.tone}`}>
                        {x.text}
                      </span>
                    ))}
                  </span>
                ) : (
                  i.players.length > 0 && (
                    <span className="lb-pl">
                      {L.croats}: {i.players.join(", ")}
                    </span>
                  )
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
