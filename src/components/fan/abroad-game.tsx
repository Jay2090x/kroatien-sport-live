import type { AbroadGame, CroInGame } from "@/lib/sources/abroad";
import { PerfLine, Teams } from "@/components/player-card";
import { fan } from "@/lib/fan/i18n";
import { dataLabel, dict, type Lang } from "@/lib/i18n";
import { formatKickoff } from "@/lib/time";
import { Avatar } from "@/components/avatar";
import { photoKey } from "@/lib/photos";

const LU_CLS: Record<string, string> = {
  pending: "lu-pending",
  unknown: "lu-pending",
  start: "lu-start",
  bench: "lu-bench",
  out: "lu-out",
  nodata: "lu-pending",
};

function PlayerLine({ p, g, lang }: { p: CroInGame; g: AbroadGame; lang: Lang }) {
  const t = dict(lang);
  const f = fan(lang);
  let status: React.ReactNode;
  if (p.perf && g.game.state === "post") status = <PerfLine p={p.perf} t={t} />;
  else if (p.perf && g.game.state === "in") {
    status = p.perf.inSquad ? <PerfLine p={p.perf} t={t} /> : <span className="perf perf-out">{t.players.notInSquad}</span>;
  } else if (p.perfNote) status = <span className="perf perf-na">{f.abroad.perfNote[p.perfNote]}</span>;
  else if (p.lineup) status = <span className={`lu ${LU_CLS[p.lineup]}`}>{t.players.lineup[p.lineup]}</span>;
  return (
    <li className="ag-player">
      <span className="ag-name with-av">
        <Avatar pkey={photoKey.soccer(p.id)} name={p.name} size={28} lang={lang} />
        {p.name}
      </span>
      {status}
    </li>
  );
}

export function AbroadGameRow({ g, lang, showClubTag = false }: { g: AbroadGame; lang: Lang; showClubTag?: boolean }) {
  const t = dict(lang);
  const f = fan(lang);
  const ga = g.game;
  const isHome = g.croSides.includes(ga.homeId ?? "");
  return (
    <li className={`ag${g.croClubs.length ? " ag-cro" : ""}`}>
      <div className="ag-head">
        <span className="ag-when">
          {ga.state === "in" && <span className="pill pill-live">{t.live}</span>}{" "}
          <time dateTime={ga.kickoff}>
            {formatKickoff(ga.kickoff, lang)} {t.oclock}
          </time>
        </span>
        <span className="ag-comp">
          {dataLabel(ga.competition, lang)}
          {g.matchday ? ` · ${f.abroad.matchday(g.matchday)}` : ""}
        </span>
      </div>
      <p className="ag-teams">
        <Teams g={ga} isHome={isHome} lang={lang} />
        {showClubTag && g.croClubs.length > 0 && <span className="tag tag-cro">🇭🇷 {f.abroad.croClub}</span>}
      </p>
      {g.players.length > 0 ? (
        <ul className="ag-players">
          {g.players.map((p) => (
            <PlayerLine key={`${p.id}-${p.teamId}`} p={p} g={g} lang={lang} />
          ))}
        </ul>
      ) : (
        <p className="muted small">{f.abroad.noCroPlayers}</p>
      )}
    </li>
  );
}
