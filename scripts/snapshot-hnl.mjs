#!/usr/bin/env node
/**
 * Schreibt einen Schnappschuss der SuperSport-HNL-Spiele (TheSportsDB, Free-Key "123")
 * nach `hnl-snapshot.json` (bzw. Pfad aus argv[2]).
 *
 * Läuft per GitHub Action (.github/workflows/hnl-snapshot.yml) alle 30 Minuten und
 * legt die Datei auf dem Branch `data` ab. Die Seite liest sie von dort, wenn
 * TheSportsDB direkt aus Vercel heraus nicht (vollständig) erreichbar ist –
 * z. B. wegen HTTP 429 (Rate-Limit) oder Timeouts.
 *
 * Hier gibt es kein Zeitlimit: Requests laufen nacheinander, mit Wartezeit und
 * Wiederholung bei 429/5xx/Timeouts. Bei unvollständigen Daten wird NICHTS
 * geschrieben (Exit 1) – der letzte gute Schnappschuss bleibt dann bestehen.
 */
import { writeFile } from "node:fs/promises";

const TSDB = "https://www.thesportsdb.com/api/v1/json/123";
const LEAGUE = "4629";
const ROUNDS_PER_SEASON = 36;
const UA = "KroatienSportLive-snapshot/1.0 (kroatien-sport-live.vercel.app)";
const OUT = process.argv[2] ?? "hnl-snapshot.json";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 6) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20_000);
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) return await res.json();
      last = new Error(`HTTP ${res.status} ${url}`);
      if (res.status !== 429 && res.status < 500) break;
      const ra = Number(res.headers.get("retry-after"));
      await sleep(Number.isFinite(ra) && ra > 0 ? Math.min(ra, 90) * 1000 : 15_000 * (i + 1));
      continue;
    } catch (err) {
      last = err;
    }
    await sleep(5_000 * (i + 1));
  }
  throw last;
}

const pause = () => sleep(1_500); // freundlich zum Free-Key (Rate-Limit pro Minute)

const season = (await getJson(`${TSDB}/lookupleague.php?id=${LEAGUE}`)).leagues?.[0]?.strCurrentSeason;
if (!/^\d{4}-\d{4}$/.test(season ?? "")) throw new Error(`no current season: ${season}`);
await pause();
const nextRaw = Number((await getJson(`${TSDB}/eventsnextleague.php?id=${LEAGUE}`)).events?.[0]?.intRound);
const nextRound = Number.isFinite(nextRaw) && nextRaw > 0 ? nextRaw : 0;
const current = nextRound === 0 ? ROUNDS_PER_SEASON : Math.min(ROUNDS_PER_SEASON, nextRound);

const KEEP = [
  "idEvent", "strHomeTeam", "strAwayTeam", "intHomeScore", "intAwayScore", "intRound",
  "strTimestamp", "dateEvent", "strTime", "strStatus", "strPostponed",
];
const events = [];
for (let r = 1; r <= current; r++) {
  await pause();
  const evs = (await getJson(`${TSDB}/eventsround.php?id=${LEAGUE}&r=${r}&s=${season}`)).events ?? [];
  if (!evs.length) throw new Error(`round ${r}: no events`);
  for (const e of evs) events.push(Object.fromEntries(KEEP.map((k) => [k, e[k] ?? null])));
}

const teams = new Set(events.flatMap((e) => [e.strHomeTeam, e.strAwayTeam]));
if (events.length < 5 || teams.size < 8 || teams.size > 12) {
  throw new Error(`implausible data: ${events.length} events, ${teams.size} teams`);
}

const snapshot = {
  source: "TheSportsDB",
  league: LEAGUE,
  season,
  nextRound,
  fetchedAt: new Date().toISOString(),
  events,
};
await writeFile(OUT, JSON.stringify(snapshot, null, 1) + "\n");
console.log(`HNL snapshot ${season}: ${events.length} events, rounds 1–${current}, next ${nextRound} → ${OUT}`);
