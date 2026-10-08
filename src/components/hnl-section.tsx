import type { Sourced } from "@/lib/cache";
import type { HnlData, HnlMatch } from "@/lib/sources/hnl";
import { formatDay, formatTime } from "@/lib/time";
import { NoData, Stand } from "./stand";

function Fixture({ m }: { m: HnlMatch }) {
  const scored = m.homeScore != null && m.awayScore != null;
  return (
    <li className="fixture">
      <span className="f-when">
        {m.state === "postponed" ? (
          "verschoben"
        ) : m.kickoff ? (
          <>
            <span className="f-day">{formatDay(m.kickoff)}</span>
            <span className="f-time">{formatTime(m.kickoff)}</span>
          </>
        ) : (
          "offen"
        )}
      </span>
      <span className="f-home">{m.home}</span>
      <span className={`f-score${m.state === "live" ? " f-live" : ""}`}>
        {scored ? `${m.homeScore}:${m.awayScore}` : "–:–"}
        {m.state === "live" && <span className="sr-only"> (läuft)</span>}
      </span>
      <span className="f-away">{m.away}</span>
    </li>
  );
}

export function HnlSection({ hnl }: { hnl: Sourced<HnlData> | null }) {
  if (!hnl) {
    return (
      <section id="hnl" className="card" aria-labelledby="hnl-h">
        <div className="card-head">
          <h2 id="hnl-h">⚽ SuperSport HNL</h2>
        </div>
        <NoData what="SuperSport HNL" />
      </section>
    );
  }
  const d = hnl.data;
  const games = new Map(d.table.map((r) => [r.team, r.played]));
  const maxPlayed = Math.max(...games.values());
  const behind = d.table.filter((r) => r.played < maxPlayed);

  return (
    <section id="hnl" className="card" aria-labelledby="hnl-h">
      <div className="card-head">
        <h2 id="hnl-h">⚽ SuperSport HNL</h2>
        <span className="pill">Saison {d.season.replace(/^(\d{4})-\d{2}(\d{2})$/, "$1/$2")}</span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col" className="num">#</th>
              <th scope="col" className="left">Verein</th>
              <th scope="col" className="num">Sp</th>
              <th scope="col" className="num hide-xs">S</th>
              <th scope="col" className="num hide-xs">U</th>
              <th scope="col" className="num hide-xs">N</th>
              <th scope="col" className="num">Tore</th>
              <th scope="col" className="num">Diff</th>
              <th scope="col" className="num">Pkt</th>
            </tr>
          </thead>
          <tbody>
            {d.table.map((r) => {
              const diff = r.goalsFor - r.goalsAgainst;
              return (
                <tr key={r.team} className={r.rank === 1 ? "lead" : r.rank === d.table.length ? "last" : undefined}>
                  <td className="num">{r.rank}</td>
                  <td className="left">{r.team}</td>
                  <td className="num">{r.played}</td>
                  <td className="num hide-xs">{r.won}</td>
                  <td className="num hide-xs">{r.drawn}</td>
                  <td className="num hide-xs">{r.lost}</td>
                  <td className="num">
                    {r.goalsFor}:{r.goalsAgainst}
                  </td>
                  <td className="num">{diff > 0 ? `+${diff}` : diff}</td>
                  <td className="num strong">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="footnote">
        Aus den Einzelergebnissen berechnet; bei Punktgleichheit nach Tordifferenz und Toren gereiht (offiziell
        zählt teils der direkte Vergleich).
        {d.postponed.length > 0 && (
          <>
            {" "}
            Verschoben:{" "}
            {d.postponed.map((m, i) => (
              <span key={m.id}>
                {i > 0 ? ", " : ""}
                {m.home} – {m.away} ({m.round}. Runde)
              </span>
            ))}
            {behind.length > 0 && <> – {behind.map((r) => r.team).join(" und ")} mit weniger Spielen.</>}
          </>
        )}
      </p>

      {d.currentRoundMatches.length > 0 && (
        <>
          <h3>{d.currentRound}. Runde</h3>
          <ul className="fixtures">
            {d.currentRoundMatches.map((m) => (
              <Fixture key={m.id} m={m} />
            ))}
          </ul>
        </>
      )}
      {d.previousRound && d.previousRoundMatches.length > 0 && (
        <details className="prev">
          <summary>{d.previousRound}. Runde – Ergebnisse</summary>
          <ul className="fixtures">
            {d.previousRoundMatches.map((m) => (
              <Fixture key={m.id} m={m} />
            ))}
          </ul>
        </details>
      )}
      <Stand fetchedAt={hnl.fetchedAt} source="TheSportsDB" />
    </section>
  );
}
