import type { FormPoint, GameRef, NextLineup, PlayerGame, PlayerNext, PlayerRow } from "@/lib/sources/players";
import { x2 } from "@/lib/fan/i18n2";
import type { Performance } from "@/lib/sources/espn-summary";
import { formatKickoff, formatShortDate } from "@/lib/time";
import { dataLabel, dict, type Dict, type Lang } from "@/lib/i18n";
import { Avatar } from "@/components/avatar";
import { photoKey } from "@/lib/photos";
import { Club } from "@/components/club-badge";
import { ClipItem } from "@/components/fan/player-clips";
import type { PlayerClip } from "@/lib/sources/player-clips";

function Score({ g }: { g: GameRef }) {
  if (g.homeScore == null || g.awayScore == null) return <span className="pg-vs">–</span>;
  return (
    <span className="pg-score">
      {g.homeScore}:{g.awayScore}
    </span>
  );
}

export function Teams({ g, isHome, lang }: { g: GameRef; isHome: boolean; lang: Lang }) {
  return (
    <span className="pg-teams">
      <span className={isHome ? "own" : undefined}>
        <Club name={g.home} size={20}>{dataLabel(g.home, lang)}</Club>
      </span>{" "}
      <Score g={g} />{" "}
      <span className={!isHome ? "own" : undefined}>
        <Club name={g.away} size={20}>{dataLabel(g.away, lang)}</Club>
      </span>
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

export function PerfLine({ p, t }: { p: Performance; t: Dict }) {
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
      {p.ownGoals > 0 && (
        <span className="ev ev-og" title={T.ownGoal}>
          {T.ownGoal}
          {p.ownGoalMinutes.length ? ` ${p.ownGoalMinutes.join(", ")}` : ""}
        </span>
      )}
      {p.penMissMinutes.length > 0 && (
        <span className="ev ev-penmiss" title={t.langLabel === "Jezik" ? "Promašen jedanaesterac" : "Elfmeter verschossen"}>
          ✖ {t.langLabel === "Jezik" ? "promašen jedanaesterac" : "Elfmeter verschossen"} {p.penMissMinutes.join(", ")}
        </span>
      )}
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
        {pg.perf ? <PerfLine p={pg.perf} t={t} /> : <span className="perf perf-na">{pg.perfNote ? dataLabel(pg.perfNote, lang) : t.players.noPlayerData}</span>}
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

export function PlayerCard({ p, lang = "de", clips = [] }: { p: PlayerRow; lang?: Lang; clips?: PlayerClip[] }) {
  const t = dict(lang);
  return (
    <article className="player" aria-labelledby={`pl-${p.id}`}>
      <header className="player-head">
        <span className="with-av">
          <Avatar pkey={photoKey.soccer(p.id)} name={p.name} size={44} lang={lang} />
          <h3 id={`pl-${p.id}`}>{p.name}</h3>
        </span>
        <span className="player-club">{p.club ? <Club name={p.club} size={20}>{dataLabel(p.club, lang)}</Club> : t.players.clubUnknown}</span>
      </header>
      <FormCurve form={p.form} lang={lang} />
      {clips.length > 0 && (
        <>
          <p className="label">🎯 {x2(lang).clips.title}</p>
          <ul className="clips pclips pclips-card">
            {clips.map((c) => (
              <ClipItem key={c.id} c={c} lang={lang} showPlayer={false} />
            ))}
          </ul>
        </>
      )}
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
          {dataLabel(n.text, lang)}
        </p>
      ))}
    </article>
  );
}

/** Formkurve: Balken = Minuten (0–90), Punkte = Tore/Vorlagen. Reines SVG, kein JS. */
export function FormCurve({ form, lang }: { form: FormPoint[]; lang: Lang }) {
  const X = x2(lang).form;
  if (!form.length) return null;
  const W = 34;
  const H = 46;
  const known = form.filter((f) => f.minutes != null);
  const mins = known.reduce((a, f) => a + (f.minutes ?? 0), 0);
  const g = known.reduce((a, f) => a + (f.goals ?? 0), 0);
  const as = known.reduce((a, f) => a + (f.assists ?? 0), 0);
  return (
    <div className="form">
      <p className="label">
        {X.title} <span className="muted small">· {X.summary(known.length, form.length, mins, g, as)}</span>
      </p>
      <svg
        className="form-svg"
        viewBox={`0 0 ${form.length * W} ${H + 14}`}
        width={form.length * W}
        height={H + 14}
        role="img"
        aria-label={`${X.title}: ${form.map((f) => X.point(f, formatShortDate(f.kickoff, lang))).join("; ")}`}
      >
        {form.map((f, i) => {
          const x = i * W + 6;
          const h = f.minutes == null ? 0 : Math.max(2, Math.round((Math.min(f.minutes, 90) / 90) * H));
          return (
            <g key={i}>
              <title>{X.point(f, formatShortDate(f.kickoff, lang))}</title>
              {f.minutes == null ? (
                <rect x={x} y={H - 10} width={W - 12} height={10} className="form-na" rx={2} />
              ) : (
                <rect x={x} y={H - h} width={W - 12} height={h} className={f.isNationalTeam ? "form-nt" : "form-club"} rx={2} />
              )}
              {f.minutes == null && (
                <text x={x + (W - 12) / 2} y={H - 2} className="form-q" textAnchor="middle">?</text>
              )}
              {(f.ownGoalMinutes.length > 0 || f.penMissMinutes.length > 0) && (
                <text x={x + W - 10} y={10} className="form-x" textAnchor="middle">✖</text>
              )}
              {Array.from({ length: f.goals ?? 0 }).map((_, k) => (
                <circle key={`g${k}`} cx={x + (W - 12) / 2} cy={H - h - 5 - k * 7} r={3} className="form-goal" />
              ))}
              {Array.from({ length: f.assists ?? 0 }).map((_, k) => (
                <circle key={`a${k}`} cx={x + (W - 12) / 2} cy={H - h - 5 - ((f.goals ?? 0) + k) * 7} r={3} className="form-assist" />
              ))}
              <text x={x + (W - 12) / 2} y={H + 11} className="form-d" textAnchor="middle">
                {formatShortDate(f.kickoff, lang).slice(0, 5)}
              </text>
            </g>
          );
        })}
      </svg>
      {form.some((f) => f.ownGoalMinutes.length || f.penMissMinutes.length || f.redMinute) && (
        <ul className="form-special small">
          {form.flatMap((f) => {
            const d = `${formatShortDate(f.kickoff, lang)} ${f.label}`;
            return [
              ...f.ownGoalMinutes.map((m) => <li key={`og${f.kickoff}${m}`} className="ev-og">⚽ {X.ownGoal} {m} · {d}</li>),
              ...f.penMissMinutes.map((m) => <li key={`pm${f.kickoff}${m}`} className="ev-penmiss">✖ {X.penMiss} {m} · {d}</li>),
              ...(f.redMinute ? [<li key={`r${f.kickoff}`}><span className="cardicon cardicon-r" aria-hidden="true" /> {X.red} {f.redMinute !== "?" ? f.redMinute : ""} · {d}</li>] : []),
            ];
          })}
        </ul>
      )}
    </div>
  );
}
