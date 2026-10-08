import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SportRow } from "@/components/sport-item";
import { NoData, Stand } from "@/components/stand";
import { getSport } from "@/lib/sources/sport";
import { SPORT_EMOJI } from "@/lib/sport-meta";
import { formatKickoff, formatShortDate } from "@/lib/time";

/** ISR jede Minute; Quellen 1 h gecacht (10 min rund um Termine), siehe sport.ts. */
export const revalidate = 60;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Andere Sportarten – Kroatien",
  description:
    "Kroatische Athletinnen, Athleten und Teams abseits des Fußballs: MMA, Tennis, Basketball, Handball – Termine, Ergebnisse und Schlagzeilen.",
  alternates: { canonical: "/sport" },
};

function dateRange(from: string, to: string) {
  return `${formatShortDate(`${from}T12:00:00Z`)}–${formatShortDate(`${to}T12:00:00Z`)}`;
}

export default async function SportPage() {
  const data = await getSport();

  return (
    <>
      <SiteHeader current="sport" />
      <main className="container page-spieler">
        <section className="card" aria-labelledby="sport-h">
          <div className="card-head">
            <h1 id="sport-h" className="h1">Andere Sportarten</h1>
            <Link href="/" className="pill">← Start</Link>
          </div>
          <p className="intro">
            Kroatische Athletinnen, Athleten und Teams abseits des Fußballs – Termine, Ergebnisse und Schlagzeilen.
          </p>
          {data ? <Stand fetchedAt={data.fetchedAt} source="ESPN, TheSportsDB, EHF, HRT" /> : <NoData what="Andere Sportarten" />}
        </section>

        {data && (
          <div className="grid grid-tight">
            {data.fighters.map((f) => (
              <section key={f.name} className="card" aria-labelledby={`f-${f.name}`}>
                <div className="card-head">
                  <h2 id={`f-${f.name}`}>🥊 {f.name}</h2>
                  <span className="pill">{f.org}</span>
                </div>
                <h3>Nächster Kampf</h3>
                {f.next ? (
                  <ul className="sis">
                    <SportRow item={f.next} showWho={false} />
                  </ul>
                ) : (
                  <p className="teaser-line">Noch kein Kampf angekündigt.</p>
                )}
                <h3>Letzter Kampf</h3>
                {f.last ? (
                  <ul className="sis">
                    <SportRow item={{ ...f.last, vs: `vs. ${f.last.vs}` }} showWho={false} />
                  </ul>
                ) : (
                  <p className="muted">derzeit keine Daten</p>
                )}
                <Stand fetchedAt={f.fetchedAt} source="ESPN" />
              </section>
            ))}

            <section className="card" aria-labelledby="up-h">
              <div className="card-head">
                <h2 id="up-h">📅 Demnächst</h2>
              </div>
              {data.upcoming.length ? (
                <ul className="sis">
                  {data.upcoming.map((i) => (
                    <SportRow key={i.key} item={i} />
                  ))}
                </ul>
              ) : (
                <p className="muted">Derzeit keine Termine in den nächsten 14 Tagen.</p>
              )}
            </section>

            <section className="card" aria-labelledby="nt-h">
              <div className="card-head">
                <h2 id="nt-h">🇭🇷 Nationalteams</h2>
              </div>
              {data.national.length ? (
                <ul className="sis">
                  {data.national.map((i) => (
                    <SportRow key={i.key} item={i} />
                  ))}
                </ul>
              ) : (
                <p className="muted">Derzeit keine angesetzten Spiele bekannt.</p>
              )}
              {data.tournaments.map((t) => (
                <div key={t.title}>
                  <h3>
                    {SPORT_EMOJI[t.sport]} {t.title} · {dateRange(t.from, t.to)} · {t.where}
                  </h3>
                  <ul className="sis">
                    {t.games.map((g) => (
                      <li key={g.start} className="si">
                        <span className="si-emoji" aria-hidden="true">
                          {SPORT_EMOJI[t.sport]}
                        </span>
                        <div className="si-body">
                          <p className="si-title">
                            {g.home} – {g.away}
                          </p>
                          <p className="si-meta">
                            <time className="si-when" dateTime={g.start}>
                              {formatKickoff(g.start)} Uhr
                            </time>
                            {g.note ? <span> · {g.note}</span> : null}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="footnote">
                    Quelle:{" "}
                    <a href={t.url} rel="noopener" target="_blank">
                      {t.source}
                    </a>
                  </p>
                </div>
              ))}
            </section>

            <section className="card" aria-labelledby="res-h">
              <div className="card-head">
                <h2 id="res-h">✅ Ergebnisse</h2>
                <span className="pill">letzte Tage</span>
              </div>
              {data.results.length ? (
                <ul className="sis">
                  {data.results.map((i) => (
                    <SportRow key={i.key} item={i} />
                  ))}
                </ul>
              ) : (
                <p className="muted">Keine Ergebnisse aus den letzten Tagen.</p>
              )}
            </section>

            <section className="card" aria-labelledby="hl-h">
              <div className="card-head">
                <h2 id="hl-h">📰 Schlagzeilen</h2>
                <span className="pill">HRT Sport</span>
              </div>
              {data.headlines.length ? (
                <ul className="news news-single">
                  {data.headlines.map((h) => (
                    <li key={h.url}>
                      <a href={h.url} rel="noopener noreferrer" target="_blank">
                        {h.sport !== "other" ? `${SPORT_EMOJI[h.sport]} ` : ""}
                        {h.title}
                      </a>
                      <span className="news-meta">
                        HRT · <time dateTime={h.publishedAt}>{formatKickoff(h.publishedAt)} Uhr</time>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">Keine aktuellen Schlagzeilen.</p>
              )}
            </section>

            <section className="card notes span-2" aria-label="Hinweise zu den Daten">
              <h2 className="pgroup-h">Hinweise</h2>
              <ul>
                <li>
                  <strong>MMA:</strong> Kampftermine nur, wenn ESPN einen Kampf führt; sonst „noch kein Kampf
                  angekündigt“. Gerüchte werden nicht angezeigt.
                </li>
                <li>
                  <strong>Tennis:</strong> alle Matches mit kroatischer Beteiligung (Länderkennung bei ESPN) in laufenden
                  ATP- und WTA-Turnieren. Bei kommenden Matches nur das Datum – Tennis-Uhrzeiten hängen vom Spielverlauf
                  davor ab und sind vorab nicht verlässlich.
                </li>
                <li>
                  <strong>Handball &amp; Basketball (Teams):</strong> nächste Klubspiele und Basketball-Länderspiele über
                  TheSportsDB, Handball-Länderspiele aus dem offiziellen EHF-Spielplan. Ergebnisse dieser Teams zeigen
                  wir nicht, weil die kostenlose Schnittstelle sie unvollständig liefert – siehe Schlagzeilen.
                </li>
                <li>
                  <strong>Schlagzeilen:</strong> nur Meldungen mit Bezug zu kroatischen Athletinnen, Athleten oder Teams
                  (Stichwortliste), höchstens 8.
                </li>
                <li>
                  Für Wasserball, Ski-Weltcup und Leichtathletik gibt es derzeit keine verlässliche kostenlose
                  Datenquelle; diese Sportarten erscheinen nur in den Schlagzeilen.
                </li>
                {data.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
