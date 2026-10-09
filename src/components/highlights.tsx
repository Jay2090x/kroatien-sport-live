"use client";

import { useState } from "react";
import type { Video } from "@/lib/sources/videos";
import { SPORT_EMOJI, SPORT_SLUG } from "@/lib/sport-meta";
import { useSportFilter } from "./sport-filter";

/**
 * Zwei-Klick-Einbettung: vorher kein Kontakt zu YouTube (kein Vorschaubild),
 * nach Klick youtube-nocookie.com.
 */
export function ClipPlayer({ id, title, load }: { id: string; title: string; load: string }) {
  const [on, setOn] = useState(false);
  return on ? (
    <div className="clip-frame">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    </div>
  ) : (
    <button type="button" className="clip-cover" onClick={() => setOn(true)} aria-label={`${load}: ${title}`}>
      <span className="clip-play" aria-hidden="true">▶</span>
      <span className="clip-load">{load}</span>
    </button>
  );
}

function Clip({ v, load, when, channelLabel }: { v: Video; load: string; when: string; channelLabel: string }) {
  return (
    <li className="clip" data-sport={SPORT_SLUG[v.sport]}>
      <ClipPlayer id={v.id} title={v.title} load={load} />
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
  id = "highlights",
}: {
  videos: Array<Video & { when: string }>;
  labels: { title: string; load: string; note: string; channel: string };
  /** Abschnitts-ID (Standard "highlights") */
  id?: string;
}) {
  const [sport] = useSportFilter();
  const shown = videos.filter((v) => !sport || v.sport === sport);
  if (shown.length === 0) return null; // lieber weglassen als auffüllen
  return (
    <section id={id} className="card span-2" aria-labelledby={`${id}-h`}>
      <div className="card-head">
        <h2 id={`${id}-h`}>🎬 {labels.title}</h2>
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
