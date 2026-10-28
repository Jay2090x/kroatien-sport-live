import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NoData, Stand } from "@/components/stand";
import { Club } from "@/components/club-badge";
import { JsonLd, breadcrumbs } from "@/components/json-ld";
import { getVatreniMatches, matchSlug } from "@/lib/sources/vatreni-matches";
import { x2 } from "@/lib/fan/i18n2";
import { dataLabel, dict, href, type Lang } from "@/lib/i18n";
import { formatKickoff, formatShortDate } from "@/lib/time";
import { SITE } from "@/lib/site";
import type { NtMatch } from "@/lib/sources/types";

function Row({ m, lang }: { m: NtMatch; lang: Lang }) {
  const scored = m.homeScore != null && m.awayScore != null;
  return (
    <li className="result tm-row">
      <span className="r-date">{formatShortDate(m.kickoff, lang)}</span>
      <Link className="r-match" href={href(lang, `/vatreni/spiel/${matchSlug(m)}`)}>
        <span className={m.croatiaIsHome ? "team team-cro" : "team"}>
          <Club name={m.home} size={20}>{dataLabel(m.home, lang)}</Club>
        </span>
        <span className="r-score">{scored ? `${m.homeScore} : ${m.awayScore}` : "–"}</span>
        <span className={!m.croatiaIsHome ? "team team-cro" : "team"}>
          <Club name={m.away} size={20}>{dataLabel(m.away, lang)}</Club>
        </span>
      </Link>
      <span className="r-comp small muted">
        {dataLabel(m.competition, lang)}
        {m.extra ? ` · ${m.extra}` : ""}
        {!scored ? ` · ${formatKickoff(m.kickoff, lang)}` : ""}
      </span>
    </li>
  );
}

export async function VatreniListView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const X = x2(lang).match;
  const data = await getVatreniMatches();
  const now = Date.now();
  const upcoming = (data?.matches ?? []).filter((m) => m.state === "pre" && Date.parse(m.kickoff) > now - 3 * 3600_000);
  const results = (data?.matches ?? [])
    .filter((m) => m.state === "post" || m.state === "in")
    .sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff))
    .slice(0, 20);
  return (
    <>
      <JsonLd
        data={breadcrumbs([
          { name: SITE.name, url: `${SITE.url}${href(lang, "/")}` },
          { name: X.list, url: `${SITE.url}${href(lang, "/vatreni")}` },
        ])}
      />
      <SiteHeader lang={lang} path="/vatreni" />
      <main lang={lang} className="container page-fan">
        <section className="card" aria-labelledby="vl-h">
          <div className="card-head">
            <h1 id="vl-h" className="h1">🇭🇷 {X.list}</h1>
            <Link href={href(lang, "/#vatreni")} className="pill">{X.back}</Link>
          </div>
          <p className="intro">{X.listIntro}</p>
        </section>
        {!data ? (
          <section className="card"><NoData what={X.what} lang={lang} /></section>
        ) : (
          <>
            <section className="card" aria-labelledby="up-h">
              <h2 id="up-h">{X.upcoming}</h2>
              {upcoming.length ? <ul className="results">{upcoming.map((m) => <Row key={m.id} m={m} lang={lang} />)}</ul> : <p className="muted">{x2(lang).team.noNext}</p>}
            </section>
            <section className="card" aria-labelledby="res-h">
              <h2 id="res-h">{X.results}</h2>
              <ul className="results">{results.map((m) => <Row key={m.id} m={m} lang={lang} />)}</ul>
              <Stand fetchedAt={data.fetchedAt} source="ESPN" lang={lang} />
            </section>
          </>
        )}
        <p className="small muted">{t.source}: ESPN</p>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
