import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { H2HTable } from "@/components/fan/h2h-table";
import { H2H_ROWS, H2H_SOURCE, H2H_TOTAL, type H2H } from "@/data/h2h";
import { h2hT } from "@/lib/h2h-i18n";
import { getVatreniMatches, matchSlug } from "@/lib/sources/vatreni-matches";
import { dataLabel, href, type Lang } from "@/lib/i18n";
import { formatLongDay } from "@/lib/time";

type T = ReturnType<typeof h2hT>;
const ppg = (r: H2H) => (r.w * 3 + r.d) / r.p;

function Bar({ r }: { r: H2H }) {
  const w = (r.w / r.p) * 100, d = (r.d / r.p) * 100;
  return (
    <span className="h2h-bar" aria-hidden="true">
      <span className="h2h-bw" style={{ width: `${w}%` }} />
      <span className="h2h-bd" style={{ width: `${d}%` }} />
      <span className="h2h-bl" style={{ width: `${100 - w - d}%` }} />
    </span>
  );
}

function Mini({ title, rows, t, lang }: { title: string; rows: H2H[]; t: T; lang: Lang }) {
  return (
    <div className="h2h-mini">
      <h3>{title}</h3>
      <ol className="h2h-mini-list">
        {rows.map((r) => (
          <li key={r.en}>
            <span><span aria-hidden="true">{r.flag} </span><strong>{r[lang]}</strong></span>
            <span className="small muted">{t.games(r.p)} · {t.rec(r.w, r.d, r.l)} · {r.gf}:{r.ga}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export async function BilanzView({ lang }: { lang: Lang }) {
  const t = h2hT(lang);
  const m = await getVatreniMatches();
  const now = Date.now();
  const upcoming = (m?.matches ?? [])
    .filter((x) => x.state === "pre" && Date.parse(x.kickoff) > now)
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))
    .slice(0, 3);
  const byDe = new Map(H2H_ROWS.map((r) => [r.de, r]));
  const T0 = H2H_TOTAL;
  const sorted = (f: (a: H2H, b: H2H) => number, pred: (r: H2H) => boolean = () => true) => H2H_ROWS.filter(pred).sort(f).slice(0, 5);
  const tiles: Array<[string, string]> = [
    [String(T0.p), t.tot.p],
    [String(T0.w), t.tot.w],
    [String(T0.d), t.tot.d],
    [String(T0.l), t.tot.l],
    [`${T0.gf}:${T0.ga}`, t.tot.goals],
    [`${Math.round((T0.w / T0.p) * 100)} %`, t.tot.pct],
  ];
  return (
    <>
      <SiteHeader lang={lang} path="/bilanz" />
      <main lang={lang} className="container page-fan">
        <section className="card" aria-labelledby="bz-h">
          <h1 id="bz-h" className="h1">🆚 {t.h1}</h1>
          <p className="intro">{t.intro}</p>
          <ul className="vz-tiles bz-tot">
            {tiles.map(([big, label]) => (
              <li key={label} className="vz-tile">
                <p className="vz-big">{big}</p>
                <p className="vz-label">{label}</p>
              </li>
            ))}
          </ul>
          <p className="small muted">{t.asOf}</p>
        </section>

        <section className="card" aria-labelledby="bz-next">
          <h2 id="bz-next">📅 {t.next}</h2>
          {upcoming.length === 0 ? (
            <p className="muted">{t.nextNone}</p>
          ) : (
            <ul className="hp-list">
              {upcoming.map((x) => {
                const opp = x.croatiaIsHome ? x.away : x.home;
                const r = byDe.get(opp);
                return (
                  <li key={x.id} className="hp-item">
                    <p className="eyebrow">{formatLongDay(x.kickoff, lang)} · {dataLabel(x.competition, lang)}</p>
                    <p className="h2h-next-title">
                      <Link href={href(lang, `/vatreni/spiel/${matchSlug(x)}`)}>
                        {dataLabel(x.home, lang)} – {dataLabel(x.away, lang)}
                      </Link>
                    </p>
                    {r ? (
                      <>
                        <Bar r={r} />
                        <p className="small">
                          <strong>{t.games(r.p)}</strong> · {t.rec(r.w, r.d, r.l)} · {t.cols.goals} {r.gf}:{r.ga}
                        </p>
                      </>
                    ) : (
                      <p className="small strong">{t.nextFirst}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="bz-facts">
          <h2 id="bz-facts">💙 {t.facts}</h2>
          <div className="h2h-minis">
            <Mini title={t.most} rows={sorted((a, b) => b.p - a.p || b.w - a.w)} t={t} lang={lang} />
            <Mini title={t.wins} rows={sorted((a, b) => b.w - a.w || a.p - b.p)} t={t} lang={lang} />
            <Mini title={t.unbeaten} rows={sorted((a, b) => b.p - a.p || b.w - a.w, (r) => r.p >= 4 && r.l === 0)} t={t} lang={lang} />
            <Mini title={t.tough} rows={sorted((a, b) => ppg(a) - ppg(b) || b.p - a.p, (r) => r.p >= 4)} t={t} lang={lang} />
          </div>
        </section>

        <section className="card" aria-labelledby="bz-all">
          <h2 id="bz-all">🌍 {t.all}</h2>
          <H2HTable rows={H2H_ROWS} lang={lang} L={{ filter: t.filter, sort: t.sort, none: t.none, sorts: t.sorts, cols: t.cols }} />
          <p className="footnote">
            {t.note} <a href={H2H_SOURCE} target="_blank" rel="noopener noreferrer">{t.source}: Wikipedia ↗</a>
          </p>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
