"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LiveBarDto } from "@/app/api/live-bar/route";
import { BadgeView } from "@/components/badge-view";
import { liveBarLabels } from "@/lib/live-bar-i18n";
import type { Lang } from "@/lib/i18n";

const SHOW_DESKTOP = 3;
const SHOW_MOBILE = 2;
/** Älter als das → Daten gelten als veraltet, Leiste verschwindet (lieber nichts als falsch). */
const MAX_AGE_MS = 6 * 60_000;

/**
 * LIVE-Leiste ganz oben auf jeder Seite.
 * Wird nur im Browser geladen (die Seiten selbst bleiben statisch/ISR-gecacht) und fragt
 * /api/live-bar ab: alle 60 s solange etwas läuft, sonst alle 3 min; im Hintergrund-Tab pausiert.
 * Läuft nichts, bleibt nur eine dünne Zeile "Nächstes Spiel" (oder gar nichts).
 */
export function LiveBar({ lang }: { lang: Lang }) {
  const L = liveBarLabels(lang);
  const [data, setData] = useState<LiveBarDto | null>(null);
  const [all, setAll] = useState(false);
  const [mobile, setMobile] = useState(false);

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
    let ctl: AbortController | undefined;
    const run = async () => {
      if (stop) return;
      let wait = 180;
      if (!document.hidden) {
        ctl = new AbortController();
        try {
          const r = await fetch(`/api/live-bar?lang=${lang}`, { signal: ctl.signal });
          if (r.ok) {
            const j = (await r.json()) as LiveBarDto;
            if (!stop) setData(j);
            wait = j.pollSec || 180;
          }
        } catch {
          /* nächster Versuch */
        }
      }
      if (!stop) timer = setTimeout(run, wait * 1000);
    };
    const onVis = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void run();
      }
    };
    void run();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop = true;
      ctl?.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [lang]);

  if (!data) return null;
  if (Date.now() - Date.parse(data.fetchedAt) > MAX_AGE_MS) return null;

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
  return (
    <div className="lb lb-live" role="region" aria-label={L.region}>
      <div className="container lb-in">
        <div className="lb-side">
          <span className="lb-tag">
            <span className="live-dot" aria-hidden="true" />
            {L.live}
          </span>
          {rest > 0 && (
            <button type="button" className="lb-more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
              {all ? L.less : L.more(rest)}
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
                <span className="lb-min">{i.halftime ? L.halftime : i.minute ?? ""}</span>
                {i.players.length > 0 && (
                  <span className="lb-pl">
                    {L.croats}: {i.players.join(", ")}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
