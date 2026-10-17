"use client";

import { useEffect, useState } from "react";
import type { Ticker, TickerEvent, TickerSide } from "@/lib/sources/live";
import type { FanDict } from "@/lib/fan/i18n";

const POLL_MS = 120_000;
const TZ = "Europe/Vienna";

function hhmm(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function Icon({ k }: { k: TickerEvent["kind"] }) {
  if (k === "yellow") return <span className="cardicon cardicon-y" aria-hidden="true" />;
  if (k === "red") return <span className="cardicon cardicon-r" aria-hidden="true" />;
  const map: Record<string, string> = { goal: "⚽", penalty: "⚽", owngoal: "⚽", sub: "🔁", "pen-miss": "✖", half: "⏸", end: "🏁" };
  return <span aria-hidden="true">{map[k] ?? "•"}</span>;
}

function EventLine({ e, L, teamName }: { e: TickerEvent; L: FanDict["live"]; teamName: (id: string | null) => string | null }) {
  const team = teamName(e.teamId);
  let who: string = e.names[0] ?? "";
  if ((e.kind === "goal" || e.kind === "penalty") && e.names[1]) who = `${e.names[0]} (${L.assist}: ${e.names[1]})`;
  if (e.kind === "sub") who = e.names.length > 1 ? `${e.names[0]} ${L.subFor} ${e.names[1]}` : who;
  const big = e.kind === "goal" || e.kind === "penalty" || e.kind === "owngoal";
  return (
    <li className={`tk-ev tk-${e.kind}${big ? " tk-big" : ""}`}>
      <span className="tk-min">{e.minute}</span>
      <span className="tk-ic">
        <Icon k={e.kind} />
      </span>
      <span className="tk-txt">
        <strong>{L.kind[e.kind]}</strong>
        {who ? ` · ${who}` : ""}
        {team && e.kind !== "half" && e.kind !== "end" ? <span className="muted"> · {team}</span> : null}
      </span>
    </li>
  );
}

function Lineup({ s, name, L }: { s: TickerSide; name: string; L: FanDict["live"] }) {
  const start = s.lineup.filter((p) => p.starter);
  const bench = s.lineup.filter((p) => !p.starter);
  return (
    <div className="tk-lu">
      <h4>
        {name}
        {s.formation ? <span className="muted"> · {s.formation}</span> : null}
      </h4>
      <p className="label">{L.starters}</p>
      <ol className="tk-players">
        {start.map((p) => (
          <li key={p.id}>
            <span className="tk-no">{p.jersey ?? ""}</span> {p.name}
          </li>
        ))}
      </ol>
      {bench.length > 0 && (
        <>
          <p className="label">{L.bench}</p>
          <p className="small muted">{bench.map((p) => p.name).join(", ")}</p>
        </>
      )}
    </div>
  );
}

export function LiveTicker({
  initial,
  labels: L,
  locale,
  names,
  poll,
  oclock,
}: {
  initial: Ticker;
  labels: FanDict["live"];
  locale: string;
  /** übersetzte Teamnamen (Heim, Gast) */
  names: { home: string; away: string };
  /** true = im Live-Fenster, alle 2 min neu laden */
  poll: boolean;
  oclock: string;
}) {
  const [tk, setTk] = useState<Ticker>(initial);
  const active = poll && tk.state !== "post";

  useEffect(() => {
    if (!active) return;
    const run = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch(`/api/live?event=${encodeURIComponent(tk.eventId)}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { ticker: Ticker | null };
        if (j.ticker && j.ticker.eventId === tk.eventId) setTk(j.ticker);
      } catch {
        /* nächster Versuch in 2 min */
      }
    };
    const id = setInterval(run, POLL_MS);
    const onVis = () => {
      if (!document.hidden) run();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active, tk.eventId]);

  const teamName = (id: string | null) => (id === tk.home.id ? names.home : id === tk.away.id ? names.away : null);
  const status =
    tk.state === "pre"
      ? `${L.pre} · ${hhmm(tk.kickoff, locale)} ${oclock}`
      : tk.state === "in"
        ? tk.clock === "HT"
          ? L.halftime
          : tk.clock ?? ""
        : L.final;
  const events = tk.state === "in" ? [...tk.events].reverse() : tk.events;
  const hasLineup = tk.home.lineup.length > 0 || tk.away.lineup.length > 0;

  return (
    <div className="ticker" aria-live="polite">
      <div className={`tk-board${tk.state === "in" ? " tk-live" : ""}`}>
        <span className="tk-team">{names.home}</span>
        <span className="tk-score">
          {tk.home.score ?? "–"}:{tk.away.score ?? "–"}
        </span>
        <span className="tk-team">{names.away}</span>
        <span className="tk-status">
          {tk.state === "in" && <span className="live-dot" aria-hidden="true" />} {status}
        </span>
      </div>

      <h3>{L.events}</h3>
      {events.length ? (
        <ul className="tk-events">
          {events.map((e, i) => (
            <EventLine key={`${e.kind}-${e.minute}-${i}`} e={e} L={L} teamName={teamName} />
          ))}
        </ul>
      ) : (
        <p className="muted small">{L.noEvents}</p>
      )}

      <h3>{L.lineups}</h3>
      {hasLineup ? (
        <div className="tk-lineups">
          <Lineup s={tk.home} name={names.home} L={L} />
          <Lineup s={tk.away} name={names.away} L={L} />
        </div>
      ) : (
        <p className="muted small">{L.lineupPending}</p>
      )}

      <p className="stand">
        {active ? `${L.auto} · ` : tk.state === "post" && poll ? `${L.paused} · ` : ""}
        {L.updated}: {hhmm(tk.fetchedAt, locale)} {oclock} · {L.source}
      </p>
    </div>
  );
}
