import Link from "next/link";
import { ClipPlayer } from "@/components/highlights";
import { x2 } from "@/lib/fan/i18n2";
import { detectLang } from "@/lib/lang-detect";
import { formatShortDate } from "@/lib/time";
import { dataLabel, href, type Lang } from "@/lib/i18n";
import type { PlayerClip } from "@/lib/sources/player-clips";

/** Originaltitel nur, wenn er in der Seitensprache ist – sonst Spieler · Verein · Datum. */
function label(c: PlayerClip, lang: Lang): string | null {
  return detectLang(c.title) === lang ? c.title : null;
}

export function ClipItem({ c, lang, showPlayer = true }: { c: PlayerClip; lang: Lang; showPlayer?: boolean }) {
  const X = x2(lang).clips;
  const own = label(c, lang);
  const caption = [showPlayer ? c.player : null, c.club ? dataLabel(c.club, lang) : null, formatShortDate(c.publishedAt, lang)].filter(Boolean).join(" · ");
  return (
    <li className="clip pclip">
      <p className="clip-title">
        <strong>{caption}</strong>
        {own ? <> – {own}</> : null}
      </p>
      <p className="clip-meta">
        {X.channel} {c.channel} ·{" "}
        <a href={`https://www.youtube.com/watch?v=${c.id}`} target="_blank" rel="noopener noreferrer">
          {X.on}
        </a>
      </p>
      <ClipPlayer id={c.id} title={`${X.own}: ${c.player}`} load={X.load} />
    </li>
  );
}

/** Kompakter Abschnitt für die Startseite; ohne Clips wird nichts angezeigt. */
export function PlayerClipsSection({ clips, lang, max = 4 }: { clips: PlayerClip[]; lang: Lang; max?: number }) {
  if (!clips.length) return null;
  const X = x2(lang).clips;
  return (
    <section className="card span-2" id="spieler-clips" aria-labelledby="pclips-h">
      <div className="card-head">
        <h2 id="pclips-h">🎯 {X.title}</h2>
      </div>
      <ul className="clips pclips">
        {clips.slice(0, max).map((c) => (
          <ClipItem key={c.id} c={c} lang={lang} />
        ))}
      </ul>
      <p className="footnote">{X.note}</p>
      <p className="more-link">
        <Link href={href(lang, "/spieler")}>{X.more}</Link>
      </p>
    </section>
  );
}
