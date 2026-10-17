import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { europeCalendar, vatreniCalendar, type CalendarFeed } from "@/lib/fan/calendars";
import { fan } from "@/lib/fan/i18n";
import { dict, href, type Lang } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import { formatKickoff } from "@/lib/time";

function Feed({ title, path, feed, lang }: { title: string; path: string; feed: CalendarFeed | null; lang: Lang }) {
  const t = dict(lang);
  const C = fan(lang).calendar;
  const https = `${SITE.url}${path}`;
  const webcal = https.replace(/^https?:/, "webcal:");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  return (
    <section className="card" aria-label={title}>
      <div className="card-head">
        <h2>📅 {title}</h2>
        <span className="pill">.ics</span>
      </div>
      <p className="cal-buttons">
        <a className="btn" href={webcal}>{C.subscribe}</a>
        <a className="btn btn-ghost" href={google} rel="noopener" target="_blank">{C.google}</a>
      </p>
      <p className="small">
        {C.copy} <code className="cal-url">{https}</code>
      </p>
      <h3>{C.upcoming}</h3>
      {feed?.upcoming.length ? (
        <ul className="cal-list">
          {feed.upcoming.map((e) => (
            <li key={e.start + e.summary}>
              <time dateTime={e.start}>{formatKickoff(e.start, lang)} {t.oclock}</time> · {e.summary}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">{C.none}</p>
      )}
    </section>
  );
}

export async function KalenderView({ lang }: { lang: Lang }) {
  const F = fan(lang);
  const C = F.calendar;
  const [vat, eur] = await Promise.all([vatreniCalendar(lang), europeCalendar()]);
  return (
    <>
      <SiteHeader lang={lang} path="/kalender" />
      <main className="container page-fan">
        <section className="card" aria-labelledby="cal-h">
          <div className="card-head">
            <h1 id="cal-h" className="h1">📅 {C.h1}</h1>
            <Link href={href(lang, "/#extras")} className="pill">{F.back}</Link>
          </div>
          <p className="intro">{C.intro}</p>
        </section>
        <Feed title={C.vatreni} path={lang === "hr" ? "/kalender/vatreni-hr.ics" : "/kalender/vatreni.ics"} feed={vat} lang={lang} />
        <Feed title={C.europe} path="/kalender/europacup.ics" feed={eur} lang={lang} />
        <section className="card notes" aria-labelledby="how-h">
          <h2 id="how-h" className="pgroup-h">{C.howto}</h2>
          <ul>
            {C.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="footnote">{C.note}</p>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
