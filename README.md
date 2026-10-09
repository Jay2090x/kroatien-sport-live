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

## Andere Sportarten (`/sport`)

Kompakter Teaser auf der Startseite, Details unter `/sport`. Alle Athleten/Teams sind fest in
`src/lib/sport-meta.ts` mit stabilen Quell-IDs hinterlegt (kein Namens-Matching).

| Bereich | Quelle (kostenlos) | Inhalt |
|---|---|---|
| 🥊 MMA (Roberto Soldić) | ESPN Core API, Athlete-Eventlog | nächster angekündigter Kampf (sonst „noch kein Kampf angekündigt“), letzter Kampf mit Methode/Runde |
| 🎾 Tennis | ESPN ATP/WTA-Scoreboard (aktuell + vor 2 Tagen) | Kroatinnen/Kroaten (Ländercode `CRO`) in Einzel & Doppel; ESPN-Platzhaltertermine werden als „Termin noch offen“ angezeigt |
| 🏀 NBA (Zubac, Matković, Hezonja) | ESPN Athlete + Team-Schedule + Boxscore | nächstes Spiel (14 Tage), letztes Ergebnis (4 Tage) mit Minuten/Punkten |
| 🤾🏀 Nationalteams, RK Zagreb, RK Nexe | TheSportsDB (Free-Key) `eventsnext` | nächste Spiele; Uhrzeit erst ab 7 Tagen vorher, davor nur Datum |
| 🤾 Handball-WM 2027 | kuratiert (IHF-Spielplan via Wikipedia) | Gruppenspiele Kroatiens, verschwindet nach Turnierende |
| 📰 Schlagzeilen | HRT-Sport-RSS (Kategorien Košarka, Rukomet, Tenis, Više sportova, Vaterpolo) | nur Titel + Link |

Caching: 1 h Standard, 10 min an Event-Tagen, MMA/TSDB 3 h, Schlagzeilen 15 min; bei Fehlern
bleiben die letzten guten Daten stehen („Stand: …“).

Bewusste Lücken: keine Ergebnisse aus TheSportsDB (Free-Endpunkt liefert nur Heimspiele),
keine kroatischen Basketball-Klubs (TSDB-Spielpläne nachweislich falsch), keine Uhrzeiten
bei MMA, kein Wasserball/Ski/Leichtathletik (keine verlässliche freie Datenquelle – nur
HRT-Schlagzeilen).

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

## Zeitleiste, Sportfilter, Sprache (DE/HR), News & Highlights

- **Zeitleiste** (`src/lib/timeline.ts`, `src/components/timeline.tsx`): eine gemeinsame Liste für Start-Teaser und `/sport` – Fußball (Vatreni, HNL), MMA, Boxen, Tennis, NBA, Handball. Termine aufsteigend, Ergebnisse absteigend, gruppiert nach Tag (Wiener Zeit); ohne feste Uhrzeit am Tagesende („Uhrzeit offen“).
- **Sportfilter** (`src/components/sport-filter.tsx`): `?sport=fussball|mma|boxen|tennis|basketball|handball`, gilt für die ganze Seite (Zeitleiste, News, Highlights, Vatreni/HNL ein-/ausgeblendet). Inline-Skript + CSS verhindern Aufblitzen vor dem Hydrieren; Seiten bleiben statisch (ISR).
- **Sprache**: Deutsch unter `/…`, Kroatisch unter `/hr/…` (`src/lib/i18n.ts`). Umschalter im Header setzt Cookie `lang`; `src/middleware.ts` leitet bei `lang=hr` bzw. `?lang=hr` weiter. Schlagzeilen bleiben in Originalsprache.
- **Boxen** (`src/lib/sources/boxing.ts`): kuratiert + Wikipedia-Abgleich (neuerer Kampf auf Wikipedia wird automatisch übernommen).
- **News** (`src/lib/sources/news.ts`): 5 min Cache, max. 36 h alt (sonst Auffüllen bis 6), nur DE/HR, gereiht nach Interesse-Stichwörtern + Aktualität.
- **Highlights** (`src/lib/sources/videos.ts`): nur offizielle, einbettbare YouTube-Clips (HNS, MAXSport, UFC/Soldić), max. 7 Tage alt, Zwei-Klick-Einbettung über youtube-nocookie.com.
