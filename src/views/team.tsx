import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NoData, Stand } from "@/components/stand";
import { Club } from "@/components/club-badge";
import { JsonLd, breadcrumbs } from "@/components/json-ld";
import { getTeam, TEAM_CONF, type SquadPlayer, type TeamKey, type TeamMatch } from "@/lib/sources/national-teams";
import { x2 } from "@/lib/fan/i18n2";
import { dataLabel, dict, href, type Lang } from "@/lib/i18n";
import { formatKickoff, formatShortDate } from "@/lib/time";
import { SITE } from "@/lib/site";

function Events({ m, lang }: { m: TeamMatch; lang: Lang }) {
  const X = x2(lang).team;
  const goals = m.events.filter((e) => e.kind === "goal" || e.kind === "penalty" || e.kind === "owngoal");
  const miss = m.events.filter((e) => e.kind === "pen-miss");
  const reds = m.events.filter((e) => e.kind === "red");
  if (!goals.length && !miss.length && !reds.length) return null;
  const side = (f: boolean) =>
    goals
      .filter((e) => (e.kind === "owngoal" ? !e.forCroatia === f : e.forCroatia === f))
      .map((e) => `${e.name} ${e.minute}${e.kind === "penalty" ? " (11 m)" : e.kind === "owngoal" ? ` (${X.ownGoal})` : ""}`)
      .join(", ");
  return (
    <span className="tm-ev small">
      {side(true) && <span>🇭🇷 ⚽ {side(true)}</span>}
      {side(false) && <span className="muted"> · ⚽ {side(false)}</span>}
      {miss.map((e, i) => (
        <span key={`m${i}`} className="muted"> · ✖ {X.penMiss}: {e.name} {e.minute}</span>
      ))}
      {reds.map((e, i) => (
        <span key={`r${i}`} className="muted"> · 🟥 {e.name} {e.minute}</span>
      ))}
    </span>
  );
}

/** ESPN-Wettbewerbsnamen (englisch) auf deutsche Bezeichnung abbilden; HR über dataLabel. Unbekanntes bleibt neutral. */
function compDe(c: string): string {
  const s = c.toLowerCase();
  const women = /women/.test(s);
  const u21 = /under-?21|u-?21/.test(s);
  const pre = women ? "Frauen-" : u21 ? "U21-" : "";
  if (/world cup qualifying/.test(s)) return `${pre}WM-Qualifikation`;
  if (/world cup/.test(s)) return `${pre}WM`;
  if (/(euro|european).*(qualifying)/.test(s)) return `${pre}EM-Qualifikation`;
  if (/euro|european championship/.test(s)) return `${pre}EM`;
  if (/nations league/.test(s)) return women ? "Frauen-Nations-League" : "UEFA Nations League";
  if (/friendl/.test(s)) return "Freundschaftsspiel";
  return /\b(the|of|and|qualifying|women)\b/i.test(c) ? "" : c;
}

/** Nur feste Begriffe übersetzen (Hin-/Rückspiel), Rest der ESPN-Notiz weglassen. */
function roundLabel(r: string | null, lang: Lang): string {
  if (!r) return "";
  const hr = lang === "hr";
  const parts: string[] = [];
  if (/play-?off/i.test(r)) parts.push("Play-off");
  if (/1st leg/i.test(r)) parts.push(hr ? "prva utakmica" : "Hinspiel");
  if (/2nd leg/i.test(r)) parts.push(hr ? "uzvrat" : "Rückspiel");
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}

function Row({ m, lang }: { m: TeamMatch; lang: Lang }) {
  const scored = m.homeScore != null && m.awayScore != null;
  return (
    <li className="result tm-row">
      <span className="r-date">{formatShortDate(m.kickoff, lang)}</span>
      <span className="r-match">
        <span className={m.croatiaIsHome ? "team team-cro" : "team"}>
          <Club name={m.home} size={20}>{dataLabel(m.home, lang)}</Club>
        </span>
        <span className="r-score">{scored ? `${m.homeScore} : ${m.awayScore}` : "–"}</span>
        <span className={!m.croatiaIsHome ? "team team-cro" : "team"}>
          <Club name={m.away} size={20}>{dataLabel(m.away, lang)}</Club>
        </span>
      </span>
      <span className="r-comp small muted">
        {dataLabel(compDe(m.competition), lang)}
        {roundLabel(m.round, lang)}
        {!scored ? ` · ${formatKickoff(m.kickoff, lang)}` : ""}
        {m.venue ? ` · ${m.venue}` : ""}
      </span>
      <Events m={m} lang={lang} />
    </li>
  );
}

export async function TeamView({ team, lang }: { team: TeamKey; lang: Lang }) {
  const t = dict(lang);
  const X = x2(lang).team;
  const T = X[team];
  const data = await getTeam(team);
  const now = Date.now();
  const next = (data?.matches ?? []).filter((m) => m.state === "pre" && Date.parse(m.kickoff) > now - 3 * 3600_000);
  const results = (data?.matches ?? [])
    .filter((m) => m.state === "post" || m.state === "in")
    .sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
  const conf = TEAM_CONF[team];
  const byPos = new Map<string, SquadPlayer[]>();
  for (const p of data?.squad?.players ?? []) {
    const k = X.pos[p.pos] ?? p.pos;
    byPos.set(k, [...(byPos.get(k) ?? []), p]);
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbs([
            { name: SITE.name, url: `${SITE.url}${href(lang, "/")}` },
            { name: T.h1, url: `${SITE.url}${href(lang, `/${team}`)}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: team === "frauen" ? "Croatia women's national football team" : "Croatia national under-21 football team",
            sport: "Soccer",
            sameAs: [conf.wikiUrl],
          },
        ]}
      />
      <SiteHeader lang={lang} path={`/${team}`} />
      <main lang={lang} className="container page-fan">
        <section className="card" aria-labelledby="tm-h">
          <div className="card-head">
            <h1 id="tm-h" className="h1">🇭🇷 {T.h1}</h1>
            <Link href={href(lang, "/#vatreni")} className="pill">← Vatreni</Link>
          </div>
          <p className="intro">{T.intro}</p>
        </section>

        {!data ? (
          <section className="card"><NoData what={X.what} lang={lang} /></section>
        ) : (
          <>
            <section className="card" aria-labelledby="tn-h">
              <h2 id="tn-h">{X.next}</h2>
              {next.length ? <ul className="results">{next.map((m) => <Row key={m.id} m={m} lang={lang} />)}</ul> : <p className="muted">{X.noNext}</p>}
            </section>
            <section className="card" aria-labelledby="tr-h">
              <h2 id="tr-h">{X.results}</h2>
              {results.length ? <ul className="results">{results.map((m) => <Row key={m.id} m={m} lang={lang} />)}</ul> : <p className="muted">{X.noResults}</p>}
              <Stand fetchedAt={data.fetchedAt} source="ESPN" lang={lang} />
            </section>
            <section className="card" aria-labelledby="tt-h">
              <h2 id="tt-h">{X.table}{data.table ? ` · ${data.table.title.replace(/Group/i, lang === "hr" ? "Skupina" : "Gruppe")}` : ""}</h2>
              {data.table ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col" className="left">Team</th>
                        <th scope="col" className="num">{X.sb.T}</th>
                        <th scope="col" className="num">{X.sb.W}</th>
                        <th scope="col" className="num">{X.sb.D}</th>
                        <th scope="col" className="num">{X.sb.L}</th>
                        <th scope="col" className="num">{X.sb.G}</th>
                        <th scope="col" className="num">{X.sb.P}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.table.rows.map((r) => (
                        <tr key={r.team} className={r.isCroatia ? "row-cro" : undefined}>
                          <td>{r.rank}</td>
                          <td className="left"><Club name={r.team} size={18}>{dataLabel(r.team, lang)}</Club></td>
                          <td className="num">{r.played}</td>
                          <td className="num">{r.won}</td>
                          <td className="num">{r.drawn}</td>
                          <td className="num">{r.lost}</td>
                          <td className="num">{r.goalsFor}:{r.goalsAgainst}</td>
                          <td className="num strong">{r.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">{X.noTable}</p>
              )}
            </section>
          </>
        )}

        <section className="card" aria-labelledby="ts-h">
          <h2 id="ts-h">{X.squad}</h2>
          {data?.squad ? (
            <>
              <p className="small muted">
                {lang === "hr"
                  ? "Zadnja nominacija kako je upisana na Wikipediji (bez jamstva potpunosti)."
                  : "Letzte Nominierung, wie sie auf Wikipedia eingetragen ist (ohne Gewähr auf Vollständigkeit)."}
              </p>
              {[...byPos.entries()].map(([pos, ps]) => (
                <div key={pos}>
                  <p className="label">{pos}</p>
                  <ul className="squad">
                    {ps.map((p) => (
                      <li key={p.name}>
                        <strong>{p.name}</strong>
                        <span className="muted small">
                          {p.club ? ` · ${p.club}` : ""}
                          {p.caps != null ? ` · ${p.caps} ${X.caps}` : ""}
                          {p.goals != null ? ` / ${p.goals} ${X.goals}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="stand">
                <a href={conf.wikiUrl} target="_blank" rel="noopener">{X.squadSource}</a> · {t.stand}:{" "}
                {formatKickoff(data.squad.fetchedAt, lang)} {t.oclock}
              </p>
            </>
          ) : (
            <p className="muted">{X.noSquad}</p>
          )}
        </section>

        <section className="card notes" aria-label={t.sport.notes}>
          <h2 className="pgroup-h">{t.sport.notes}</h2>
          <ul>
            {X.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
