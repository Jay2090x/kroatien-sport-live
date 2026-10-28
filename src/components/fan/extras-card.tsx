import Link from "next/link";
import { fan } from "@/lib/fan/i18n";
import { href, type Lang } from "@/lib/i18n";
import { OnThisDay } from "./on-this-day";
import { inno } from "@/lib/innovation-i18n";

/**
 * Startseiten-Block: "Heute vor X Jahren" + drei Entdecken-Teaser mit Beschreibung.
 * Alle übrigen Seiten stehen im Hauptmenü und in der Footer-Sitemap (keine doppelte Linkliste mehr).
 */
export function ExtrasCard({ lang }: { lang: Lang }) {
  const f = fan(lang);
  const hr = lang === "hr";
  const teasers: Array<[string, string, string, string]> = hr
    ? [
        ["/vatreni-momente", "🔥", "Trenuci Vatrenih", "1998., 2018., 2022. – legendarne utakmice uz videe"],
        ["/quiz", "🧠", "Kviz o Vatrenima", "provjeri svoje znanje o reprezentaciji"],
        ["/kroatien-innovativ", "💡", "Hrvatska inovativna", inno(lang).teaser],
      ]
    : [
        ["/vatreni-momente", "🔥", "Vatreni-Momente", "1998, 2018, 2022 – die legendären Spiele mit Videos"],
        ["/quiz", "🧠", "Vatreni-Quiz", "Teste dein Wissen über die Nationalmannschaft"],
        ["/kroatien-innovativ", "💡", "Kroatien innovativ", inno(lang).teaser],
      ];
  return (
    <section id="extras" className="card span-2 extras" aria-labelledby="extras-h">
      <div className="card-head">
        <h2 id="extras-h">{hr ? "Na današnji dan" : "An diesem Tag"}</h2>
        <span className="pill">{f.extras.pill}</span>
      </div>
      <div className="extras-cols">
        <OnThisDay lang={lang} />
        <div className="discover">
          <p className="nav-gtitle">{hr ? "Otkrij" : "Entdecken"}</p>
          {teasers.map(([p, icon, title, text]) => (
            <Link key={p} href={href(lang, p)} className="discover-link">
              <span aria-hidden="true">{icon}</span>
              <span>
                <strong>{title}</strong>
                <span className="discover-text">{text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <p className="footnote">{f.onThisDay.note}</p>
    </section>
  );
}
