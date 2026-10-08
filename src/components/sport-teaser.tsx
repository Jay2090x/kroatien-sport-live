import Link from "next/link";
import type { SportData } from "@/lib/sources/sport";
import { formatDay } from "@/lib/time";
import { SportRow } from "./sport-item";
import { NoData, Stand } from "./stand";

/** Kompakter Teaser auf der Startseite. */
export function SportTeaser({ data }: { data: SportData | null }) {
  return (
    <section id="sport" className="card" aria-labelledby="sport-h">
      <div className="card-head">
        <h2 id="sport-h">🏅 Andere Sportarten</h2>
      </div>
      {!data ? (
        <NoData what="Andere Sportarten" />
      ) : (
        <>
          {data.fighters.map((f) => (
            <p key={f.name} className="teaser-line">
              🥊 <strong>{f.name}</strong> ({f.org}):{" "}
              {f.next ? (
                <>nächster Kampf {f.next.start ? formatDay(f.next.start) : "(Termin offen)"} vs. {f.next.vs}</>
              ) : (
                <>noch kein Kampf angekündigt</>
              )}
              {f.last?.result && f.last.start ? (
                <span className="muted">
                  {" "}
                  · zuletzt {f.last.outcome === "W" ? "Sieg" : f.last.outcome === "L" ? "Niederlage" : "Kampf"} vs. {f.last.vs} ({formatDay(f.last.start)})
                </span>
              ) : null}
            </p>
          ))}
          {data.upcoming.length > 0 ? (
            <ul className="sis">
              {data.upcoming.slice(0, 4).map((i) => (
                <SportRow key={i.key} item={i} />
              ))}
            </ul>
          ) : (
            <p className="muted">Derzeit keine Termine in den nächsten Tagen.</p>
          )}
          <p className="more-link">
            <Link href="/sport">Alle Termine, Ergebnisse &amp; Schlagzeilen →</Link>
          </p>
          <Stand fetchedAt={data.fetchedAt} source="ESPN, TheSportsDB, HRT" />
        </>
      )}
    </section>
  );
}
