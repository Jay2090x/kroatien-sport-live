import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NoData, Stand } from "@/components/stand";
import { AbroadGameRow } from "@/components/fan/abroad-game";
import { getEurope, getWeekend } from "@/lib/sources/abroad";
import { fan } from "@/lib/fan/i18n";
import { dataLabel, dict, href, type Lang } from "@/lib/i18n";
import { formatDay } from "@/lib/time";

export async function LegionaereView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const f = fan(lang).abroad;
  const now = Date.now();
  const [weekend, europe] = await Promise.all([getWeekend(now), getEurope(now)]);
  const lastDay = weekend ? new Date(Date.parse(weekend.to) - 3600_000).toISOString() : null;
  // Lücken aus der Spielerbasis sind deutsche Klartexte – in HR nur die übersetzbaren
  const gapText = (g: string) => (g.startsWith("clubs:") ? f.gapClubs(Number(g.slice(6))) : lang === "de" ? g : null);

  return (
    <>
      <SiteHeader lang={lang} path="/legionaere" current="legionaere" />
      <main lang={lang} className="container page-fan">
        <section className="card" aria-labelledby="leg-h">
          <div className="card-head">
            <h1 id="leg-h" className="h1">{f.h1}</h1>
            <Link href={href(lang, "/#extras")} className="pill">{fan(lang).back}</Link>
          </div>
          <p className="intro">{f.intro}</p>
        </section>

        <section id="wochenende" className="card" aria-labelledby="we-h">
          <div className="card-head">
            <h2 id="we-h">🌍 {f.weekend}</h2>
            {weekend && (
              <span className="pill">
                {weekend.current ? f.thisWeekend : f.nextWeekend} · {formatDay(weekend.from, lang)} – {formatDay(lastDay!, lang)}
              </span>
            )}
          </div>
          {!weekend ? (
            <NoData what={f.what} lang={lang} />
          ) : (
            <>
              {weekend.games.length ? (
                <ul className="ags">
                  {weekend.games.map((g) => (
                    <AbroadGameRow key={g.game.id} g={g} lang={lang} />
                  ))}
                </ul>
              ) : (
                <p className="muted">{f.noGames}</p>
              )}
              {weekend.idle.length > 0 && (
                <p className="small muted idle">
                  <strong>{f.idle}</strong> {weekend.idle.map((p) => `${p.name}${p.club ? ` (${p.club})` : ""}`).join(", ")}
                </p>
              )}
              <Stand fetchedAt={weekend.fetchedAt} source="ESPN" lang={lang} />
            </>
          )}
        </section>

        <section id="europacup" className="card" aria-labelledby="eu-h">
          <div className="card-head">
            <h2 id="eu-h">🏆 {f.europe}</h2>
            <span className="pill">UCL · UEL · UECL</span>
          </div>
          <p className="small">{f.europeIntro}</p>
          {!europe ? (
            <NoData what={f.whatEurope} lang={lang} />
          ) : (
            <>
              <p className="small">
                <strong>{f.clubsIn}</strong>{" "}
                {europe.clubs.length
                  ? europe.clubs.map((c) => `${c.name} (${dataLabel(c.competition, lang)})`).join(", ")
                  : f.noClubs}
              </p>
              {!europe.next && !europe.last && <p className="muted">{f.noEurope}</p>}
              {europe.next && (
                <>
                  <h3>{f.nextWeek(formatDay(europe.next.from, lang))}</h3>
                  <ul className="ags">
                    {europe.next.games.map((g) => (
                      <AbroadGameRow key={g.game.id} g={g} lang={lang} showClubTag />
                    ))}
                  </ul>
                </>
              )}
              {europe.last && (
                <>
                  <h3>{f.lastWeek(formatDay(europe.last.from, lang))}</h3>
                  <ul className="ags">
                    {europe.last.games.map((g) => (
                      <AbroadGameRow key={g.game.id} g={g} lang={lang} showClubTag />
                    ))}
                  </ul>
                </>
              )}
              <Stand fetchedAt={europe.fetchedAt} source="ESPN" lang={lang} />
            </>
          )}
        </section>

        <section className="card notes" aria-label={t.sport.notes}>
          <h2 className="pgroup-h">{t.sport.notes}</h2>
          <ul>
            {f.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            {[...(weekend?.gaps ?? [])].map(gapText).filter(Boolean).map((g) => (
              <li key={g!}>{g}</li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
