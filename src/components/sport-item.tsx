import type { SportItem } from "@/lib/sources/sport";
import { SPORT_EMOJI, SPORT_LABEL } from "@/lib/sport-meta";
import { formatDay, formatKickoff } from "@/lib/time";

export function When({ item }: { item: SportItem }) {
  if (!item.start || item.dateKnown === false)
    return <span className="si-when">Termin noch offen (Spielplan nicht veröffentlicht)</span>;
  return (
    <time className="si-when" dateTime={item.start}>
      {item.timeKnown ? `${formatKickoff(item.start)} Uhr` : `${formatDay(item.start)}${item.state === "pre" ? " · Uhrzeit offen" : ""}`}
    </time>
  );
}

const OUTCOME = { W: "Sieg", L: "Niederlage", D: "Unentschieden" } as const;

export function SportRow({ item, showWho = true }: { item: SportItem; showWho?: boolean }) {
  return (
    <li className="si">
      <span className="si-emoji" role="img" aria-label={SPORT_LABEL[item.sport]}>
        {SPORT_EMOJI[item.sport]}
      </span>
      <div className="si-body">
        <p className="si-title">
          {showWho && item.who ? <strong>{item.who}</strong> : null}
          {showWho && item.who ? <span className="si-vs"> · {item.sport === "tennis" || item.sport === "mma" ? "vs. " : ""}{item.vs}</span> : <span>{item.vs}</span>}
        </p>
        <p className="si-meta">
          {item.state === "in" ? <span className="pill pill-live">läuft</span> : null}
          <When item={item} />
          {item.competition ? <span> · {item.competition}</span> : null}
        </p>
        {item.result && (
          <p className="si-result">
            {item.outcome && (
              <span className={`badge badge-${item.outcome === "W" ? "S" : item.outcome === "L" ? "N" : "U"}`} aria-label={OUTCOME[item.outcome]} title={OUTCOME[item.outcome]}>
                {item.outcome === "W" ? "S" : item.outcome === "L" ? "N" : "U"}
              </span>
            )}
            <span>{item.result}</span>
          </p>
        )}
        {item.detail && <p className="si-detail">{item.detail}</p>}
      </div>
    </li>
  );
}
