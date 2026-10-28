import { pickMoments } from "@/lib/fan/history";
import { fan } from "@/lib/fan/i18n";
import { dataLabel, localeOf, type Lang } from "@/lib/i18n";
import { viennaYmd } from "@/lib/time";
import { placeLabel } from "@/lib/fan/place-hr";

export function dayLabel(ymd: string, lang: Lang): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat(localeOf(lang), { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

/** Score-Zeile in HR: Ländernamen und "n. V./i. E." übersetzen. */
export function scoreLabel(s: string, lang: Lang): string {
  if (lang === "de") return s;
  return s
    .replace(/n\. V\./g, "prod.")
    .replace(/i\. E\./g, "pen.")
    .split(" – ")
    .map((part) => {
      const m = part.match(/^(.*?)( \d.*)?$/);
      return m ? `${dataLabel(m[1], lang)}${m[2] ?? ""}` : part;
    })
    .join(" – ");
}

/** "Heute vor X Jahren" – oder der nächste Jahrestag. */
export function OnThisDay({ lang, now = Date.now() }: { lang: Lang; now?: number }) {
  const f = fan(lang).onThisDay;
  const today = viennaYmd(new Date(now).toISOString());
  const pick = pickMoments(today);
  return (
    <div className="otd">
      {pick.moments.map((m) => {
        const years = Number(pick.on.slice(0, 4)) - Number(m.date.slice(0, 4));
        const txt = m[lang];
        return (
          <article key={m.date} className="otd-item">
            <p className="eyebrow">
              {pick.today ? f.today(years) : f.upcoming(dayLabel(pick.on, lang), years)} · {m.date.slice(0, 4)}
            </p>
            <h3 className="otd-title">{txt.title}</h3>
            {m.score && <p className="otd-score">{scoreLabel(m.score, lang)}</p>}
            <p className="otd-text">
              {txt.text} <span className="muted">({placeLabel(m.place, lang)})</span>
            </p>
            <p className="otd-links">
              {m.clip && (
                <a href={m.clip.url} rel="noopener" target="_blank" className="otd-clip">
                  {f.clip(m.clip.by)}
                </a>
              )}
              <a href={m.source} rel="noopener" target="_blank" className="muted small">
                {f.source}
              </a>
            </p>
          </article>
        );
      })}
    </div>
  );
}
