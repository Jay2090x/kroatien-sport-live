import type { Sourced } from "@/lib/cache";
import type { HnlData, HnlMatch } from "@/lib/sources/hnl";
import { formatDay, formatTime } from "@/lib/time";
import { dict, type Dict, type Lang } from "@/lib/i18n";
import { NoData, Stand } from "./stand";

function Fixture({ m, lang, t, clip }: { m: HnlMatch; lang: Lang; t: Dict; clip?: string }) {
  const scored = m.homeScore != null && m.awayScore != null;
  return (
    <li className="fixture">
      <span className="f-when">
        {m.state === "postponed" ? (
          t.hnl.postponed
        ) : m.kickoff ? (
          <>
            <span className="f-day">{formatDay(m.kickoff, lang)}</span>
            <span className="f-time">{formatTime(m.kickoff, lang)}</span>
          </>
        ) : (
          t.hnl.open
        )}
      </span>
      <span className="f-home">{m.home}</span>
      <span className={`f-score${m.state === "live" ? " f-live" : ""}`}>
        {scored ? `${m.homeScore}:${m.awayScore}` : "–:–"}
        {m.state === "live" && <span className="sr-only"> ({t.hnl.running})</span>}
      </span>
      <span className="f-away">{m.away}</span>
      {clip && (
        <a className="f-clip" href={`#${clip}`} title={t.feed.watch} aria-label={`${t.feed.watch}: ${m.home} – ${m.away}`}>
          🎬
        </a>
      )}
    </li>
  );
}

export function HnlSection({
  hnl,
  lang = "de",
  clipFor = {},
}: {
  hnl: Sourced<HnlData> | null;
  lang?: Lang;
  clipFor?: Record<string, string>;
}) {
  const t = dict(lang);
  if (!hnl) {
    return (
      <section id="hnl" className="card" aria-labelledby="hnl-h">
        <div className="card-head">
          <h2 id="hnl-h">⚽ SuperSport HNL</h2>
        </div>
        <NoData what="SuperSport HNL" lang={lang} />
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
        <span className="pill">{t.hnl.season} {d.season.replace(/^(\d{4})-\d{2}(\d{2})$/, "$1/$2")}</span>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col" className="num">#</th>
              <th scope="col" className="left">{t.hnl.club}</th>
              <th scope="col" className="num">{t.vatreni.played}</th>
              <th scope="col" className="num hide-xs">{t.hnl.w}</th>
              <th scope="col" className="num hide-xs">{t.hnl.d}</th>
              <th scope="col" className="num hide-xs">{t.hnl.l}</th>
              <th scope="col" className="num">{t.vatreni.goals}</th>
              <th scope="col" className="num">{t.hnl.diff}</th>
              <th scope="col" className="num">{t.vatreni.points}</th>
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
        {t.hnl.tableNote}
        {d.postponed.length > 0 && (
          <>
            {" "}
            {t.hnl.postponedList}{" "}
            {d.postponed.map((m, i) => (
              <span key={m.id}>
                {i > 0 ? ", " : ""}
                {m.home} – {m.away} ({t.hnl.round(m.round)})
              </span>
            ))}
            {behind.length > 0 && <> – {t.hnl.fewerGames(behind.map((r) => r.team).join(t.hnl.and))}</>}
          </>
        )}
      </p>

      {d.currentRoundMatches.length > 0 && (
        <>
          <h3>{t.hnl.round(d.currentRound)}</h3>
          <ul className="fixtures">
            {d.currentRoundMatches.map((m) => (
              <Fixture key={m.id} m={m} lang={lang} t={t} clip={clipFor[`m-hnl-${m.id}`]} />
            ))}
          </ul>
        </>
      )}
      {d.previousRound && d.previousRoundMatches.length > 0 && (
        <details className="prev" open={d.previousRoundMatches.some((m) => clipFor[`m-hnl-${m.id}`]) || undefined}>
          <summary>{t.hnl.prevRound(d.previousRound)}</summary>
          <ul className="fixtures">
            {d.previousRoundMatches.map((m) => (
              <Fixture key={m.id} m={m} lang={lang} t={t} clip={clipFor[`m-hnl-${m.id}`]} />
            ))}
          </ul>
        </details>
      )}
      <Stand fetchedAt={hnl.fetchedAt} source="TheSportsDB" lang={lang} />
    </section>
  );
}
