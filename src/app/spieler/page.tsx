import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlayerCard } from "@/components/player-card";
import { NoData, Stand } from "@/components/stand";
import { getPlayers, type PlayerRow } from "@/lib/sources/players";
import { POSITION_GROUP } from "@/lib/players-meta";
import { formatShortDate } from "@/lib/time";

/**
 * ISR jede Minute; die Quellen selbst sind 30 min gecacht (5 min rund um den
 * Anpfiff eines Spielers, abgeschlossene Spielberichte 24 h).
 */
export const revalidate = 60;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Spieler – letztes & nächstes Spiel",
  description:
    "Alle Spieler des aktuellen kroatischen Nationalkaders: letztes und nächstes Spiel mit Einsatzminuten, Wechseln, Toren und Karten.",
  alternates: { canonical: "/spieler" },
};

export default async function SpielerPage() {
  const data = await getPlayers();

  const groups = new Map<string, PlayerRow[]>();
  for (const p of data?.players ?? []) {
    const k = POSITION_GROUP[p.position]?.label ?? "Weitere";
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  return (
    <>
      <SiteHeader current="spieler" />
      <main className="container page-spieler">
        <section className="card" aria-labelledby="spieler-h">
          <div className="card-head">
            <h1 id="spieler-h" className="h1">Spieler</h1>
            <Link href="/#vatreni" className="pill">← Vatreni</Link>
          </div>
          {!data ? (
            <NoData what="Spielerdaten" />
          ) : (
            <>
              <p className="intro">
                Aktueller Kader: <strong>{data.players.length} Spieler</strong> aus den Spieltagskadern der{" "}
                {data.window.matches} Länderspiele vom {formatShortDate(data.window.from)} bis{" "}
                {formatShortDate(data.window.to)} (Quelle: ESPN).
              </p>
              {data.squadNote && (
                <p className="footnote">
                  {data.squadNote.text}{" "}
                  <a href={data.squadNote.url} rel="noopener" target="_blank">
                    Quelle: {data.squadNote.source}
                  </a>
                </p>
              )}
              <p className="legend">
                <span>⚽ Tor</span>
                <span><span className="cardicon cardicon-y" aria-hidden="true" /> Gelb</span>
                <span><span className="cardicon cardicon-r" aria-hidden="true" /> Rot</span>
                <span>Minuten ohne Nachspielzeit</span>
              </p>
              <Stand fetchedAt={data.fetchedAt} source="ESPN, TheSportsDB" />
            </>
          )}
        </section>

        {[...groups.entries()].map(([label, players]) => (
          <section key={label} className="pgroup" aria-label={label}>
            <h2 className="pgroup-h">{label}</h2>
            <div className="players">
              {players.map((p) => (
                <PlayerCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        ))}

        {data && (
          <section className="card notes" aria-label="Hinweise zu den Daten">
            <h2 className="pgroup-h">Hinweise</h2>
            <ul>
              <li>
                <strong>Ob ein Spieler spielt</strong>, steht erst mit der offiziellen Aufstellung fest (meist ca. 1 Std.
                vor Anpfiff). Vorher zeigen wir „Aufstellung noch nicht bekannt“ – es wird nichts geschätzt.
              </li>
              <li>
                <strong>Verletzungen:</strong> Dafür gibt es keine verlässliche kostenlose Datenquelle; sie werden daher
                nicht angezeigt. Sperren werden nur als Regel-Hinweis nach einer Roten Karte genannt.
              </li>
              <li>
                <strong>SuperSport HNL:</strong> Ergebnisse und Termine kommen von TheSportsDB; Einsatzdaten
                (Minuten, Wechsel, Karten) sind dort kostenlos nicht verfügbar.
              </li>
              <li>Testspiele von Vereinen werden nicht berücksichtigt. Alle Zeiten in Wiener Zeit.</li>
              {data.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
