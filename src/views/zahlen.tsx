import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CAPS, SCORERS, WP_TEAM, vhist } from "@/lib/vatreni-history-i18n";
import { href, type Lang } from "@/lib/i18n";

function Tiles({ items, label }: { items: { big: string; label: string; text: string; url: string }[]; label: string }) {
  return (
    <ul className="vz-tiles">
      {items.map((t) => (
        <li key={t.label} className="vz-tile">
          <p className="vz-big">{t.big}</p>
          <p className="vz-label">{t.label}</p>
          <p className="small">{t.text}</p>
          <a className="small muted" href={t.url} target="_blank" rel="noopener noreferrer">{label}: Wikipedia ↗</a>
        </li>
      ))}
    </ul>
  );
}

export function ZahlenView({ lang }: { lang: Lang }) {
  const h = vhist(lang).z;
  const c = h.cols;
  const rank = <T extends { [k: string]: unknown }>(xs: T[], key: keyof T) =>
    xs.map((x, i) => ({ x, r: i > 0 && xs[i - 1][key] === x[key] ? null : i + 1 }));
  const fixRank = (rs: { r: number | null }[]) => {
    let last = 1;
    return rs.map((y) => (y.r == null ? last : (last = y.r)));
  };
  const caps = rank(CAPS, "caps");
  const capsR = fixRank(caps);
  const sc = rank(SCORERS, "goals");
  const scR = fixRank(sc);
  return (
    <>
      <SiteHeader lang={lang} path="/kroatien-in-zahlen" />
      <main className="container page-fan">
        <section className="card" aria-labelledby="vz-h">
          <h1 id="vz-h" className="h1">📊 {h.h1}</h1>
          <p className="intro">{h.intro}</p>
          <p className="small muted">{h.asOf}</p>
        </section>

        <section className="card" aria-labelledby="vz-t">
          <h2 id="vz-t">✨ {h.tilesH}</h2>
          <Tiles items={h.tiles} label={h.source} />
        </section>

        <section className="card" aria-labelledby="vz-c">
          <h2 id="vz-c">👕 {h.caps}</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th className="num">{c.rank}</th><th className="left">{c.name}</th><th className="num">{c.caps}</th><th className="num">{c.goals}</th><th className="num">{c.years}</th></tr>
              </thead>
              <tbody>
                {CAPS.map((p, i) => (
                  <tr key={p.name} className={i === 0 ? "lead" : undefined}>
                    <td className="num">{capsR[i]}</td>
                    <td className={`left${p.active ? " strong" : ""}`}>{p.name}</td>
                    <td className="num strong">{p.caps}</td>
                    <td className="num">{p.goals}</td>
                    <td className="num">{p.years}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">{h.activeNote}</p>
        </section>

        <section className="card" aria-labelledby="vz-s">
          <h2 id="vz-s">⚽ {h.scorers}</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th className="num">{c.rank}</th><th className="left">{c.name}</th><th className="num">{c.goals}</th><th className="num">{c.caps}</th><th className="num">{c.years}</th></tr>
              </thead>
              <tbody>
                {SCORERS.map((p, i) => (
                  <tr key={p.name} className={i === 0 ? "lead" : undefined}>
                    <td className="num">{scR[i]}</td>
                    <td className={`left${p.active ? " strong" : ""}`}>{p.name}</td>
                    <td className="num strong">{p.goals}</td>
                    <td className="num">{p.caps}</td>
                    <td className="num">{p.years}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">{h.activeNote}</p>
        </section>

        <section className="card" aria-labelledby="vz-o">
          <h2 id="vz-o">🤯 {h.oddH}</h2>
          <Tiles items={h.odd} label={h.source} />
          <p className="footnote">
            {h.note} <a href={WP_TEAM} target="_blank" rel="noopener noreferrer">Wikipedia ↗</a>
          </p>
          <p className="more-link">
            <Link href={href(lang, "/vatreni-momente")}>{h.more}</Link>
          </p>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
