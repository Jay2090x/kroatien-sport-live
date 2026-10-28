import Link from "next/link";
import type { VatreniData } from "@/lib/sources/vatreni";
import { dict, href, type Lang } from "@/lib/i18n";
import { formatShortDate } from "@/lib/time";
import { LiveCard, NextCard, outcome } from "./vatreni-section";

/** Startseiten-Hero: laufendes bzw. nächstes Länderspiel groß, dazu die Form der letzten 5 Spiele. Nur vorhandene Daten. */
export function HomeHero({ data, lang }: { data: VatreniData; lang: Lang }) {
  const t = dict(lang);
  const m = data.live ?? data.next;
  if (!m) return null;
  const L = { S: t.win, U: t.draw, N: t.loss } as const;
  const SH = { S: t.winShort, U: t.drawShort, N: t.lossShort } as const;
  const form = data.last.slice(0, 5).map((x) => ({ x, o: outcome(x) })).filter((y) => y.o);
  const id = m.id.replace(/^espn-/, "");
  return (
    <section className="hero span-2" aria-label={data.live ? "Live" : t.vatreni.nextMatch}>
      <div className="hero-main">
        {data.live ? <LiveCard m={data.live} lang={lang} t={t} /> : <NextCard m={m} lang={lang} t={t} />}
      </div>
      <div className="hero-side">
        {form.length > 0 && (
          <div className="hero-form">
            <p className="hero-k">{lang === "hr" ? "Forma Vatrenih" : "Form der Vatreni"}</p>
            <ol className="form-strip" aria-label={form.map((y) => `${formatShortDate(y.x.kickoff, lang)}: ${L[y.o!]}`).join(", ")}>
              {[...form].reverse().map((y) => (
                <li key={y.x.id} className={`form-chip form-${y.o}`} title={`${y.x.home} ${y.x.homeScore}:${y.x.awayScore} ${y.x.away}`} aria-hidden="true">
                  {SH[y.o!]}
                </li>
              ))}
            </ol>
            <p className="hero-hint">{lang === "hr" ? "zadnjih 5 utakmica, najnovija desno" : "letzte 5 Spiele, neuestes rechts"}</p>
          </div>
        )}
        <div className="hero-cta">
          <Link className="btn btn-hero" href={href(lang, `/vatreni/spiel/${id}`)}>
            {data.live ? (lang === "hr" ? "Live ticker →" : "Zum Live-Ticker →") : lang === "hr" ? "Najava i svi dvoboji →" : "Vorschau & alle Duelle →"}
          </Link>
          <Link className="btn btn-ghost" href={href(lang, "/kalender")}>
            📅 {lang === "hr" ? "Kalendar" : "Kalender"}
          </Link>
        </div>
      </div>
    </section>
  );
}
