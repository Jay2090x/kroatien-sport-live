import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NoData } from "@/components/stand";
import { Countdown } from "@/components/countdown";
import { LiveTicker } from "@/components/fan/live-ticker";
import { getLiveOverview, getTicker, type Ticker } from "@/lib/sources/live";
import { fan } from "@/lib/fan/i18n";
import { dataLabel, dict, href, localeOf, type Lang } from "@/lib/i18n";
import { formatKickoff } from "@/lib/time";
import { Club } from "@/components/club-badge";
import { badgeFor } from "@/lib/club-badge";

function TickerBlock({ tk, lang, poll }: { tk: Ticker; lang: Lang; poll: boolean }) {
  const t = dict(lang);
  return (
    <LiveTicker
      initial={tk}
      labels={fan(lang).live}
      locale={localeOf(lang)}
      names={{ home: dataLabel(tk.home.name, lang), away: dataLabel(tk.away.name, lang) }}
      badges={{ home: badgeFor(tk.home.name), away: badgeFor(tk.away.name) }}
      poll={poll}
      oclock={t.oclock}
    />
  );
}

export async function LiveView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const L = fan(lang).live;
  const now = Date.now();
  const ov = await getLiveOverview(now);
  const [active, next, last] = await Promise.all([
    ov?.active ? getTicker(ov.active.eventId, now) : null,
    ov?.next && ov.next.eventId !== ov.active?.eventId ? getTicker(ov.next.eventId, now) : null,
    !ov?.active && ov?.last ? getTicker(ov.last.eventId, now) : null,
  ]);

  return (
    <>
      <SiteHeader lang={lang} path="/live" />
      <main className="container page-fan">
        <section className="card" aria-labelledby="live-h">
          <div className="card-head">
            <h1 id="live-h" className="h1">📡 {L.h1}</h1>
            <Link href={href(lang, "/#vatreni")} className="pill">← Vatreni</Link>
          </div>
          <p className="intro">{L.intro}</p>
        </section>

        {!ov ? (
          <section className="card">
            <NoData what={L.what} lang={lang} />
          </section>
        ) : (
          <>
            {ov.active && (
              <section className="card" aria-label={L.h1}>
                <div className="card-head">
                  <h2>🇭🇷 {active ? dataLabel(active.competition, lang) : L.h1}</h2>
                  <span className="pill pill-live">{t.live}</span>
                </div>
                {active ? <TickerBlock tk={active} lang={lang} poll /> : <NoData what={L.what} lang={lang} />}
              </section>
            )}

            {!ov.active && (
              <section className="card" aria-labelledby="next-h">
                <div className="card-head">
                  <h2 id="next-h">{L.next}</h2>
                </div>
                {next ? (
                  <div className="feature">
                    <p className="eyebrow">{dataLabel(next.competition, lang)}</p>
                    <p className="match-teams">
                      <span className={next.home.id === "477" ? "team team-cro" : "team"}>
                        <Club name={next.home.name}>{dataLabel(next.home.name, lang)}</Club>
                      </span>
                      <span className="vs">–</span>
                      <span className={next.away.id === "477" ? "team team-cro" : "team"}>
                        <Club name={next.away.name}>{dataLabel(next.away.name, lang)}</Club>
                      </span>
                    </p>
                    <p className="meta">
                      <time dateTime={next.kickoff}>
                        {formatKickoff(next.kickoff, lang)} {t.oclock}
                      </time>
                      {next.venue ? ` · ${next.venue}` : ""}
                    </p>
                    <Countdown kickoff={next.kickoff} t={t.countdown} />
                    <p className="small muted">{L.startsAt}</p>
                  </div>
                ) : ov.next ? (
                  <NoData what={L.what} lang={lang} />
                ) : (
                  <p className="muted">{L.noNext}</p>
                )}
              </section>
            )}

            {last && (
              <section className="card" aria-labelledby="recap-h">
                <div className="card-head">
                  <h2 id="recap-h">{L.recap}</h2>
                  <span className="pill">
                    {formatKickoff(last.kickoff, lang)} · {dataLabel(last.competition, lang)}
                  </span>
                </div>
                <TickerBlock tk={last} lang={lang} poll={false} />
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
