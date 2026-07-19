# Kroatien Sport Live

Moderne, SEO-freundliche Next.js-15-Website für **kroatische Fußballspieler und Spiele** – Live-Ergebnisse, Player-Tracker, TV-Tipps und Web-Push.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · shadcn-style UI · Supabase · next-intl · Vercel

---

## Features

- Sticky Navbar mit Šahovnica-Logo, Suche, Theme-Toggle, Settings
- Hero mit Live-Stats und CTAs
- Dashboard: Live/Upcoming Matches, Filter-Chips, Datum-Filter, Match-Cards, TV-Modal
- Player-Tracker: Grid, Klick filtert Matches, nächste Spiele
- Upcoming-Kalender (Listen-View)
- TV & Streams (HRT, Sky, DAZN, …) + VPN-Affiliate mit Disclosure
- Settings: API-Keys (localStorage + optional Supabase)
- Hybrid-Daten: Free APIs + Fallback (Juli 2026, u. a. Modrić @ AC Milan)
- i18n: Deutsch primär, Englisch unter `/en`
- SEO: Metadata, sitemap, robots
- Cron-Refresh: `/api/refresh` (Vercel Cron alle 15 Min.)

---

## Schnellstart (lokal)

### Voraussetzungen

- Node.js 20+
- npm 10+
- Optional: Supabase-Projekt

### Installation

```bash
cd kroatien-sport-live
cp .env.example .env.local
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

Ohne Supabase/API-Keys laufen **Fallback-Daten** (Demo-Spiele + Spieler) – die Seite ist sofort nutzbar.

### Scripts

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Dev-Server (Turbopack) |
| `npm run build` | Production Build |
| `npm run start` | Production Server |
| `npm run lint` | ESLint |

---

## Umgebungsvariablen

Siehe `.env.example`. Wichtigste Keys:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
THESPORTSDB_API_KEY=3
FOOTBALL_DATA_API_KEY=
CRON_SECRET=langer-zufallsstring
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
```

---

## Supabase einrichten

1. Projekt auf [supabase.com](https://supabase.com) anlegen  
2. SQL aus `supabase/migrations/001_init.sql` im SQL Editor ausführen  
3. Optional `supabase/seed.sql`  
4. Keys in `.env.local` eintragen  
5. Für Live-Updates: **Database → Replication → `matches`** für Realtime aktivieren  
6. Daten aktualisieren:

```bash
curl -X POST http://localhost:3000/api/refresh \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## API-Routen

| Route | Methode | Zweck |
|-------|---------|--------|
| `/api/matches` | GET | Matches JSON |
| `/api/players` | GET | Players JSON |
| `/api/refresh` | POST/GET | Externe APIs → Supabase |
| `/api/settings` | POST | Settings (Auth optional) |
| `/api/notifications` | POST | OneSignal / Push |

---

## Vercel Deployment

1. Repo zu GitHub pushen  
2. [vercel.com](https://vercel.com) → Import Project  
3. Env-Vars aus `.env.example` setzen  
4. Deploy  

`vercel.json` enthält:

- Region `fra1` (EU)
- Cron alle 15 Min. auf `/api/refresh`
- Security Headers

**Cron-Auth:** In Production `CRON_SECRET` setzen. Vercel Cron sendet den Request an den Pfad; ergänze bei Bedarf Auth-Header in deinem Cron-Setup oder nutze Vercel’s `CRON_SECRET` Pattern.

---

## Projektstruktur

```
src/
  app/
    [locale]/          # i18n Seiten (de/en)
    api/                # Route Handlers
    actions/            # Server Actions
  components/
    ui/                 # Button, Card, Dialog, …
    layout/             # Navbar, Hero, Footer
    matches/            # Dashboard, Cards, Modal, Calendar
    players/            # Player-Tracker
    tv/                 # TV & Streams
    settings/           # Settings Modal
  lib/
    data/               # Fallback + Service
    api/                # TheSportsDB, football-data.org
    supabase/           # Browser + Server Clients
    notifications/      # Web Push / OneSignal
  i18n/                 # next-intl Routing
  types/                # TypeScript Typen
messages/               # de.json, en.json
supabase/migrations/    # SQL Schema
```

---

## Design

- Dark Mode Default (`next-themes`)
- Kroatische Farben: Rot `#c8102e`, dezente Šahovnica
- Premium Sport-Look (Sofascore/OneFootball-inspiriert)
- Mobile-first, Focus-States, `prefers-reduced-motion`

---

## Erweiterungen (Hooks im Code)

- Weitere Sportarten: Typen in `src/types`, Fallback-Daten ergänzen  
- Echte Live-Scores: API-Keys + Mapping in `src/lib/api/sports.ts`  
- Supabase Realtime: Kommentar in `src/lib/notifications/push.ts`  
- Auth: Supabase Auth + `user_settings` RLS  
- Graphite/E2E: Playwright Tests ergänzen  

---

## Lizenz & Disclaimer

Keine illegalen Streams. TV-Links führen zu offiziellen Anbietern.  
VPN-Empfehlungen können Affiliate-Links sein (klar ausgewiesen).

© Kroatien Sport Live
