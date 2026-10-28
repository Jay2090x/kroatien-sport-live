import Link from "next/link";
import { clipTitle } from "@/lib/clip-title";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveTicker } from "@/components/fan/live-ticker";
import { ClipPlayer } from "@/components/highlights";
import { JsonLd, breadcrumbs } from "@/components/json-ld";
import { getTicker, LIVE_WINDOW, type Ticker, type TickerEvent } from "@/lib/sources/live";
import { clipForMatch } from "@/lib/sources/vatreni-matches";
import { fan } from "@/lib/fan/i18n";
import { x2 } from "@/lib/fan/i18n2";
import { dataLabel, dict, href, localeOf, type Lang } from "@/lib/i18n";
import { formatKickoff } from "@/lib/time";
import { badgeFor } from "@/lib/club-badge";
import { SITE } from "@/lib/site";
import { Countdown } from "@/components/countdown";
import { MatchH2H } from "@/components/match-h2h";

const CRO = "477";

function list(evs: TickerEvent[], fmt: (e: TickerEvent) => string, none: string) {
  return evs.length ? evs.map(fmt).join(", ") : none;
}

function Summary({ tk, lang }: { tk: Ticker; lang: Lang }) {
  const X = x2(lang).match;
  const name = (id: string | null) =>
    id === tk.home.id ? dataLabel(tk.home.name, lang) : id === tk.away.id ? dataLabel(tk.away.name, lang) : "";
  const goals = tk.events.filter((e) => e.kind === "goal" || e.kind === "penalty");
  const own = tk.events.filter((e) => e.kind === "owngoal");
  const miss = tk.events.filter((e) => e.kind === "pen-miss");
  const cards = tk.events.filter((e) => e.kind === "yellow" || e.kind === "red");
  const subs = tk.events.filter((e) => e.kind === "sub");
  const side = (id: string) => goals.filter((e) => e.teamId === id);
  const g = (e: TickerEvent) => `${e.names[0] ?? "?"} ${e.minute}${e.kind === "penalty" ? ` (${X.penShort})` : ""}`;
  return (
    <dl className="msum">
      <dt>⚽ {X.scorers}</dt>
      <dd>
        <span className="msum-side"><strong>{name(tk.home.id)}:</strong> {list(side(tk.home.id), g, X.none)}</span>
        <span className="msum-side"><strong>{name(tk.away.id)}:</strong> {list(side(tk.away.id), g, X.none)}</span>
        {own.length > 0 && (
          <span className="msum-side">
            <strong>{x2(lang).team.ownGoal}:</strong> {list(own, (e) => `${e.names[0] ?? "?"} ${e.minute} (${X.ownGoalShort})`, X.none)}
          </span>
        )}
      </dd>
      <dt>✖ {X.missedPens}</dt>
      <dd>{list(miss, (e) => `${e.names[0] ?? "?"} ${e.minute} (${name(e.teamId)})`, X.none)}</dd>
      <dt>🟨🟥 {X.cards}</dt>
      <dd>
        {list(cards, (e) => `${e.kind === "red" ? "🟥" : "🟨"} ${e.names[0] ?? "?"} ${e.minute} (${name(e.teamId)})`, X.none)}
      </dd>
      <dt>🔁 {X.subs}</dt>
      <dd>{list(subs, (e) => `${e.minute} ${e.names[0] ?? "?"} ↔ ${e.names[1] ?? "?"} (${name(e.teamId)})`, X.none)}</dd>
    </dl>
  );
}

export async function loadMatch(id: string) {
  if (!/^\d{3,12}$/.test(id)) return null;
  return getTicker(id);
}

export function matchJsonLd(tk: Ticker, lang: Lang, url: string) {
  const status = tk.state === "post" ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled";
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${tk.home.name} – ${tk.away.name}`,
    sport: "Soccer",
    startDate: tk.kickoff,
    eventStatus: status,
    url,
    inLanguage: lang,
    ...(tk.venue ? { location: { "@type": "Place", name: tk.venue } } : {}),
    homeTeam: { "@type": "SportsTeam", name: tk.home.name },
    awayTeam: { "@type": "SportsTeam", name: tk.away.name },
    competitor: [
      { "@type": "SportsTeam", name: tk.home.name },
      { "@type": "SportsTeam", name: tk.away.name },
    ],
    superEvent: { "@type": "SportsEvent", name: tk.competition },
  };
}

export async function MatchView({ id, lang }: { id: string; lang: Lang }) {
  const t = dict(lang);
  const L = fan(lang).live;
  const X = x2(lang).match;
  const tk = await loadMatch(id);
  if (!tk) notFound();
  const croHome = tk.home.id === CRO;
  const clipRaw = tk.state === "post" ? await clipForMatch(tk.kickoff, croHome) : null;
  const clip = clipRaw ? { ...clipRaw, title: clipTitle(clipRaw, lang) } : null;
  const k = Date.parse(tk.kickoff);
  const now = Date.now();
  const live = now >= k - LIVE_WINDOW.before && now <= k + LIVE_WINDOW.after;
  const path = `/vatreni/spiel/${tk.eventId}`;
  const url = `${SITE.url}${href(lang, path)}`;
  const names = { home: dataLabel(tk.home.name, lang), away: dataLabel(tk.away.name, lang) };

  return (
    <>
      <JsonLd
        data={[
          matchJsonLd(tk, lang, url),
          breadcrumbs([
            { name: SITE.name, url: `${SITE.url}${href(lang, "/")}` },
            { name: X.list, url: `${SITE.url}${href(lang, "/vatreni")}` },
            { name: `${names.home} – ${names.away}`, url },
          ]),
        ]}
      />
      <SiteHeader lang={lang} path={path} />
      <main lang={lang} className="container page-fan page-match">
        <nav className="crumbs small" aria-label="Breadcrumb">
          <Link href={href(lang, "/")}>{SITE.name}</Link> › <Link href={href(lang, "/vatreni")}>{X.list}</Link> ›{" "}
          <span>{names.home} – {names.away}</span>
        </nav>
        <section className="card" aria-labelledby="m-h">
          <div className="card-head">
            <h1 id="m-h" className="h1">
              {names.home} – {names.away}
            </h1>
            <Link href={href(lang, "/vatreni")} className="pill">← {X.list}</Link>
          </div>
          <p className="meta">
            <time dateTime={tk.kickoff}>{formatKickoff(tk.kickoff, lang)} {t.oclock}</time> · {dataLabel(tk.competition, lang)}
            {tk.venue ? ` · ${tk.venue}` : ""}
          </p>
          {tk.state === "pre" && (
            <div className="match-countdown" aria-label={t.countdown.label}>
              <Countdown kickoff={tk.kickoff} t={t.countdown} />
            </div>
          )}
          {tk.state === "pre" && (
            <p className="small muted">
              {X.pre} <Link href={href(lang, "/live")}>{X.toLive} →</Link>
            </p>
          )}
        </section>

        {tk.state !== "pre" && (
          <section className="card" aria-labelledby="sum-h">
            <h2 id="sum-h">{X.summary}</h2>
            <Summary tk={tk} lang={lang} />
          </section>
        )}

        {tk.state === "post" && (
          <section className="card" aria-labelledby="clip-h">
            <h2 id="clip-h">🎬 {X.clip}</h2>
            {clip ? (
              <div className="clip clip-single">
                <p className="clip-title">
                  <a href={`https://www.youtube.com/watch?v=${clip.id}`} target="_blank" rel="noopener noreferrer">{clip.title}</a>
                </p>
                <p className="footnote">{X.clipNote}</p>
                <ClipPlayer id={clip.id} title={clip.title} load={X.clipLoad} />
              </div>
            ) : (
              <p className="muted small">{X.noClip}</p>
            )}
          </section>
        )}

        {tk.state === "pre" && (
          <section className="card" aria-labelledby="sq-h">
            <h2 id="sq-h">👕 {lang === "hr" ? "Igrači i forma" : "Kader & Form"}</h2>
            <p className="small">
              {lang === "hr"
                ? "Službeni sastav HNS objavljuje prije utakmice; postava slijedi oko 1 sat prije početka (gore u najavi). Do tada: kako igraju igrači iz zadnjeg sastava?"
                : "Den offiziellen Kader gibt der HNS vor dem Spiel bekannt, die Aufstellung folgt etwa 1 Std. vor Anpfiff (unten in der Vorschau). Bis dahin: Wie spielen die Spieler aus dem letzten Aufgebot?"}
            </p>
            <p className="more-link">
              <Link href={href(lang, "/spieler")}>{lang === "hr" ? "👟 Igrači – zadnja i sljedeća utakmica →" : "👟 Spieler – letztes & nächstes Spiel →"}</Link>
              {" "}
              <Link href={href(lang, "/legionaere")}>{lang === "hr" ? "🌍 Legionari ovog vikenda →" : "🌍 Legionäre am Wochenende →"}</Link>
            </p>
          </section>
        )}

        <section className="card" aria-labelledby="rep-h">
          <h2 id="rep-h">{tk.state === "pre" ? X.preview : X.report}</h2>
          <LiveTicker
            initial={tk}
            labels={L}
            locale={localeOf(lang)}
            names={names}
            badges={{ home: badgeFor(tk.home.name), away: badgeFor(tk.away.name) }}
            poll={live}
            oclock={t.oclock}
          />
        </section>
        <MatchH2H opponentDe={croHome ? tk.away.name : tk.home.name} lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
