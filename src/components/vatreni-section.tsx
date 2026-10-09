import type { VatreniData } from "@/lib/sources/vatreni";
import type { NtMatch } from "@/lib/sources/types";
import Link from "next/link";
import { formatKickoff, formatShortDate } from "@/lib/time";
import { dataLabel, dict, href, type Dict, type Lang } from "@/lib/i18n";
import { Countdown } from "./countdown";
import { NoData, Stand } from "./stand";

function Team({ name, strong, lang = "de" }: { name: string; strong: boolean; lang?: Lang }) {
  return <span className={strong ? "team team-cro" : "team"}>{dataLabel(name, lang)}</span>;
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


function MatchHeadline({ m, lang }: { m: NtMatch; lang: Lang }) {
  return (
    <p className="match-teams">
      <Team name={m.home} strong={m.croatiaIsHome} lang={lang} />
      <span className="vs">–</span>
      <Team name={m.away} strong={!m.croatiaIsHome} lang={lang} />
    </p>
  );
}

function LiveCard({ m, lang, t }: { m: NtMatch; lang: Lang; t: Dict }) {
  return (
    <div className="feature feature-live" aria-live="polite">
      <p className="eyebrow">
        <span className="live-dot" aria-hidden="true" /> Live · {dataLabel(m.competition, lang)}
      </p>
      <p className="match-teams">
        <Team name={m.home} strong={m.croatiaIsHome} lang={lang} />
        <span className="score-big">
          {m.homeScore ?? 0}:{m.awayScore ?? 0}
        </span>
        <Team name={m.away} strong={!m.croatiaIsHome} lang={lang} />
      </p>
      <p className="meta">
        {m.clock ? `${m.clock} · ` : ""}{t.vatreni.kickoff} {formatKickoff(m.kickoff, lang)} {t.oclock}
      </p>
    </div>
  );
}

function NextCard({ m, lang, t }: { m: NtMatch; lang: Lang; t: Dict }) {
  return (
    <div className="feature">
      <p className="eyebrow">{t.vatreni.nextMatch} · {dataLabel(m.competition, lang)}</p>
      <MatchHeadline m={m} lang={lang} />
      <p className="meta">
        <time dateTime={m.kickoff}>{formatKickoff(m.kickoff, lang)} {t.oclock}</time>
        {m.venue ? ` · ${m.venue}` : ""}
      </p>
      <Countdown kickoff={m.kickoff} t={t.countdown} />
    </div>
  );
}

export function VatreniSection({ data, lang = "de" }: { data: VatreniData; lang?: Lang }) {
  const t = dict(lang);
  const OUTCOME_LABEL = { S: t.win, U: t.draw, N: t.loss } as const;
  const OUTCOME_SHORT = { S: t.winShort, U: t.drawShort, N: t.lossShort } as const;
  const nothing = !data.live && !data.next && data.last.length === 0;
  return (
    <section id="vatreni" className="card" aria-labelledby="vatreni-h">
      <div className="card-head">
        <h2 id="vatreni-h">🇭🇷 Vatreni</h2>
        {data.liveMode && <span className="pill pill-live">{t.vatreni.matchday}</span>}
      </div>

      {nothing ? (
        <NoData what={t.vatreni.what} lang={lang} />
      ) : (
        <>
          {data.live && <LiveCard m={data.live} lang={lang} t={t} />}
          {data.next ? (
            <NextCard m={data.next} lang={lang} t={t} />
          ) : (
            !data.live && <p className="muted">{t.vatreni.noNext}</p>
          )}

          {data.last.length > 0 && (
            <>
              <h3>{t.vatreni.lastResults}</h3>
              <ul className="results">
                {data.last.map((m) => {
                  const o = outcome(m);
                  return (
                    <li key={m.id} className="result">
                      <span className="r-date">{formatShortDate(m.kickoff, lang)}</span>
                      <span className="r-match">
                        <Team name={m.home} strong={m.croatiaIsHome} lang={lang} />
                        <span className="r-score">
                          {m.homeScore}:{m.awayScore}
                        </span>
                        <Team name={m.away} strong={!m.croatiaIsHome} lang={lang} />
                        {m.extra && <span className="r-extra">{lang === "hr" ? m.extra.replace("n. E.", "pen.") : m.extra}</span>}
                        <span className="r-comp">{dataLabel(m.competition, lang)}</span>
                      </span>
                      {o && (
                        <span className={`badge badge-${o}`} title={OUTCOME_LABEL[o]} aria-label={OUTCOME_LABEL[o]}>
                          {OUTCOME_SHORT[o]}
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
      <Stand fetchedAt={data.fetchedAt} source={data.source} lang={lang} />
      <p className="more-link">
        <Link href={href(lang, "/spieler")}>{t.vatreni.players}</Link>
      </p>

      {data.group && (
        <>
          <h3>{dataLabel(data.group.title, lang)}</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col" className="num">#</th>
                  <th scope="col" className="left">{t.vatreni.team}</th>
                  <th scope="col" className="num">{t.vatreni.played}</th>
                  <th scope="col" className="num">{t.vatreni.goals}</th>
                  <th scope="col" className="num">{t.vatreni.points}</th>
                </tr>
              </thead>
              <tbody>
                {data.group.rows.map((r) => (
                  <tr key={r.team} className={r.isCroatia ? "hl" : undefined}>
                    <td className="num">{r.rank}</td>
                    <td className="left">{dataLabel(r.team, lang)}</td>
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
          <Stand fetchedAt={data.groupFetchedAt} source="ESPN" lang={lang} />
        </>
      )}
    </section>
  );
}
