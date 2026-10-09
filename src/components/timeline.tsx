"use client";

import type { TlItem, TlLabels } from "@/lib/timeline";
import { SPORT_SLUG } from "@/lib/sport-meta";
import { useSportFilter } from "./sport-filter";

/** Gemeinsame, chronologische Zeitleiste (Start-Teaser und /sport). */
export function TimelineList({
  items,
  t,
  limit,
  empty,
}: {
  items: TlItem[];
  t: TlLabels;
  limit?: number;
  empty: string;
}) {
  const [sport] = useSportFilter();
  const shown = items.filter((i) => !sport || i.sport === sport).slice(0, limit ?? items.length);
  if (shown.length === 0) return <p className="muted">{empty}</p>;

  const days: Array<{ ymd: string; label: string; items: TlItem[] }> = [];
  for (const i of shown) {
    const last = days[days.length - 1];
    if (last && last.ymd === i.ymd) last.items.push(i);
    else days.push({ ymd: i.ymd, label: i.dayLabel, items: [i] });
  }
  const badge = (o: "W" | "L" | "D") => (o === "W" ? t.winShort : o === "L" ? t.lossShort : t.drawShort);
  const cls = (o: "W" | "L" | "D") => (o === "W" ? "S" : o === "L" ? "N" : "U");
  const lbl = (o: "W" | "L" | "D") => (o === "W" ? t.win : o === "L" ? t.loss : t.draw);

  return (
    <div className="tl">
      {days.map((d) => (
        <div key={d.ymd} className="tl-day">
          <h3 className="tl-dayh">{d.label}</h3>
          <ul className="sis">
            {d.items.map((i) => (
              <li key={i.key} className="si" data-sport={SPORT_SLUG[i.sport]}>
                <span className="si-time">
                  {i.live ? (
                    <span className="pill pill-live">{t.live}</span>
                  ) : i.iso ? (
                    <time dateTime={i.iso}>{i.timeLabel}</time>
                  ) : (
                    <span className="si-open">{i.timeLabel}</span>
                  )}
                </span>
                <span className="si-emoji" aria-hidden="true">
                  {i.emoji}
                </span>
                <div className="si-body">
                  <p className="si-title">
                    {i.who ? <strong>{i.who}</strong> : null}
                    {i.who ? <span className="si-vs"> · {i.title}</span> : <span>{i.title}</span>}
                  </p>
                  {i.meta ? <p className="si-meta">{i.meta}</p> : null}
                  {i.result && (
                    <p className="si-result">
                      {i.outcome && (
                        <span className={`badge badge-${cls(i.outcome)}`} aria-label={lbl(i.outcome)} title={lbl(i.outcome)}>
                          {badge(i.outcome)}
                        </span>
                      )}
                      <span>{i.result}</span>
                    </p>
                  )}
                  {i.detail && <p className="si-detail">{i.detail}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
