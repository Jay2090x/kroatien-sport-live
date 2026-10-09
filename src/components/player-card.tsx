import type { GameRef, NextLineup, PlayerGame, PlayerNext, PlayerRow } from "@/lib/sources/players";
import type { Performance } from "@/lib/sources/espn-summary";
import { formatKickoff, formatShortDate } from "@/lib/time";
import { dataLabel, dict, type Dict, type Lang } from "@/lib/i18n";

function Score({ g }: { g: GameRef }) {
  if (g.homeScore == null || g.awayScore == null) return <span className="pg-vs">–</span>;
  return (
    <span className="pg-score">
      {g.homeScore}:{g.awayScore}
    </span>
  );
}

function Teams({ g, isHome, lang }: { g: GameRef; isHome: boolean; lang: Lang }) {
  return (
    <span className="pg-teams">
      <span className={isHome ? "own" : undefined}>{dataLabel(g.home, lang)}</span> <Score g={g} />{" "}
      <span className={!isHome ? "own" : undefined}>{dataLabel(g.away, lang)}</span>
      {g.extra ? <span className="pg-extra"> {g.extra}</span> : null}
    </span>
  );
}

function Card({ color, minute, t }: { color: "y" | "r"; minute: string; t: Dict }) {
  const label = color === "y" ? t.players.yellowCard : t.players.redCard;
  return (
    <span className="ev" title={`${label} ${minute}`}>
      <span className={`cardicon cardicon-${color}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {minute !== "?" ? minute : ""}
    </span>
  );
}

function PerfLine({ p, t }: { p: Performance; t: Dict }) {
  const T = t.players;
  if (!p.inSquad) return <span className="perf perf-out">{T.notInSquad}</span>;
  if (!p.played) return <span className="perf perf-bench">{T.benchUnused}</span>;
  const parts: string[] = [];
  if (p.starter) parts.push(T.starter);
  if (p.subIn) parts.push(`${T.subIn} ${p.subIn === "?" ? "" : p.subIn}`.trim());
  if (p.subOut) parts.push(`${T.subOut} ${p.subOut === "?" ? "" : p.subOut}`.trim());
  if (p.minutes != null) parts.push(`${p.minutes} ${T.min}`);
  return (
    <span className="perf">
      <span>{parts.join(" · ")}</span>
      {p.goals > 0 && (
        <span className="ev" title={`${p.goals} ${T.goals}`}>
          <span aria-hidden="true">⚽</span>
          <span className="sr-only">{T.goal}</span>
          {p.goals > 1 ? `×${p.goals} ` : ""}
          {p.goalMinutes.join(", ")}
        </span>
      )}
      {p.assists != null && p.assists > 0 && (
        <span className="ev ev-assist" title={`${p.assists} ${T.assists}`}>
          {p.assists > 1 ? `${p.assists} ${T.assists}` : T.assist}
        </span>
      )}
      {p.ownGoals > 0 && <span className="ev">{T.ownGoal}</span>}
      {p.yellow.map((m, i) => (
        <Card key={`y${i}`} color="y" minute={m} t={t} />
      ))}
      {p.red && <Card color="r" minute={p.red} t={t} />}
    </span>
  );
}

function GameLine({ pg, lang, t }: { pg: PlayerGame; lang: Lang; t: Dict }) {
  const g = pg.game;
  return (
    <li className="pg">
      <div className="pg-head">
        <span className="pg-date">{formatShortDate(g.kickoff, lang)}</span>
        <Teams g={g} isHome={pg.isHome} lang={lang} />
      </div>
      <div className="pg-sub">
        <span className="pg-comp">{dataLabel(g.competition, lang)}</span>
        {pg.perf ? <PerfLine p={pg.perf} t={t} /> : <span className="perf perf-na">{pg.perfNote ?? t.players.noPlayerData}</span>}
      </div>
    </li>
  );
}

const LINEUP_CLS: Record<NextLineup, string> = {
  pending: "lu-pending",
  unknown: "lu-pending",
  start: "lu-start",
  bench: "lu-bench",
  out: "lu-out",
  nodata: "lu-pending",
};

function NextLine({ n, lang, t }: { n: PlayerNext; lang: Lang; t: Dict }) {
  const g = n.game;
  const live = g.state === "in";
  const lu = n.callUpOpen && n.lineup === "pending"
    ? { text: t.players.lineup.callUpOpen, cls: "lu-pending" }
    : { text: t.players.lineup[n.lineup], cls: LINEUP_CLS[n.lineup] };
  return (
    <div className="next">
      <p className="next-when">
        {live ? <span className="pill pill-live">{t.live}</span> : null}
        <time dateTime={g.kickoff}>{formatKickoff(g.kickoff, lang)} {t.oclock}</time>
        <span className="pg-comp"> · {dataLabel(g.competition, lang)}</span>
      </p>
      <p className="next-teams">
        <Teams g={g} isHome={n.isHome} lang={lang} />
      </p>
      <p className={`lu ${lu.cls}`}>{lu.text}</p>
      {n.suspensionHint && <p className="lu lu-out">⚠ {n.suspensionHint}</p>}
    </div>
  );
}

export function PlayerCard({ p, lang = "de" }: { p: PlayerRow; lang?: Lang }) {
  const t = dict(lang);
  return (
    <article className="player" aria-labelledby={`pl-${p.id}`}>
      <header className="player-head">
        <h3 id={`pl-${p.id}`}>{p.name}</h3>
        <span className="player-club">{p.club ?? t.players.clubUnknown}</span>
      </header>
      <p className="label">{t.players.next}</p>
      {p.next ? <NextLine n={p.next} lang={lang} t={t} /> : <p className="muted small">{t.players.noNext}</p>}
      <p className="label">{t.players.last}</p>
      {p.games.length ? (
        <ul className="pgs">
          {p.games.map((pg) => (
            <GameLine key={`${pg.game.source}-${pg.game.id}`} pg={pg} lang={lang} t={t} />
          ))}
        </ul>
      ) : (
        <p className="muted small">{t.players.noLast}</p>
      )}
      {p.notes.map((n, i) => (
        <p key={i} className={`pnote pnote-${n.kind}`}>
          {n.kind === "warn" ? "⚠ " : ""}
          {n.text}
        </p>
      ))}
    </article>
  );
}
