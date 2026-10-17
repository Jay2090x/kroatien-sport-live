#!/usr/bin/env node
/**
 * Spielerfotos auflösen (einmalig/bei Kaderänderung lokal ausführen, Ergebnis wird committet):
 *   node scripts/resolve-photos.mjs            → schreibt src/data/photos.json
 *
 * Ablauf je Person:
 *  1. Wikidata-Objekt über die ESPN-ID (P3681 Fußball, P3685 NBA, P10073 MMA)
 *     bzw. – bei Boxern ohne ESPN-ID – über den Wikipedia-Artikel.
 *     Fallback Namenssuche NUR mit Prüfung: Staatsangehörigkeit Kroatien (P27=Q224)
 *     UND Geburtsdatum = ESPN-Profil. Keine Übereinstimmung → kein Foto.
 *  2. Bild = Wikidata P18 dieser Person.
 *  3. Lizenz/Urheber aus der Commons-API (extmetadata). Nur CC0, Public Domain,
 *     CC BY, CC BY-SA. Alles andere wird übersprungen.
 *  4. MANUAL_SKIP: nach Sichtprüfung ausgeschlossene Dateien (Grund steht dabei).
 * Die Commons-Vorschaubilder werden nach public/photos/ kopiert (CC-Lizenzen erlauben die
 * Weitergabe mit Namensnennung): Seiten fragen Wikidata/Commons nie zur Laufzeit ab und
 * Browser der Besucher laden nichts von Drittservern (DSGVO).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const UA = "kroatien-sport-live-photo-resolver/1.0 (https://kroatien-sport-live.vercel.app; Jay2090x@users.noreply.github.com)";
/** Commons-Standardbreite; Anzeige 40–44 px rund (2× für scharfe Displays + Ausschnitt) */
const THUMB = 250;

/** Sichtprüfung: ausgeschlossene Dateien (Commons-Dateiname → Grund) und Bildausschnitte */
const REVIEW = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/photo-review.json"), "utf8"));
const MANUAL_SKIP = REVIEW.skip;
const DEFAULT_FOCUS = { x: 0.5, y: 0.22, zoom: 1.45 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (r.ok) return r.json();
    if (r.status === 404) return null;
    await sleep(1500 * (i + 1));
  }
  throw new Error(`HTTP error ${url}`);
}

/* ---------- Personen aus dem Code einlesen (IDs, keine Namensähnlichkeit) ---------- */
function block(file, start) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const i = src.indexOf(start);
  const j = src.indexOf("};", i);
  return [...src.slice(i, j).matchAll(/"(\d+)":\s*"([^"]+)"/g)].map((m) => ({ id: m[1], name: m[2] }));
}
const people = new Map();
for (const p of block("src/lib/players-meta.ts", "PLAYER_NAME")) people.set(`soccer:${p.id}`, { ...p, kind: "soccer" });
for (const p of block("src/lib/sources/talents.ts", "U21_NAME")) if (!people.has(`soccer:${p.id}`)) people.set(`soccer:${p.id}`, { ...p, kind: "soccer" });
const sportSrc = fs.readFileSync(path.join(ROOT, "src/lib/sport-meta.ts"), "utf8");
for (const m of sportSrc.matchAll(/\{ espnId: "(\d+)", name: "([^"]+)", org: "UFC" \}/g)) people.set(`mma:${m[1]}`, { id: m[1], name: m[2], kind: "mma" });
const nbaBlock = sportSrc.slice(sportSrc.indexOf("NBA_PLAYERS"), sportSrc.indexOf("];", sportSrc.indexOf("NBA_PLAYERS")));
for (const m of nbaBlock.matchAll(/espnId: "(\d+)", name: "([^"]+)"/g)) people.set(`nba:${m[1]}`, { id: m[1], name: m[2], kind: "nba" });
for (const m of sportSrc.matchAll(/id: "([a-z]+)",\s*name: "([^"]+)",\s*\/\*\*[^*]*\*\/\s*wiki: "([^"]*)"|id: "([a-z]+)",\s*name: "([^"]+)",\s*wiki: "([^"]*)"/g)) {
  const id = m[1] ?? m[4], name = m[2] ?? m[5], wiki = m[3] ?? m[6];
  people.set(`box:${id}`, { id, name, wiki, kind: "box" });
}

const PROP = { soccer: "P3681", nba: "P3685", mma: "P10073" };

async function qidByProp(prop, id) {
  const q = `SELECT ?p WHERE { ?p wdt:${prop} "${id}" }`;
  const j = await get(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`);
  const b = j?.results?.bindings ?? [];
  return b.length === 1 ? b[0].p.value.split("/").pop() : null; // mehrdeutig → nichts
}
async function qidByWiki(title) {
  const j = await get(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&redirects=1&format=json&titles=${encodeURIComponent(title)}`);
  const pg = Object.values(j?.query?.pages ?? {})[0];
  return pg?.pageprops?.wikibase_item ?? null;
}
async function entity(qid) {
  const j = await get(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  return j?.entities?.[qid] ?? null;
}
const claimVals = (e, p) => (e?.claims?.[p] ?? []).filter((c) => c.rank !== "deprecated").map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);
const dob = (e) => claimVals(e, "P569")[0]?.time?.slice(1, 11) ?? null;

async function espnDob(kind, id) {
  const url = kind === "soccer"
    ? `https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${id}`
    : kind === "nba" ? `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${id}`
    : `https://site.web.api.espn.com/apis/common/v3/sports/mma/athletes/${id}`;
  try {
    const j = await get(url, 2);
    const a = j?.athlete;
    if (a?.dateOfBirth) return a.dateOfBirth.slice(0, 10);
    // displayDOB = "D/M/YYYY" (ESPN, europäisch formatiert – geprüft an Livaković 9/1/1995 und Kovačić 6/5/1994)
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(a?.displayDOB ?? "");
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
  } catch { return null; }
}

async function qidByName(p) {
  const want = await espnDob(p.kind, p.id);
  if (!want) return { qid: null, why: "Namenssuche ohne ESPN-Geburtsdatum nicht verifizierbar" };
  const j = await get(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(p.name)}&language=hr&uselang=en&type=item&limit=10&format=json`);
  const hits = [];
  for (const s of j?.search ?? []) {
    const e = await entity(s.id);
    const cro = claimVals(e, "P27").some((v) => v.id === "Q224");
    // ESPN-DOB kann um einen Tag (Zeitzone) abweichen – nur exakte Übereinstimmung zählt
    if (cro && dob(e) === want) hits.push(s.id);
  }
  return hits.length === 1 ? { qid: hits[0], why: `Name + Geburtsdatum ${want} + Staatsangehörigkeit HR` } : { qid: null, why: `Namenssuche: ${hits.length} verifizierte Treffer` };
}

const FREE = (s) => /^(CC0|CC[ -]?0|Public domain|PD\b|PD-|CC BY(-SA)? \d(\.\d)?|CC BY(-SA)?$|CC-BY(-SA)?-\d)/i.test(s) && !/NC|ND/i.test(s);
const strip = (h) => (h ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/\s+/g, " ").trim();

async function imageInfo(file) {
  // starker Ausschnitt (zoom ≥ 2) → größere Standard-Vorschau, damit das Gesicht scharf bleibt
  const width = (REVIEW.focus[file]?.zoom ?? 1) >= 2 ? 500 : THUMB;
  const j = await get(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=${width}&titles=${encodeURIComponent("File:" + file)}`);
  const pg = Object.values(j?.query?.pages ?? {})[0];
  return pg?.imageinfo?.[0] ?? null;
}

const out = { generated: new Date().toISOString(), thumbWidth: THUMB, photos: {}, none: {}, skipped: [] };
for (const [key, p] of people) {
  let qid = null, via = "";
  if (PROP[p.kind]) { qid = await qidByProp(PROP[p.kind], p.id); via = qid ? `${PROP[p.kind]}=${p.id}` : ""; }
  if (!qid && p.wiki) { qid = await qidByWiki(p.wiki); via = qid ? `enwiki:${p.wiki}` : ""; }
  if (!qid && p.kind !== "box") { const r = await qidByName(p); qid = r.qid; via = r.why; }
  if (!qid) { out.none[key] = { name: p.name, reason: "Kein eindeutiges Wikidata-Objekt" + (via ? ` (${via})` : "") }; console.log("-", key, p.name, "no QID", via); continue; }
  const e = await entity(qid);
  const files = claimVals(e, "P18");
  if (!files.length) { out.none[key] = { name: p.name, qid, reason: "Kein Bild (P18) bei Wikidata" }; console.log("-", key, p.name, qid, "no P18"); continue; }
  let ok = null;
  for (const f of files) {
    const file = String(f);
    if (MANUAL_SKIP[file]) { out.skipped.push({ key, name: p.name, qid, file, reason: MANUAL_SKIP[file] }); continue; }
    const ii = await imageInfo(file);
    const md = ii?.extmetadata ?? {};
    const lic = md.LicenseShortName?.value ?? "";
    const artist = strip(md.Artist?.value);
    if (!ii || !FREE(lic)) { out.skipped.push({ key, name: p.name, qid, file, reason: `Lizenz nicht frei/unklar: "${lic}"` }); continue; }
    if (!artist && !/public domain|cc0/i.test(lic)) { out.skipped.push({ key, name: p.name, qid, file, reason: "Urheber fehlt" }); continue; }
    ok = {
      name: p.name, qid, via, file,
      page: ii.descriptionurl,
      thumb: ii.thumburl,
      w: ii.thumbwidth,
      h: ii.thumbheight,
      focus: REVIEW.focus[file] ?? DEFAULT_FOCUS,
      author: artist || "unbekannt",
      license: lic,
      licenseUrl: md.LicenseUrl?.value ?? null,
      date: strip(md.DateTimeOriginal?.value).slice(0, 40) || null,
      sa: /SA/i.test(lic),
    };
    break;
  }
  if (ok) {
    const ext = path.extname(new URL(ok.thumb).pathname).toLowerCase() || ".jpg";
    const local = `/photos/${key.replace(":", "-")}${ext}`;
    const r = await fetch(ok.thumb, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`thumb ${ok.thumb}: HTTP ${r.status}`);
    fs.mkdirSync(path.join(ROOT, "public/photos"), { recursive: true });
    fs.writeFileSync(path.join(ROOT, "public", local), Buffer.from(await r.arrayBuffer()));
    ok.src = local;
  }
  if (ok) { out.photos[key] = ok; console.log("+", key, p.name, qid, ok.file, ok.license); }
  else { out.none[key] = { name: p.name, qid, reason: "Kein frei lizenziertes / geeignetes Bild" }; console.log("-", key, p.name, qid, "skipped all"); }
  await sleep(300);
}
// verwaiste Dateien entfernen
const keep = new Set(Object.values(out.photos).map((p) => path.basename(p.src)));
for (const f of fs.existsSync(path.join(ROOT, "public/photos")) ? fs.readdirSync(path.join(ROOT, "public/photos")) : []) if (!keep.has(f)) fs.unlinkSync(path.join(ROOT, "public/photos", f));
fs.mkdirSync(path.join(ROOT, "src/data"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "src/data/photos.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`photos ${Object.keys(out.photos).length}, none ${Object.keys(out.none).length}, skipped ${out.skipped.length}`);
