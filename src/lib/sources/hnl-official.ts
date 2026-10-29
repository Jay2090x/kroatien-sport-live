import { cachedSource, REVALIDATE } from "../cache";
import { fetchText } from "../http";

/**
 * Offizieller SuperSport-HNL-Spielplan (hnl.hr, öffentlich, ohne Konto).
 * Nur für Anstoßzeiten und Verlegungen: TheSportsDB führt oft Platzhalter-Zeiten
 * (z. B. alle Spiele 17:00) und markiert vorverlegte/verlegte Spiele als "PST",
 * obwohl die HNL bereits einen neuen Termin angesetzt hat (geprüft 19.10.2026,
 * 11. Runde). Ergebnisse und Tabelle bleiben bei TheSportsDB (+ Wikipedia-Abgleich).
 */
const OFFICIAL_URL = "https://www.hnl.hr/supersport-hnl/raspored-i-rezultati/";

export interface OfficialHnlMatch {
  round: number;
  /** Anstoß als ISO-UTC; null = Datum ohne Uhrzeit */
  kickoff: string | null;
  /** Datum laut HNL (Ortszeit), YYYY-MM-DD */
  date: string;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
}

const ZAGREB = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zagreb",
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function zagrebOffsetMs(t: number): number {
  const p = Object.fromEntries(ZAGREB.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
  return asUtc - Math.floor(t / 60000) * 60000;
}

/** Ortszeit Zagreb (MEZ/MESZ, inkl. Zeitumstellung) → ISO-UTC */
export function zagrebToIso(y: number, mo: number, d: number, h: number, mi: number): string {
  const local = Date.UTC(y, mo - 1, d, h, mi);
  let t = local - zagrebOffsetMs(local - 3600_000);
  t = local - zagrebOffsetMs(t);
  return new Date(t).toISOString();
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function score(s: string): number | null {
  const t = s.trim();
  return /^\d{1,2}$/.test(t) ? Number(t) : null;
}

/** Spielplan-Tabelle von hnl.hr parsen (Rundenkopf "N. kolo", danach Zeilen je Spiel). */
export function parseOfficialSchedule(html: string): OfficialHnlMatch[] {
  const rx =
    /<th colspan="7">(\d{1,2})\. kolo|<tr><td>(\d{2})\.(\d{2})\.(\d{4})\.(?:\s*(\d{1,2}):(\d{2}))?<div class="natjecanje">([^<]*)<\/div>[\s\S]*?<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>\s*:\s*<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>/g;
  const out: OfficialHnlMatch[] = [];
  let round = 0;
  for (const m of html.matchAll(rx)) {
    if (m[1]) {
      round = Number(m[1]);
      continue;
    }
    if (!round || !/SuperSport HNL/i.test(m[7])) continue;
    const [d, mo, y] = [Number(m[2]), Number(m[3]), Number(m[4])];
    const kickoff = m[5] ? zagrebToIso(y, mo, d, Number(m[5]), Number(m[6])) : null;
    out.push({
      round,
      kickoff,
      date: `${m[4]}-${m[3]}-${m[2]}`,
      home: decode(m[8]),
      away: decode(m[11]),
      homeScore: score(m[9]),
      awayScore: score(m[10]),
    });
  }
  return out;
}

/** Vereinsschlüssel für den Abgleich TheSportsDB ↔ HNL ("HNK Gorica" ↔ "Gorica", "Hajduk Split" ↔ "Hajduk"). */
export function clubKey(name: string): string {
  const t = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(" ")
    .filter((w) => w && !["hnk", "nk", "gnk", "hsk", "fc"].includes(w));
  return t[0] ?? "";
}

async function loadOfficial(): Promise<OfficialHnlMatch[]> {
  const list = parseOfficialSchedule(await fetchText(OFFICIAL_URL, { timeoutMs: 9000, retries: 1 }));
  // Plausibilität: 10 Vereine, 36 Runden à 5 Spiele – bei Layout-Änderung lieber gar nicht nutzen
  const rounds = new Set(list.map((m) => m.round));
  if (list.length < 100 || rounds.size < 20) throw new Error(`hnl.hr: unexpected schedule (${list.length} rows)`);
  return list;
}

/** Offizieller Spielplan, stündlich; `null` = nicht verfügbar (dann nur TheSportsDB). */
export async function getOfficialSchedule(): Promise<OfficialHnlMatch[] | null> {
  const res = await cachedSource(["hnl", "official"], REVALIDATE.hnl, loadOfficial);
  return res ? res.data : null;
}
