import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Stand } from "@/components/stand";
import { DaysUntil } from "@/components/fan/days-until";
import { Countdown } from "@/components/countdown";
import { EURO2028, getEuroQuali } from "@/lib/sources/euro2028";
import { fan } from "@/lib/fan/i18n";
import { dataLabel, dict, href, type Lang } from "@/lib/i18n";
import { formatKickoff, viennaYmd } from "@/lib/time";
import { Club } from "@/components/club-badge";

export async function Em2028View({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const F = fan(lang);
  const E = F.euro;
  const data = await getEuroQuali();
  const today = viennaYmd(new Date().toISOString());
  const drawn = today > EURO2028.drawDate;
  const firstFixture = data.fixtures.find((m) => m.state === "pre" && Date.parse(m.kickoff) > Date.now());
  const days = { lang, today: F.todayIs, one: F.days.one, many: F.days.many };

  return (
    <>
      <SiteHeader lang={lang} path="/em-2028" />
      <main className="container page-fan">
        <section className="card" aria-labelledby="em-h">
          <div className="card-head">
            <h1 id="em-h" className="h1">🇪🇺 {E.h1}</h1>
            <Link href={href(lang, "/#extras")} className="pill">{F.back}</Link>
          </div>
          <p className="intro">{E.intro}</p>
          <div className="countdowns">
            {!drawn && <DaysUntil ymd={EURO2028.drawDate} label={E.untilDraw} {...days} />}
            <DaysUntil ymd={EURO2028.tournamentStart} label={E.untilEuro} {...days} />
          </div>
        </section>

        <section className="card" aria-labelledby="draw-h">
          <div className="card-head">
            <h2 id="draw-h">{E.drawTitle}</h2>
            <span className="pill">06.12.2026 · Belfast</span>
          </div>
          <p>{drawn ? E.drawDone : E.drawText}</p>
        </section>

        <section className="card" aria-labelledby="grp-h">
          <div className="card-head">
            <h2 id="grp-h">{E.groupTitle}</h2>
          </div>
          {data.group ? (
            <div className="table-wrap">
              <h3>{dataLabel(data.group.name, lang)}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col" className="num">#</th>
                    <th scope="col" className="left">{E.team}</th>
                    <th scope="col" className="num">{E.played}</th>
                    <th scope="col" className="num">{E.goals}</th>
                    <th scope="col" className="num">{E.points}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.group.rows.map((r) => (
                    <tr key={r.team} className={r.isCroatia ? "hl" : undefined}>
                      <td className="num">{r.rank}</td>
                      <td className="left">
                        <Club name={r.team} size={20}>{dataLabel(r.team, lang)}</Club>
                      </td>
                      <td className="num">{r.played}</td>
                      <td className="num">{r.goalsFor}:{r.goalsAgainst}</td>
                      <td className="num strong">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">{E.groupPending}</p>
          )}

          <h3>{E.fixtures}</h3>
          {data.fixtures.length ? (
            <ul className="ags">
              {data.fixtures.map((m) => (
                <li key={m.id} className="ag">
                  <div className="ag-head">
                    <time dateTime={m.kickoff}>
                      {formatKickoff(m.kickoff, lang)} {t.oclock}
                    </time>
                    {m.venue && <span className="ag-comp">{m.venue}</span>}
                  </div>
                  <p className="ag-teams">
                    <span className={m.croatiaIsHome ? "own" : undefined}>
                      <Club name={m.home} size={18}>{dataLabel(m.home, lang)}</Club>
                    </span>{" "}
                    {m.homeScore != null ? `${m.homeScore}:${m.awayScore}` : "–"}{" "}
                    <span className={!m.croatiaIsHome ? "own" : undefined}>
                      <Club name={m.away} size={18}>{dataLabel(m.away, lang)}</Club>
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{E.fixturesPending}</p>
          )}
          {firstFixture && <Countdown kickoff={firstFixture.kickoff} t={t.countdown} />}
          <Stand fetchedAt={data.fetchedAt} source="ESPN" lang={lang} />
        </section>

        <section className="card notes" aria-labelledby="facts-h">
          <h2 id="facts-h" className="pgroup-h">{E.facts}</h2>
          <ul>
            {E.factList.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="footnote">
            {t.source}:{" "}
            {EURO2028.sources.map((s, i) => (
              <span key={s.url}>
                {i > 0 ? " · " : ""}
                <a href={s.url} rel="noopener" target="_blank">
                  {s.label}
                </a>
              </span>
            ))}
          </p>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
