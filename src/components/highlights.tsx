"use client";

import { useState } from "react";
import type { Video } from "@/lib/sources/videos";
import { SPORT_EMOJI, SPORT_SLUG } from "@/lib/sport-meta";
import { useSportFilter } from "./sport-filter";

/**
 * Zwei-Klick-Einbettung: vorher kein Kontakt zu YouTube (kein Vorschaubild),
 * nach Klick youtube-nocookie.com.
 */
function Clip({ v, load, when, channelLabel }: { v: Video; load: string; when: string; channelLabel: string }) {
  const [on, setOn] = useState(false);
  return (
    <li className="clip" data-sport={SPORT_SLUG[v.sport]}>
      {on ? (
        <div className="clip-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : (
        <button type="button" className="clip-cover" onClick={() => setOn(true)} aria-label={`${load}: ${v.title}`}>
          <span className="clip-play" aria-hidden="true">▶</span>
          <span className="clip-load">{load}</span>
        </button>
      )}
      <p className="clip-title">
        <span aria-hidden="true">{SPORT_EMOJI[v.sport]} </span>
        <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">
          {v.title}
        </a>
      </p>
      <p className="clip-meta">
        {channelLabel} {v.channel} · <time dateTime={v.publishedAt}>{when}</time>
      </p>
    </li>
  );
}

export function Highlights({
  videos,
  labels,
}: {
  videos: Array<Video & { when: string }>;
  labels: { title: string; load: string; note: string; channel: string };
}) {
  const [sport] = useSportFilter();
  const shown = videos.filter((v) => !sport || v.sport === sport);
  if (shown.length === 0) return null; // lieber weglassen als auffüllen
  return (
    <section id="highlights" className="card span-2" aria-labelledby="hl-v">
      <div className="card-head">
        <h2 id="hl-v">🎬 {labels.title}</h2>
      </div>
      <ul className="clips">
        {shown.map((v) => (
          <Clip key={v.id} v={v} load={labels.load} when={v.when} channelLabel={labels.channel} />
        ))}
      </ul>
      <p className="footnote">{labels.note}</p>
    </section>
  );
}
