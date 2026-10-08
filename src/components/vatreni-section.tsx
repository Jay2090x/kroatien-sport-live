import type { VatreniData } from "@/lib/sources/vatreni";
import type { NtMatch } from "@/lib/sources/types";
import Link from "next/link";
import { formatKickoff, formatShortDate } from "@/lib/time";
import { Countdown } from "./countdown";
import { NoData, Stand } from "./stand";

function Team({ name, strong }: { name: string; strong: boolean }) {
  return <span className={strong ? "team team-cro" : "team"}>{name}</span>;
}

function outcome(m: NtMatch): "S" | "U" | "N" | null {
  if (m.homeScore == null || m.awayScore == null) return null;
  const cro = m.croatiaIsHome ? m.homeScore : m.awayScore;
  const opp = m.croatiaIsHome ? m.awayScore : m.homeScore;
  if (m.extra?.startsWith("n. E.")) {
    const [h, a] = m.extra.replace("n. E. ", "").split(":").map(Number);
    const croPen = m.croatiaIsHome ? h : a;
    const oppPen = m.croatiaIsHome ? a : h;
    return croPen > oppPen ? "S" : "N";
  }
  return cro > opp ? "S" : cro < opp ? "N" : "U";
}

const OUTCOME_LABEL = { S: "Sieg", U: "Unentschieden", N: "Niederlage" } as const;

function MatchHeadline({ m }: { m: NtMatch }) {
  return (
    <p className="match-teams">
      <Team name={m.home} strong={m.croatiaIsHome} />
      <span className="vs">–</span>
      <Team name={m.away} strong={!m.croatiaIsHome} />
    </p>
  );
}

function LiveCard({ m }: { m: NtMatch }) {
  return (
    <div className="feature feature-live" aria-live="polite">
      <p className="eyebrow">
        <span className="live-dot" aria-hidden="true" /> Live · {m.competition}
      </p>
      <p className="match-teams">
        <Team name={m.home} strong={m.croatiaIsHome} />
        <span className="score-big">
          {m.homeScore ?? 0}:{m.awayScore ?? 0}
        </span>
        <Team name={m.away} strong={!m.croatiaIsHome} />
      </p>
      <p className="meta">
        {m.clock ? `${m.clock} · ` : ""}Anpfiff {formatKickoff(m.kickoff)} Uhr
      </p>
    </div>
  );
}

function NextCard({ m }: { m: NtMatch }) {
  return (
    <div className="feature">
      <p className="eyebrow">Nächstes Länderspiel · {m.competition}</p>
      <MatchHeadline m={m} />
      <p className="meta">
        <time dateTime={m.kickoff}>{formatKickoff(m.kickoff)} Uhr</time>
        {m.venue ? ` · ${m.venue}` : ""}
      </p>
      <Countdown kickoff={m.kickoff} />
    </div>
  );
}

export function VatreniSection({ data }: { data: VatreniData }) {
  const nothing = !data.live && !data.next && data.last.length === 0;
  return (
    <section id="vatreni" className="card" aria-labelledby="vatreni-h">
      <div className="card-head">
        <h2 id="vatreni-h">🇭🇷 Vatreni</h2>
        {data.liveMode && <span className="pill pill-live">Spieltag · Aktualisierung jede Minute</span>}
      </div>

      {nothing ? (
        <NoData what="Länderspiele" />
      ) : (
        <>
          {data.live && <LiveCard m={data.live} />}
          {data.next ? (
            <NextCard m={data.next} />
          ) : (
            !data.live && <p className="muted">Derzeit ist kein weiteres Länderspiel angesetzt.</p>
          )}

          {data.last.length > 0 && (
            <>
              <h3>Letzte Ergebnisse</h3>
              <ul className="results">
                {data.last.map((m) => {
                  const o = outcome(m);
                  return (
                    <li key={m.id} className="result">
                      <span className="r-date">{formatShortDate(m.kickoff)}</span>
                      <span className="r-match">
                        <Team name={m.home} strong={m.croatiaIsHome} />
                        <span className="r-score">
                          {m.homeScore}:{m.awayScore}
                        </span>
                        <Team name={m.away} strong={!m.croatiaIsHome} />
                        {m.extra && <span className="r-extra">{m.extra}</span>}
                        <span className="r-comp">{m.competition}</span>
                      </span>
                      {o && (
                        <span className={`badge badge-${o}`} title={OUTCOME_LABEL[o]} aria-label={OUTCOME_LABEL[o]}>
                          {o}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
      <Stand fetchedAt={data.fetchedAt} source={data.source} />
      <p className="more-link">
        <Link href="/spieler">Alle Spieler: letztes &amp; nächstes Spiel, Minuten, Tore, Karten →</Link>
      </p>

      {data.group && (
        <>
          <h3>{data.group.title}</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col" className="num">#</th>
                  <th scope="col" className="left">Team</th>
                  <th scope="col" className="num">Sp</th>
                  <th scope="col" className="num">Tore</th>
                  <th scope="col" className="num">Pkt</th>
                </tr>
              </thead>
              <tbody>
                {data.group.rows.map((r) => (
                  <tr key={r.team} className={r.isCroatia ? "hl" : undefined}>
                    <td className="num">{r.rank}</td>
                    <td className="left">{r.team}</td>
                    <td className="num">{r.played}</td>
                    <td className="num">
                      {r.goalsFor}:{r.goalsAgainst}
                    </td>
                    <td className="num strong">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Stand fetchedAt={data.groupFetchedAt} source="ESPN" />
        </>
      )}
    </section>
  );
}
