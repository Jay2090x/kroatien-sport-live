# Kroatien Sport Live

Schlanke Seite rund um den kroatischen Fußball – nur drei Bereiche:

1. **Vatreni** – nächstes Länderspiel mit Countdown, letzte 5 Ergebnisse, Nations-League-Gruppe
2. **SuperSport HNL** – Tabelle (aus Einzelergebnissen berechnet), aktuelle und letzte Runde, verschobene Spiele
3. **News** – max. 8 Schlagzeilen (Titel, Quelle, Zeit, Link zum Original)

Next.js 15 (App Router), komplett serverseitig gerendert, kein Datenbank-/Cron-/API-Key-Bedarf, läuft im Vercel-Hobby-Plan.

## Datenquellen (alle kostenlos, ohne Konto)

| Bereich | Quelle | Endpunkt |
|---|---|---|
| Länderspiele | ESPN (öffentlich, inoffiziell) | `site.api.espn.com/apis/site/v2/sports/soccer/all/teams/477/schedule` (+ `?fixture=true`) |
| Nations-League-Gruppe | ESPN | `site.api.espn.com/apis/v2/sports/soccer/uefa.nations/standings` |
| Fallback Länderspiele | OpenLigaDB | `api.openligadb.de/getmatchdata/nla/<Jahr>` |
| SuperSport HNL | TheSportsDB (Free-Key `123`) | `eventsround.php?id=4629&r=<Runde>&s=<Saison>` |
| News | HRT Sport RSS, Google News RSS | `feed.hrt.hr/sport/page.xml`, `news.google.com/rss/search?...` |

## Spielerseite (`/spieler`)

- **Kader:** alle Spieler aus den ESPN-Spieltagskadern der letzten Länderspielphase
  (Spiele bis 21 Tage vor dem letzten Länderspiel). Hinweise zu Absagen pflegt `SQUAD_NOTES`
  in `src/lib/players-meta.ts`; sie werden nur für genau diese Phase angezeigt.
- **Verein:** ESPN-Athletenprofil (`athlete.team.id`). Die Zuordnung läuft nur über IDs,
  nie über Namensähnlichkeit.
- **Spiele:** ESPN-Teamspielplan ohne Testspiele. HNL-Ligaspiele kommen von TheSportsDB;
  dort gibt es kostenlos keine Spielerdaten.
- **Einsatzdaten:** ESPN-Spielbericht (Kader, Wechsel, Karten, Tore, Vorlagen). Minuten werden
  ohne Nachspielzeit berechnet.
- **„Spielt er?“:** Ab 2 h vor Anpfiff wird der Spielbericht geprüft (Startelf, Bank, nicht im
  Kader). Vorher heißt es „Aufstellung noch nicht bekannt“.
- **Verletzungen:** Es gibt keine freie, verlässliche Quelle, daher werden keine angezeigt.
  Sperren erscheinen nur als Regel-Hinweis nach einer Roten Karte.
- **Cache:** 30 min, 5 min rund um einen Anpfiff; abgeschlossene Spielberichte 24 h.

## Aktualisierung & Caching

`src/lib/cache.ts` kapselt `unstable_cache` (Vercel Data Cache):

- Standard 10 min, **60 s im Fenster ±3 h um einen Kroatien-Anpfiff**, News 15 min, HNL 1 h
  (abgeschlossene ältere Runden 7 Tage, Runden mit Nachholspielen weiterhin stündlich)
- Die Startseite ist ISR mit `revalidate = 60`.
- Schlägt eine Quelle fehl, bleibt der letzte gute Stand stehen. Gibt es noch keinen, zeigt die
  Seite „derzeit keine Daten“. Es werden nie Daten erfunden. Jede Box zeigt „Stand: … Uhr“ (Wiener Zeit).

## Entwicklung

```bash
npm ci
npm run dev          # http://localhost:3000
npm run lint && npm run typecheck && npm run build
npm run verify:hnl   # vergleicht die berechnete HNL-Tabelle mit Wikipedia
```

## Rechtliches

Keine Logos, Fotos oder fremden Volltexte; Quellen werden im Footer genannt.
Impressum ohne Klarnamen (Kontakt per E-Mail, `NEXT_PUBLIC_CONTACT_EMAIL`).
