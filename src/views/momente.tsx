import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClipPlayer } from "@/components/highlights";
import { dayLabel, scoreLabel } from "@/components/fan/on-this-day";
import { MOMENTS, momentYoutubeId } from "@/lib/fan/history";
import { placeLabel } from "@/lib/fan/place-hr";
import { EUROS, WORLD_CUPS, WP_TEAM, vhist, type Tourney } from "@/lib/vatreni-history-i18n";
import { href, type Lang } from "@/lib/i18n";

type H = ReturnType<typeof vhist>;

function RecordTable({ rows, h, lang, title }: { rows: Tourney[]; h: H; lang: Lang; title: string }) {
  const c = h.m.cols;
  return (
    <div className="table-wrap">
      <table className="table vm-table">
        <caption className="vm-caption">{title}</caption>
        <thead>
          <tr>
            <th className="num">{c.year}</th>
            <th className="left">{c.host}</th>
            <th className="left">{c.round}</th>
            <th className="num">{c.p}</th>
            <th className="num">{c.w}</th>
            <th className="num">{c.d}</th>
            <th className="num">{c.l}</th>
            <th className="num">{c.goals}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year} className={r.round === "final" || r.round === "third" ? "hl" : undefined}>
              <td className="num strong">{r.year}</td>
              <td className="left">{r.host[lang]}</td>
              <td className="left">{h.m.rounds[r.round]}</td>
              {r.round === "dnq" ? (
                <td className="num muted" colSpan={5}>–</td>
              ) : (
                <>
                  <td className="num">{r.p}</td>
                  <td className="num">{r.w}</td>
                  <td className="num">{r.d}</td>
                  <td className="num">{r.l}</td>
                  <td className="num">{r.gf}:{r.ga}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MomenteView({ lang }: { lang: Lang }) {
  const h = vhist(lang);
  const list = [...MOMENTS].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <>
      <SiteHeader lang={lang} path="/vatreni-momente" />
      <main lang={lang} className="container page-fan">
        <section className="card" aria-labelledby="vm-h">
          <h1 id="vm-h" className="h1">🔥 {h.m.h1}</h1>
          <p className="intro">{h.m.intro}</p>
          <ul className="vm-medals" aria-label={h.m.medals}>
            {h.m.medalList.map((x) => (
              <li key={x.t} className="vm-medal">
                <span className="vm-medal-e" aria-hidden="true">{x.e}</span>
                <strong>{x.t}</strong>
                <span className="small muted">{x.s}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card" aria-labelledby="vm-tl">
          <h2 id="vm-tl">📜 {h.m.timeline}</h2>
          <ol className="vm-timeline">
            {list.map((m) => {
              const yt = momentYoutubeId(m);
              const txt = m[lang];
              const year = m.date.slice(0, 4);
              return (
                <li key={m.date} className="vm-item" id={`m-${m.date}`}>
                  <p className="eyebrow">
                    <time dateTime={m.date}>{dayLabel(m.date, lang)} {year}{lang === "hr" ? "." : ""}</time> · {placeLabel(m.place, lang)}
                  </p>
                  <h3 className="vm-title">{txt.title}</h3>
                  {m.score && <p className="otd-score">{scoreLabel(m.score, lang)}</p>}
                  <p className="vm-text">{txt.text}</p>
                  <p className="small">
                    <a href={m.source} target="_blank" rel="noopener noreferrer" className="muted">{h.m.source}: Wikipedia ↗</a>
                  </p>
                  {yt ? (
                    <div className="vm-video">
                      <ClipPlayer id={yt} title={txt.title} load={h.m.video} />
                    </div>
                  ) : m.clip ? (
                    <p className="small">
                      <a href={m.clip.url} target="_blank" rel="noopener noreferrer" className="otd-clip">{h.m.clipLink(m.clip.by)}</a>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <p className="footnote">{h.m.videoNote}</p>
        </section>

        <section className="card" aria-labelledby="vm-rec">
          <h2 id="vm-rec">🏟️ {h.m.record}</h2>
          <RecordTable rows={WORLD_CUPS} h={h} lang={lang} title={`🌍 ${h.m.wc}`} />
          <RecordTable rows={EUROS} h={h} lang={lang} title={`🇪🇺 ${h.m.euro}`} />
          <p className="footnote">
            {h.m.recordNote} <a href={WP_TEAM} target="_blank" rel="noopener noreferrer">Wikipedia ↗</a>
          </p>
          <p className="more-link">
            <Link href={href(lang, "/kroatien-in-zahlen")}>{h.m.more}</Link>
          </p>
          <p className="more-link">
            <Link href={href(lang, "/quiz#momente-quiz")}>{lang === "hr" ? "🧠 Testiraj se: kviz trenuci i rekordi →" : "🧠 Teste dich: Quiz Momente & Rekorde →"}</Link>
          </p>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
