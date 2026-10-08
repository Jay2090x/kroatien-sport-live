import type { GameRef, NextLineup, PlayerGame, PlayerNext, PlayerRow } from "@/lib/sources/players";
import type { Performance } from "@/lib/sources/espn-summary";
import { formatKickoff, formatShortDate } from "@/lib/time";

function Score({ g }: { g: GameRef }) {
  if (g.homeScore == null || g.awayScore == null) return <span className="pg-vs">–</span>;
  return (
    <span className="pg-score">
      {g.homeScore}:{g.awayScore}
    </span>
  );
}

function Teams({ g, isHome }: { g: GameRef; isHome: boolean }) {
  return (
    <span className="pg-teams">
      <span className={isHome ? "own" : undefined}>{g.home}</span> <Score g={g} />{" "}
      <span className={!isHome ? "own" : undefined}>{g.away}</span>
      {g.extra ? <span className="pg-extra"> {g.extra}</span> : null}
    </span>
  );
}

function Card({ color, minute }: { color: "y" | "r"; minute: string }) {
  const label = color === "y" ? "Gelbe Karte" : "Rote Karte";
  return (
    <span className="ev" title={`${label} ${minute}`}>
      <span className={`cardicon cardicon-${color}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {minute !== "?" ? minute : ""}
    </span>
  );
}

function PerfLine({ p }: { p: Performance }) {
  if (!p.inSquad) return <span className="perf perf-out">Nicht im Spieltagskader</span>;
  if (!p.played) return <span className="perf perf-bench">Auf der Bank, nicht eingesetzt</span>;
  const parts: string[] = [];
  if (p.starter) parts.push("Startelf");
  if (p.subIn) parts.push(`eingewechselt ${p.subIn === "?" ? "" : p.subIn}`.trim());
  if (p.subOut) parts.push(`ausgewechselt ${p.subOut === "?" ? "" : p.subOut}`.trim());
  if (p.minutes != null) parts.push(`${p.minutes} Min.`);
  return (
    <span className="perf">
      <span>{parts.join(" · ")}</span>
      {p.goals > 0 && (
        <span className="ev" title={`${p.goals} Tor(e)`}>
          <span aria-hidden="true">⚽</span>
          <span className="sr-only">Tor</span>
          {p.goals > 1 ? `×${p.goals} ` : ""}
          {p.goalMinutes.join(", ")}
        </span>
      )}
      {p.assists != null && p.assists > 0 && (
        <span className="ev ev-assist" title={`${p.assists} Torvorlage(n)`}>
          {p.assists > 1 ? `${p.assists} Vorlagen` : "Vorlage"}
        </span>
      )}
      {p.ownGoals > 0 && <span className="ev">Eigentor</span>}
      {p.yellow.map((m, i) => (
        <Card key={`y${i}`} color="y" minute={m} />
      ))}
      {p.red && <Card color="r" minute={p.red} />}
    </span>
  );
}

function GameLine({ pg }: { pg: PlayerGame }) {
  const g = pg.game;
  return (
    <li className="pg">
      <div className="pg-head">
        <span className="pg-date">{formatShortDate(g.kickoff)}</span>
        <Teams g={g} isHome={pg.isHome} />
      </div>
      <div className="pg-sub">
        <span className="pg-comp">{g.competition}</span>
        {pg.perf ? <PerfLine p={pg.perf} /> : <span className="perf perf-na">{pg.perfNote ?? "keine Spielerdaten"}</span>}
      </div>
    </li>
  );
}

const LINEUP: Record<NextLineup, { text: string; cls: string }> = {
  pending: { text: "Aufstellung noch nicht bekannt (meist ca. 1 Std. vor Anpfiff)", cls: "lu-pending" },
  unknown: { text: "Aufstellung noch nicht veröffentlicht", cls: "lu-pending" },
  start: { text: "In der Startelf", cls: "lu-start" },
  bench: { text: "Auf der Bank", cls: "lu-bench" },
  out: { text: "Nicht im Spieltagskader", cls: "lu-out" },
  nodata: { text: "Aufstellung: keine Daten verfügbar (HNL)", cls: "lu-pending" },
};

function NextLine({ n }: { n: PlayerNext }) {
  const g = n.game;
  const live = g.state === "in";
  const lu = n.callUpOpen && n.lineup === "pending"
    ? { text: "Nominierung für dieses Länderspiel noch nicht bekannt", cls: "lu-pending" }
    : LINEUP[n.lineup];
  return (
    <div className="next">
      <p className="next-when">
        {live ? <span className="pill pill-live">läuft</span> : null}
        <time dateTime={g.kickoff}>{formatKickoff(g.kickoff)} Uhr</time>
        <span className="pg-comp"> · {g.competition}</span>
      </p>
      <p className="next-teams">
        <Teams g={g} isHome={n.isHome} />
      </p>
      <p className={`lu ${lu.cls}`}>{lu.text}</p>
      {n.suspensionHint && <p className="lu lu-out">⚠ {n.suspensionHint}</p>}
    </div>
  );
}

export function PlayerCard({ p }: { p: PlayerRow }) {
  return (
    <article className="player" aria-labelledby={`pl-${p.id}`}>
      <header className="player-head">
        <h3 id={`pl-${p.id}`}>{p.name}</h3>
        <span className="player-club">{p.club ?? "Verein unbekannt"}</span>
      </header>
      <p className="label">Nächstes Spiel</p>
      {p.next ? <NextLine n={p.next} /> : <p className="muted small">Kein Spiel angesetzt bzw. derzeit keine Daten.</p>}
      <p className="label">Letzte Spiele</p>
      {p.games.length ? (
        <ul className="pgs">
          {p.games.map((pg) => (
            <GameLine key={`${pg.game.source}-${pg.game.id}`} pg={pg} />
          ))}
        </ul>
      ) : (
        <p className="muted small">derzeit keine Daten</p>
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
