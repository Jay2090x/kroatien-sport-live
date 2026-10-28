import Link from "next/link";
import { backLink } from "@/lib/nav";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NoData, Stand } from "@/components/stand";
import { TALENT_RULES, getTalents, type Talent } from "@/lib/sources/talents";
import { fan } from "@/lib/fan/i18n";
import { dict, href, type Lang } from "@/lib/i18n";
import { Avatar } from "@/components/avatar";
import { photoKey } from "@/lib/photos";
import { Club } from "@/components/club-badge";

const COMP_HR: Record<string, string> = {
  "Champions League": "Liga prvaka",
  "Europa League": "Europska liga",
  "Conference League": "Konferencijska liga",
};

function comp(c: string, lang: Lang) {
  return lang === "hr" ? COMP_HR[c] ?? c : c;
}

function TeamTag({ team }: { team: Talent["team"] }) {
  return <span className={`tag tag-${team === "U21" ? "u21" : "a"}`}>{team === "A+U21" ? "A · U21" : team}</span>;
}

export async function TalenteView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const F = fan(lang);
  const T = F.talents;
  const data = await getTalents();

  return (
    <>
      <SiteHeader lang={lang} path="/talente" />
      <main lang={lang} className="container page-fan">
        <section className="card" aria-labelledby="tal-h">
          <div className="card-head">
            <h1 id="tal-h" className="h1">🌱 {T.h1}</h1>
            <Link href={href(lang, backLink("/talente", lang).path)} className="pill">{backLink("/talente", lang).label}</Link>
          </div>
          <p className="intro">{T.intro}</p>
          {data && (
            <>
              <p className="criterion">
                {T.criterion(TALENT_RULES.maxAge, TALENT_RULES.minStarts, TALENT_RULES.minInvolvements, data.season.replace("-", "/"))}
              </p>
              <p className="small muted">{T.pool(data.u21Matches)}</p>
            </>
          )}
        </section>

        <section className="card" aria-labelledby="radar-h">
          <div className="card-head">
            <h2 id="radar-h">{T.radar}</h2>
            {data && <span className="pill">{data.radar.length}</span>}
          </div>
          {!data ? (
            <NoData what={T.what} lang={lang} />
          ) : data.radar.length === 0 ? (
            <p className="muted">{T.none}</p>
          ) : (
            <div className="table-wrap">
              <table className="table talents">
                <thead>
                  <tr>
                    <th scope="col" className="left">{T.name}</th>
                    <th scope="col" className="num">{T.age}</th>
                    <th scope="col" className="num">{T.starts}</th>
                    <th scope="col" className="num">{T.goals}</th>
                    <th scope="col" className="num">{T.assists}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.radar.map((r) => (
                    <tr key={r.id}>
                      <td className="left">
                        <div className="tal-cell">
                        <Avatar pkey={photoKey.soccer(r.id)} name={r.name} size={36} lang={lang} />
                        <div>
                        <strong>{r.name}</strong> <TeamTag team={r.team} />
                        <span className="tal-sub">
                          {r.club ? <Club name={r.club} size={16} /> : null}
                          {r.stats?.length
                            ? ` · ${r.stats
                                .filter((s) => s.starts || s.goals || s.assists)
                                .map((s) => `${comp(s.competition, lang)} ${s.starts}/${s.goals}/${s.assists}`)
                                .join(" · ")}`
                            : ""}
                        </span>
                        </div>
                        </div>
                      </td>
                      <td className="num">{r.age ?? "?"}</td>
                      <td className="num">{r.starts}</td>
                      <td className="num strong">{r.goals}</td>
                      <td className="num">{r.assists}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="footnote">
                {T.comps}: {T.starts}/{T.goals}/{T.assists}
              </p>
            </div>
          )}
          {data && <Stand fetchedAt={data.fetchedAt} source="ESPN" lang={lang} />}
        </section>

        {data && data.others.length > 0 && (
          <section className="card" aria-labelledby="oth-h">
            <div className="card-head">
              <h2 id="oth-h">{T.others}</h2>
              <span className="pill">{data.others.length}</span>
            </div>
            <ul className="tal-others">
              {data.others.map((r) => (
                <li key={r.id}>
                  <Avatar pkey={photoKey.soccer(r.id)} name={r.name} size={24} lang={lang} />{" "}
                  <strong>{r.name}</strong> <TeamTag team={r.team} />{" "}
                  <span className="muted small">
                    {[
                      r.age != null ? `${r.age} ${T.years}` : T.ageUnknown,
                      r.club,
                      r.stats === null
                        ? T.statsUnavailable
                        : r.stats.length === 0
                          ? T.noStats
                          : T.below(r.starts, r.goals + r.assists),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card notes" aria-label={t.sport.notes}>
          <h2 className="pgroup-h">{t.sport.notes}</h2>
          <ul>
            <li>{T.hnlNote}</li>
            <li>{T.minutesNote}</li>
          </ul>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
