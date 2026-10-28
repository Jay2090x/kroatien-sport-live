import Link from "next/link";
import { fan } from "@/lib/fan/i18n";
import { href, type Lang } from "@/lib/i18n";
import { OnThisDay } from "./on-this-day";

/** Kompakter Startseiten-Block: "Heute vor X Jahren" + Links zu den Fan-Extras. */
export function ExtrasCard({ lang }: { lang: Lang }) {
  const f = fan(lang);
  const L = f.extras.links;
  const links: Array<[string, string]> = [
    ["/legionaere", L.abroad],
    ["/legionaere#europacup", L.europe],
    ["/live", L.live],
    ["/em-2028", L.euro],
    ["/talente", L.talents],
    ["/kalender", L.calendar],
    ["/vatreni", lang === "hr" ? "📋 Utakmice Vatrenih" : "📋 Vatreni-Spielberichte"],
    ["/frauen", lang === "hr" ? "👩 Ženska reprezentacija" : "👩 Frauen-Nationalteam"],
    ["/u21", "🌱 U21"],
    ["/vatreni-momente", lang === "hr" ? "🔥 Trenuci Vatrenih" : "🔥 Vatreni-Momente"],
    ["/kroatien-in-zahlen", lang === "hr" ? "📊 Hrvatska u brojkama" : "📊 Kroatien in Zahlen"],
    ["/bilanz", lang === "hr" ? "🆚 Hrvatska protiv …" : "🆚 Kroatien gegen …"],
    ["/quiz", lang === "hr" ? "🧠 Kviz o Vatrenima" : "🧠 Vatreni-Quiz"],
  ];
  return (
    <section id="extras" className="card span-2 extras" aria-labelledby="extras-h">
      <div className="card-head">
        <h2 id="extras-h">⭐ {f.extras.title}</h2>
        <span className="pill">{f.extras.pill}</span>
      </div>
      <div className="extras-cols">
        <OnThisDay lang={lang} />
        <nav className="extras-links" aria-label={f.extras.title}>
          {links.map(([p, label]) => (
            <Link key={p} href={href(lang, p)}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="footnote">{f.onThisDay.note}</p>
    </section>
  );
}
