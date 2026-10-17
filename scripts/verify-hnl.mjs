#!/usr/bin/env node
/**
 * Prüft die aus TheSportsDB berechnete HNL-Tabelle gegen die Tabelle im
 * englischen Wikipedia-Artikel der laufenden Saison (CC BY-SA 4.0).
 *
 *   node scripts/verify-hnl.mjs
 *
 * Exit-Code 0 = identisch (Spiele, S/U/N, Tore, Punkte, Reihenfolge), 1 = Abweichung.
 */
const TSDB = "https://www.thesportsdb.com/api/v1/json/123";
const LEAGUE = "4629";
const UA = { "User-Agent": "KroatienSportLive-verify/1.0 (+https://kroatien-sport-live.vercel.app)" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// TheSportsDB-Free-Key: Rate-Limit (Stand 10/2026 ca. 10 Abrufe/Min.) → takten, bei 429 warten.
const getJson = async (url) => {
  if (url.includes("thesportsdb.com")) await sleep(6500);
  for (let i = 0; ; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res.json();
    if (res.status !== 429 || i >= 4) throw new Error(`HTTP ${res.status} ${url}`);
    await sleep(20000 * (i + 1));
  }
};

const season = (await getJson(`${TSDB}/lookupleague.php?id=${LEAGUE}`)).leagues[0].strCurrentSeason;
const next = Number((await getJson(`${TSDB}/eventsnextleague.php?id=${LEAGUE}`)).events?.[0]?.intRound) || 36;

const T = new Map();
const row = (t) => T.get(t) ?? (T.set(t, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }), T.get(t));
let postponed = [];
for (let r = 1; r <= next; r++) {
  const evs = (await getJson(`${TSDB}/eventsround.php?id=${LEAGUE}&r=${r}&s=${season}`)).events ?? [];
  for (const e of evs) {
    row(e.strHomeTeam);
    row(e.strAwayTeam);
    if (!["FT", "AET", "PEN"].includes(e.strStatus) || e.intHomeScore == null) {
      if (e.strStatus === "PST" || (Date.parse(e.strTimestamp + "Z") < Date.now() - 3 * 3600e3 && e.intHomeScore == null))
        postponed.push(`${e.strEvent} (R${r})`);
      continue;
    }
    const h = row(e.strHomeTeam), a = row(e.strAwayTeam);
    const hs = +e.intHomeScore, as = +e.intAwayScore;
    h.p++; a.p++; h.gf += hs; h.ga += as; a.gf += as; a.ga += hs;
    if (hs > as) { h.w++; a.l++; } else if (hs < as) { a.w++; h.l++; } else { h.d++; a.d++; }
  }
}
const pts = (x) => x.w * 3 + x.d;
const ours = [...T.values()].sort(
  (x, y) => pts(y) - pts(x) || y.gf - y.ga - (x.gf - x.ga) || y.gf - x.gf || x.team.localeCompare(y.team)
);

const [y1, y2] = season.split("-");
const page = `${y1}\u2013${y2.slice(2)}_Croatian_Football_League`;
const wp = await getJson(
  `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`
);
const w = wp.parse.wikitext;
const order = w.match(/\|team_order=([^\n]+)/)[1].split(",").map((s) => s.trim());
const updated = w.match(/\|update=([^\n|]+)/)?.[1]?.trim();
const val = (k, c) => Number(w.match(new RegExp(`\\|${k}_${c}\\s*=\\s*(\\d+)`))?.[1] ?? NaN);
const nameOf = (c) => w.match(new RegExp(`\\|name_${c}=\\[\\[[^|\\]]+\\|([^\\]]+)\\]\\]`))?.[1] ?? c;

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(g?hnk|nk)\s+/, "").split(" ")[0];
let ok = true;
console.log(`Saison ${season} · TSDB bis Runde ${next} · Wikipedia-Stand: ${updated}`);
console.log("Pl  Team (TSDB)               Sp  S  U  N  Tore   Pkt | Wikipedia");
order.forEach((code, i) => {
  const wpRow = { team: nameOf(code), w: val("win", code), d: val("draw", code), l: val("loss", code), gf: val("gf", code), ga: val("ga", code) };
  const o = ours[i];
  const same =
    o && norm(o.team) === norm(wpRow.team) && o.w === wpRow.w && o.d === wpRow.d && o.l === wpRow.l && o.gf === wpRow.gf && o.ga === wpRow.ga;
  if (!same) ok = false;
  console.log(
    `${String(i + 1).padStart(2)}  ${(o?.team ?? "-").padEnd(24)} ${String(o?.p).padStart(2)} ${String(o?.w).padStart(2)} ${String(o?.d).padStart(2)} ${String(o?.l).padStart(2)}  ${`${o?.gf}:${o?.ga}`.padEnd(6)} ${String(o ? pts(o) : "-").padStart(3)} | ${wpRow.team} ${wpRow.w}-${wpRow.d}-${wpRow.l} ${wpRow.gf}:${wpRow.ga} ${same ? "✓" : "✗ ABWEICHUNG"}`
  );
});
if (postponed.length) console.log("Verschoben/offen:", postponed.join("; "));
console.log(ok ? "OK – Tabelle stimmt mit Wikipedia überein." : "ABWEICHUNG – bitte prüfen (Wikipedia evtl. noch nicht aktualisiert).");
process.exit(ok ? 0 : 1);
