import Link from "next/link";
import { dataLabel, href, type Lang } from "@/lib/i18n";
import { getCroScorersToday } from "@/lib/sources/scorers";

/** Startseite: kroatische Tore/Vorlagen der letzten 24 h (versteckt, wenn es keine gibt). */
export async function CroScorers({ lang }: { lang: Lang }) {
  const rows = await getCroScorersToday();
  if (!rows.length) return null;
  const hr = lang === "hr";
  const what = (w: string) => (w === "assist" ? (hr ? "asistencija" : "Vorlage") : w === "penalty" ? (hr ? "gol (11 m)" : "Tor (Elfmeter)") : hr ? "gol" : "Tor");
  return (
    <section className="card span-2 cro-scorers" aria-labelledby="cs-h">
      <div className="card-head">
        <h2 id="cs-h">{hr ? "Hrvatski strijelci danas" : "Kroatische Torschützen heute"}</h2>
        <span className="pill">{hr ? "zadnja 24 sata · ESPN" : "letzte 24 Std. · ESPN"}</span>
      </div>
      <ul className="cs-list">
        {rows.map((r, i) => (
          <li key={`${r.gameId}-${r.playerId}-${r.minute}-${i}`}>
            <Link href={href(lang, `/spiel/${r.league}/${r.gameId}`)} className="cs-row">
              <span className="cs-ic" aria-hidden="true">{r.what === "assist" ? "🅰️" : "⚽"}</span>
              <span className="cs-main">
                <strong>🇭🇷 {r.name}</strong> · {what(r.what)} {r.minute}
                <span className="cs-game">
                  {dataLabel(r.home, lang)} {r.homeScore ?? "–"}:{r.awayScore ?? "–"} {dataLabel(r.away, lang)} · {dataLabel(r.competition, lang)}
                  {r.live ? (hr ? " · uživo" : " · live") : ""}
                </span>
              </span>
              <span className="cs-go" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
