import Link from "next/link";
import { H2H_ASOF, H2H_ROWS, H2H_SOURCE } from "@/data/h2h";
import { H2H_MATCHES, type H2HMatch } from "@/data/h2h-matches";
import { href, type Lang } from "@/lib/i18n";

const TXT = {
  de: {
    title: (opp: string) => `Kroatien gegen ${opp}: alle Duelle`,
    rec: (p: number, w: number, d: number, l: number) => `${p} Spiele · ${w} Siege · ${d} Remis · ${l} Niederlagen`,
    goals: "Tore",
    cols: { date: "Datum", match: "Spiel", comp: "Wettbewerb", where: "Ort" },
    where: { H: "Heim", A: "auswärts", N: "neutral" },
    aet: "n. V.",
    pens: (s: string) => `${s} i. E.`,
    kinds: { friendly: "Freundschaftsspiel", wc: "WM", wcq: "WM-Quali", euro: "EM", euroq: "EM-Quali", nl: "Nations League", cup: "Turnier" },
    biggestW: "Höchster Sieg",
    biggestL: "Höchste Niederlage",
    last: "Letztes Duell",
    note: (d: string) => `Alle Länderspiele seit der Unabhängigkeit, Stand ${d}. Quelle: Wikipedia-Spielberichte (Daten des HNS), je Gegner gegen die HNS-Bilanztabelle geprüft. Ergebnis aus Sicht des Heimteams; Elfmeterschießen zählt als Remis.`,
    source: "Quelle",
    more: "Bilanz gegen alle Gegner →",
    cro: "Kroatien",
  },
  hr: {
    title: (opp: string) => `Hrvatska – ${opp}: svi dvoboji`,
    rec: (p: number, w: number, d: number, l: number) => `${p} utakmica · ${w} pobjeda · ${d} neriješenih · ${l} poraza`,
    goals: "Golovi",
    cols: { date: "Datum", match: "Utakmica", comp: "Natjecanje", where: "Teren" },
    where: { H: "doma", A: "u gostima", N: "neutralno" },
    aet: "prod.",
    pens: (s: string) => `${s} pen.`,
    kinds: { friendly: "prijateljska", wc: "SP", wcq: "kvalif. SP", euro: "EP", euroq: "kvalif. EP", nl: "Liga nacija", cup: "turnir" },
    biggestW: "Najveća pobjeda",
    biggestL: "Najveći poraz",
    last: "Zadnji dvoboj",
    note: (d: string) => `Sve utakmice od neovisnosti, stanje ${d}. Izvor: Wikipedijini zapisnici utakmica (podaci HNS-a), za svakog protivnika provjereni prema HNS-ovoj tablici. Rezultat iz perspektive domaćina; raspucavanje se računa kao neriješeno.`,
    source: "Izvor",
    more: "Bilanca protiv svih protivnika →",
    cro: "Hrvatska",
  },
};

type Kind = keyof typeof TXT.de.kinds;
function kind(m: H2HMatch): { k: Kind; year: string } {
  const c = m.comp.toLowerCase();
  const y = (m.comp.match(/(19|20)\d{2}/) ?? [m.date.slice(0, 4)])[0];
  if (c.includes("friendly")) return { k: "friendly", year: m.date.slice(0, 4) };
  if (c.includes("nations l")) return { k: "nl", year: y };
  if (c.includes("world cup")) return { k: c.includes("qualif") ? "wcq" : "wc", year: y };
  if (c.includes("euro")) return { k: c.includes("qualif") ? "euroq" : "euro", year: y };
  return { k: "cup", year: m.date.slice(0, 4) };
}
function where(m: H2HMatch, oppEn: string): "H" | "A" | "N" {
  const country = m.place.split(",").pop()?.trim() ?? "";
  if (country === "Croatia") return "H";
  if (country === oppEn || (oppEn === "Republic of Ireland" && country.includes("Ireland"))) return "A";
  return "N";
}
const fmtDate = (ymd: string, lang: Lang) => {
  const [y, mo, d] = ymd.split("-");
  return lang === "hr" ? `${+d}. ${+mo}. ${y}.` : `${d}.${mo}.${y}`;
};

/** Alle bisherigen Duelle mit dem Gegner (geprüfte Daten, Stand laut h2h.ts). */
export function MatchH2H({ opponentDe, lang }: { opponentDe: string; lang: Lang }) {
  const T = TXT[lang];
  const row = H2H_ROWS.find((r) => r.de === opponentDe);
  // Unbekannter Name → lieber nichts zeigen als fälschlich "erstes Duell" behaupten.
  if (!row) return null;
  const ms = H2H_MATCHES.filter((m) => m.en === row.en).sort((a, b) => b.date.localeCompare(a.date));
  const opp = row[lang];
  const diff = (m: H2HMatch) => m.cro - m.opp;
  const bw = [...ms].filter((m) => diff(m) > 0).sort((a, b) => diff(b) - diff(a) || b.cro - a.cro)[0];
  const bl = [...ms].filter((m) => diff(m) < 0).sort((a, b) => diff(a) - diff(b) || b.opp - a.opp)[0];
  const score = (m: H2HMatch) => {
    const s = m.home ? `${m.cro}:${m.opp}` : `${m.opp}:${m.cro}`;
    const p = m.pens ? (m.home ? m.pens : m.pens.split(":").reverse().join(":")) : null;
    return `${s}${m.aet ? ` ${T.aet}` : ""}${p ? `, ${T.pens(p)}` : ""}`;
  };
  const title = (m: H2HMatch) => (m.home ? `${T.cro} – ${opp}` : `${opp} – ${T.cro}`);
  const res = (m: H2HMatch) => (diff(m) > 0 ? "W" : diff(m) < 0 ? "L" : "D");
  const w = (row.w / row.p) * 100, d = (row.d / row.p) * 100;
  return (
    <section className="card" aria-labelledby="h2h-h">
      <h2 id="h2h-h">🆚 {T.title(opp)}</h2>
      <span className="h2h-bar" aria-hidden="true">
        <span className="h2h-bw" style={{ width: `${w}%` }} />
        <span className="h2h-bd" style={{ width: `${d}%` }} />
        <span className="h2h-bl" style={{ width: `${100 - w - d}%` }} />
      </span>
      <p className="strong">{T.rec(row.p, row.w, row.d, row.l)} · {T.goals} {row.gf}:{row.ga}</p>
      <ul className="mh-facts small">
        {ms[0] && <li><strong>{T.last}:</strong> {title(ms[0])} {score(ms[0])} ({fmtDate(ms[0].date, lang)})</li>}
        {bw && <li><strong>{T.biggestW}:</strong> {title(bw)} {score(bw)} ({fmtDate(bw.date, lang)})</li>}
        {bl && <li><strong>{T.biggestL}:</strong> {title(bl)} {score(bl)} ({fmtDate(bl.date, lang)})</li>}
      </ul>
      <ol className="mh-list">
        {ms.map((m) => {
          const k = kind(m);
          return (
            <li key={m.date} className={`mh-item mh-${res(m)}`}>
              <span className="mh-date">{fmtDate(m.date, lang)}</span>
              <span className="mh-match"><strong>{title(m)} {score(m)}</strong></span>
              <span className="mh-meta small muted">{T.kinds[k.k]}{k.k === "friendly" ? "" : ` ${k.year}${lang === "hr" ? "." : ""}`} · {T.where[where(m, row.en)]}</span>
            </li>
          );
        })}
      </ol>
      <p className="footnote">
        {T.note(fmtDate(H2H_ASOF, lang))} <a href={H2H_SOURCE} target="_blank" rel="noopener noreferrer">{T.source}: Wikipedia ↗</a>
      </p>
      <p className="more-link"><Link href={href(lang, "/bilanz")}>{T.more}</Link></p>
    </section>
  );
}
