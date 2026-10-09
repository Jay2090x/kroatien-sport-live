import { cachedSource } from "../cache";
import { fetchJson } from "../http";
import { BOXERS, type BoxFight } from "../sport-meta";

/**
 * Boxen: kuratierte, geprüfte Kämpfe (sport-meta.ts) + automatischer Abgleich mit
 * der Kampfrekord-Tabelle der englischen Wikipedia (kostenlos, ohne Konto).
 * Wikipedia wird nur verwendet, wenn dort ein NEUERER abgeschlossener Kampf steht.
 */

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

function clean(cell: string): string {
  return cell
    .replace(/^\s*(style|align)="[^"]*"\s*\|/i, "")
    .replace(/\{\{(?:small|Small)\|([^}]*)\}\}/g, "$1")
    .replace(/\{\{abbr\|([^|}]*)\|[^}]*\}\}/gi, "$1")
    .replace(/\{\{(yes2|no2|draw2|n\/a|ya)\}\}/gi, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/<br\s*\/?>/gi, "; ")
    .replace(/'''?/g, "")
    .trim();
}

function parseDate(s: string): string | null {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (!m) return null;
  const mm = MONTHS[m[2].toLowerCase()];
  return mm ? `${m[3]}-${mm}-${m[1].padStart(2, "0")}` : null;
}

/** Erste (neueste) Zeile der Kampfrekord-Tabelle. */
export function parseLatestBout(wikitext: string): BoxFight | null {
  const start = wikitext.search(/==\s*Professional boxing record\s*==/i);
  if (start < 0) return null;
  const table = wikitext.slice(start, wikitext.indexOf("|}", start));
  const rows = table.split(/\n\|-[^\n]*\n/).slice(1);
  for (const row of rows) {
    if (/^\s*!/.test(row)) continue;
    // Zellen: jede Zeile mit "|" beginnt eine Zelle; "||" trennt Zellen in einer Zeile
    const cells = row
      .split("\n")
      .filter((l) => l.startsWith("|"))
      .flatMap((l) => l.slice(1).split("||"))
      .map(clean);
    if (cells.length < 7) continue;
    const [, result, , opponent, type, round, date, place] = cells;
    const iso = parseDate(date);
    if (!iso) continue;
    const r = result.toLowerCase();
    const outcome = r.startsWith("win") ? "W" : r.startsWith("loss") ? "L" : r.startsWith("draw") ? "D" : undefined;
    if (!outcome) return null; // geplanter Kampf o. Ä. – nicht automatisch übernehmen
    return {
      date: iso,
      opponent,
      event: "",
      place: place ?? "",
      outcome,
      method: type,
      round: round.split(/[\s(,]/)[0],
      source: "Wikipedia",
    };
  }
  return null;
}

async function loadWiki(page: string): Promise<BoxFight | null> {
  const j = await fetchJson<{ parse?: { wikitext?: string } }>(
    `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2&origin=*`
  );
  if (!j.parse?.wikitext) throw new Error(`Wikipedia ${page}: no wikitext`);
  return parseLatestBout(j.parse.wikitext);
}

export interface BoxerStatus {
  id: string;
  name: string;
  division: { de: string; hr: string };
  last: BoxFight | null;
  next: BoxFight | null;
  info?: { de: string; hr: string };
  /** true = letzter Kampf kommt aus dem Wikipedia-Abgleich */
  lastFromWiki: boolean;
  fetchedAt: string;
}

export async function getBoxers(now = Date.now()): Promise<BoxerStatus[]> {
  return Promise.all(
    BOXERS.map(async (b) => {
      const wiki = b.wiki ? await cachedSource(["box", "wiki", b.id], 6 * 3600, () => loadWiki(b.wiki)) : null;
      let last = b.last;
      let lastFromWiki = false;
      const w = wiki?.data ?? null;
      if (w && (!last || w.date > last.date)) {
        last = w;
        lastFromWiki = true;
      }
      // angekündigter Kampf: bis Ende des Kampftags anzeigen
      let next = b.next && Date.parse(`${b.next.date}T23:59:59Z`) >= now ? b.next : null;
      // Hat Wikipedia den angekündigten Kampf schon als Ergebnis, nicht mehr als "nächster" zeigen
      if (next && last && last.date >= next.date) next = null;
      // angekündigter Kampf vorbei, aber noch kein Ergebnis → als letzter Kampf ohne Ergebnis
      if (!next && b.next && Date.parse(`${b.next.date}T23:59:59Z`) < now && (!last || last.date < b.next.date)) {
        last = b.next;
      }
      return {
        id: b.id,
        name: b.name,
        division: b.division,
        last,
        next,
        info: b.info,
        lastFromWiki,
        fetchedAt: wiki?.fetchedAt ?? new Date(now).toISOString(),
      };
    })
  );
}
