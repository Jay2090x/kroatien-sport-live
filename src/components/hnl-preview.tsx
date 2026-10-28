import type { Sourced } from "@/lib/cache";
import type { HnlData, HnlMatch } from "@/lib/sources/hnl";
import { formatDay, formatShortDate, formatTime } from "@/lib/time";
import type { Lang } from "@/lib/i18n";
import { Club } from "./club-badge";
import { Stand } from "./stand";

const TXT = {
  de: {
    title: (n: number) => `Vorschau ${n}. Runde`,
    pill: "Form & Duelle",
    rank: (r: number, p: number) => `${r}. Platz · ${p} Pkt.`,
    form: "Form",
    formHint: "letzte 5 Ligaspiele, neuestes rechts",
    met: "Diese Saison",
    notMet: "Erstes Duell dieser Saison",
    res: { W: "S", D: "U", L: "N" },
    resLong: { W: "Sieg", D: "Unentschieden", L: "Niederlage" },
    note: "Alles aus den echten Ergebnissen dieser Saison berechnet (Tabelle, Form, bisherige Duelle) – keine Prognosen.",
    source: "TheSportsDB, hnl.hr",
    oclock: " Uhr",
  },
  hr: {
    title: (n: number) => `Najava ${n}. kola`,
    pill: "Forma i dvoboji",
    rank: (r: number, p: number) => `${r}. mjesto · ${p} bod.`,
    form: "Forma",
    formHint: "zadnjih 5 prvenstvenih utakmica, najnovija desno",
    met: "Ove sezone",
    notMet: "Prvi dvoboj ove sezone",
    res: { W: "P", D: "N", L: "I" },
    resLong: { W: "pobjeda", D: "neriješeno", L: "poraz" },
    note: "Sve izračunato iz stvarnih rezultata ove sezone (ljestvica, forma, dosadašnji dvoboji) – bez prognoza.",
    source: "TheSportsDB, hnl.hr",
    oclock: " h",
  },
};

type R = "W" | "D" | "L";
const played = (m: HnlMatch) => m.state === "finished" && m.homeScore != null && m.awayScore != null;
const t0 = (m: HnlMatch) => (m.kickoff ? Date.parse(m.kickoff) : 0);

function resultFor(team: string, m: HnlMatch): R {
  const mine = m.home === team ? m.homeScore! : m.awayScore!;
  const theirs = m.home === team ? m.awayScore! : m.homeScore!;
  return mine > theirs ? "W" : mine < theirs ? "L" : "D";
}

function form(team: string, all: HnlMatch[]): { r: R; m: HnlMatch }[] {
  return all
    .filter((m) => played(m) && (m.home === team || m.away === team))
    .sort((a, b) => t0(a) - t0(b))
    .slice(-5)
    .map((m) => ({ r: resultFor(team, m), m }));
}

function Form({ team, all, lang }: { team: string; all: HnlMatch[]; lang: Lang }) {
  const T = TXT[lang];
  const f = form(team, all);
  return (
    <span className="hp-form" aria-label={`${T.form}: ${f.map((x) => T.resLong[x.r]).join(", ")}`}>
      {f.map((x) => (
        <span
          key={x.m.id}
          className={`hp-chip hp-${x.r}`}
          title={`${x.m.home} ${x.m.homeScore}:${x.m.awayScore} ${x.m.away}`}
          aria-hidden="true"
        >
          {T.res[x.r]}
        </span>
      ))}
    </span>
  );
}

export function HnlPreview({ hnl, lang }: { hnl: Sourced<HnlData> | null; lang: Lang }) {
  if (!hnl) return null;
  const d = hnl.data;
  const T = TXT[lang];
  const upcoming = d.currentRoundMatches.filter((m) => m.state === "scheduled" && m.kickoff);
  if (!upcoming.length) return null;
  const row = new Map(d.table.map((r) => [r.team, r]));
  const all = d.matches;
  return (
    <section id="hnl-vorschau" className="card span-2 hp" aria-labelledby="hp-h">
      <div className="card-head">
        <h2 id="hp-h">🔮 {T.title(d.currentRound)}</h2>
        <span className="pill">{T.pill}</span>
      </div>
      <ul className="hp-list">
        {upcoming.map((m) => {
          const meetings = all
            .filter((x) => played(x) && ((x.home === m.home && x.away === m.away) || (x.home === m.away && x.away === m.home)))
            .sort((a, b) => t0(a) - t0(b));
          const side = (team: string) => {
            const r = row.get(team);
            return (
              <div className="hp-side">
                <Club name={team} size={22} />
                {r && <span className="small muted">{T.rank(r.rank, r.points)}</span>}
                <Form team={team} all={all} lang={lang} />
              </div>
            );
          };
          return (
            <li key={m.id} className="hp-item">
              <p className="eyebrow">
                {formatDay(m.kickoff!, lang)} · {formatTime(m.kickoff!, lang)}{T.oclock}
              </p>
              <div className="hp-teams">
                {side(m.home)}
                <span className="hp-vs" aria-hidden="true">–</span>
                {side(m.away)}
              </div>
              <p className="small hp-met">
                {meetings.length ? (
                  <>
                    <strong>{T.met}:</strong>{" "}
                    {meetings.map((x, i) => (
                      <span key={x.id}>
                        {i > 0 ? " · " : ""}
                        {x.home} {x.homeScore}:{x.awayScore} {x.away} <span className="muted">({formatShortDate(x.kickoff!, lang)})</span>
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="muted">{T.notMet}</span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="footnote">{T.formHint}. {T.note}</p>
      <Stand fetchedAt={hnl.fetchedAt} source={T.source} lang={lang} />
    </section>
  );
}
