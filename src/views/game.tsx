import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FreshGuard } from "@/components/fresh-guard";
import { BadgeView } from "@/components/badge-view";
import { GameRefresh } from "@/components/game-refresh";
import { badgeFor, type BadgeSpec } from "@/lib/club-badge";
import { dataLabel, href, type Lang } from "@/lib/i18n";
import { formatKickoff, formatTime } from "@/lib/time";
import { gameT } from "@/lib/game-i18n";
import { SOCCER_SLUG, gamePath, getGame, type Game, type GameEvent, type GameLineup, type Standing } from "@/lib/sources/game";

const badge = (n: string, abbr: string | null): BadgeSpec => {
  const b = badgeFor(n);
  return b.known || !abbr ? b : { ...b, abbr: abbr.slice(0, 4).toUpperCase() };
};

function Icon({ k }: { k: GameEvent["kind"] }) {
  if (k === "yellow") return <span className="cardicon cardicon-y" aria-hidden="true" />;
  if (k === "red") return <span className="cardicon cardicon-r" aria-hidden="true" />;
  const map: Record<string, string> = { goal: "⚽", penalty: "⚽", owngoal: "⚽", sub: "🔁", "pen-miss": "✖" };
  return <span aria-hidden="true">{map[k] ?? "•"}</span>;
}

function statusText(g: Game, lang: Lang): string {
  const T = gameT(lang);
  if (g.state === "in") return g.halftime ? T.halftime : g.clock ?? T.live;
  if (g.state === "post") return g.detail && !/^(FT|Final)$/i.test(g.detail) ? `${T.final} (${g.detail.replace(/^Final\//, "")})` : T.final;
  if (g.state === "pre" && g.kickoff) return `${g.sport === "nba" ? T.preNba : T.pre} ${formatTime(g.kickoff, lang)} ${T.oclock}`;
  return T.unknown;
}

function Lineup({ lu, name, lang }: { lu: GameLineup; name: string; lang: Lang }) {
  const T = gameT(lang);
  const start = lu.players.filter((p) => p.starter);
  const bench = lu.players.filter((p) => !p.starter);
  const P = ({ p }: { p: GameLineup["players"][number] }) => (
    <li className={p.croat ? "gm-cro" : undefined}>
      <span className="tk-no">{p.jersey ?? ""}</span> {p.croat ? "🇭🇷 " : ""}
      {p.name}
      {p.subOut ? <span className="gm-sub" title={T.subOut} aria-label={T.subOut}> ↓</span> : null}
      {p.subIn ? <span className="gm-sub gm-in" title={T.subIn} aria-label={T.subIn}> ↑</span> : null}
    </li>
  );
  return (
    <div className="tk-lu">
      <h4>
        {name}
        {lu.formation ? <span className="muted"> · {lu.formation}</span> : null}
      </h4>
      <p className="label">{T.starters}</p>
      <ol className="tk-players">{start.map((p) => <P key={p.id} p={p} />)}</ol>
      {bench.length > 0 && (
        <>
          <p className="label">{T.bench}</p>
          <ul className="tk-players gm-bench">{bench.map((p) => <P key={p.id} p={p} />)}</ul>
        </>
      )}
    </div>
  );
}

function groupTitle(t: string | null, lang: Lang): string | null {
  if (!t) return null;
  const x = t.replace(/^\d{4}(-\d{2,4})?\s+/, "").replace(/\s*Standings$/i, "").trim();
  const grp = x.match(/^Group\s+([A-Z0-9]+)$/i);
  if (grp) return `${lang === "hr" ? "Skupina" : "Gruppe"} ${grp[1]}`;
  const div = x.match(/^(Atlantic|Central|Southeast|Northwest|Pacific|Southwest)$/);
  if (div) return lang === "hr" ? `${div[1]} divizija` : `${div[1]} Division`;
  if (/^(Eastern|Western) Conference$/.test(x)) return lang === "hr" ? (x.startsWith("East") ? "Istočna konferencija" : "Zapadna konferencija") : x.startsWith("East") ? "Eastern Conference" : "Western Conference";
  return null;
}

function Table({ st, g, lang, many }: { st: Standing; g: Game; lang: Lang; many: boolean }) {
  const T = gameT(lang);
  const caption = st.kind === "nba" || many ? groupTitle(st.title, lang) : null;
  const ids = new Set([g.home.id, g.away.id]);
  const keys = st.kind === "nba" ? ["wins", "losses", "winPercent", "gamesBehind"] : ["gamesPlayed", "wins", "ties", "losses", "goals", "pointDifferential", "points"];
  const cols = st.kind === "nba" ? T.cols.nba : T.cols.soccer;
  const show = keys.map((k, i) => [k, cols[i]] as const).filter(([k]) => st.rows.some((r) => r.c[k] != null && r.c[k] !== ""));
  const hasRank = st.rows.some((r) => r.rank != null);
  return (
    <div className="table-wrap">
      <table className="table gm-table">
        {caption && <caption className="gm-cap">{caption}</caption>}
        <thead>
          <tr>
            {hasRank && <th scope="col">#</th>}
            <th scope="col" className="left">{lang === "hr" ? "Momčad" : "Team"}</th>
            {show.map(([k, l]) => (
              <th key={k} scope="col" className={k === "points" ? "pts" : k === "goals" ? "c-goals" : undefined}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {st.rows.map((r) => (
            <tr key={r.teamId + r.team} className={ids.has(r.teamId) ? "gm-hl" : undefined} aria-current={ids.has(r.teamId) ? "true" : undefined}>
              {hasRank && <td>{r.rank ?? ""}</td>}
              <td className="left">
                <span className="club">
                  <BadgeView b={badgeFor(r.team)} size={18} />
                  <span className="club-n">{g.sport === "nba" ? r.team : dataLabel(r.team, lang)}</span>
                </span>
              </td>
              {show.map(([k]) => (
                <td key={k} className={k === "points" ? "pts" : k === "goals" ? "c-goals" : undefined}>{r.c[k] ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function loadGame(league: string, id: string) {
  return getGame(league, id);
}

export async function GameView({ league, id, lang }: { league: string; id: string; lang: Lang }) {
  const T = gameT(lang);
  if (!/^\d{3,12}$/.test(id) || !(league === "hnl" || league === "nba" || SOCCER_SLUG.test(league))) notFound();
  const g = await getGame(league, id);
  const path = gamePath(league, id);
  if (!g) {
    return (
      <>
        <SiteHeader lang={lang} path={path} />
        <main lang={lang} className="container page-fan">
          <section className="card">
            <h1 className="h1">{T.notFound}</h1>
            <p className="intro">{T.notFoundText}</p>
          </section>
        </main>
        <SiteFooter lang={lang} />
      </>
    );
  }
  const nm = (n: string) => (g.sport === "nba" ? n : dataLabel(n, lang));
  const H = nm(g.home.name);
  const A = nm(g.away.name);
  const live = g.state === "in";
  const soon = g.state === "pre" && g.kickoff != null && Date.parse(g.kickoff) - Date.now() < 20 * 60_000;
  const backTo = g.sport === "hnl" ? "/#hnl" : g.sport === "nba" ? "/sport" : "/legionaere";
  const events = live ? [...g.events].reverse() : g.events;
  const croats = [...g.home.croats.map((n) => [n, H]), ...g.away.croats.map((n) => [n, A])];
  const sideName = (s: "home" | "away" | null) => (s === "home" ? H : s === "away" ? A : null);
  const anyCroat = g.lineups.some((l) => l.players.some((p) => p.croat)) || g.box.some((b) => b.rows.some((r) => r.croat));

  return (
    <>
      <SiteHeader lang={lang} path={path} />
      <GameRefresh active={live || soon} sec={30} />
      <main lang={lang} className="container page-fan">
        <section className="card gm-head" aria-labelledby="gm-h">
          <div className="card-head">
            <p className="eyebrow">
              {dataLabel(g.competition, lang)}
              {g.round ? ` · ${T.round(g.round)}` : ""}
            </p>
            <Link href={href(lang, backTo)} className="pill">{T.back[g.sport]}</Link>
          </div>
          <h1 id="gm-h" className="sr-only">
            {H} – {A}
          </h1>
          <div className={`tk-board gm-board${live ? " tk-live" : ""}${(g.home.score ?? 0) >= 100 || (g.away.score ?? 0) >= 100 ? " gm-big" : ""}`} aria-live="polite">
            <span className="tk-team">
              <span className="club">
                <BadgeView b={badge(g.home.name, g.home.abbr)} size={34} />
                <span className="club-n">{g.home.short ?? H}</span>
              </span>
            </span>
            <span className="tk-score">
              {g.home.score ?? "–"}:{g.away.score ?? "–"}
            </span>
            <span className="tk-team">
              <span className="club">
                <BadgeView b={badge(g.away.name, g.away.abbr)} size={34} />
                <span className="club-n">{g.away.short ?? A}</span>
              </span>
            </span>
            <span className="tk-status">
              {live && <span className="live-dot" aria-hidden="true" />} {live ? `${T.live} · ` : ""}
              {statusText(g, lang)}
            </span>
          </div>
          <p className="meta gm-meta">
            {g.kickoff && (
              <time dateTime={g.kickoff}>
                {formatKickoff(g.kickoff, lang)} {T.oclock}
              </time>
            )}
            {g.venue ? ` · ${g.venue}` : ""}
          </p>
          {croats.length > 0 && (
            <p className="gm-croats">
              <strong>🇭🇷 {T.croats}:</strong> {croats.map(([n, t]) => `${n} (${t})`).join(", ")}
            </p>
          )}
        </section>

        {g.sport === "hnl" && (
          <section className="card">
            <p className="small muted">{T.hnlGap}</p>
          </section>
        )}

        {g.sport === "soccer" && g.state !== "pre" && (
          <section className="card" aria-labelledby="gm-ev">
            <div className="card-head">
              <h2 id="gm-ev">{T.events}</h2>
            </div>
            {events.length ? (
              <ul className="tk-events">
                {events.map((e, i) => {
                  let who = e.names[0] ?? "";
                  if ((e.kind === "goal" || e.kind === "penalty") && e.names[1]) who = `${e.names[0]} (${T.assist}: ${e.names[1]})`;
                  if (e.kind === "sub" && e.names.length > 1) who = `${e.names[0]} ${T.subFor} ${e.names[1]}`;
                  const big = e.kind === "goal" || e.kind === "penalty" || e.kind === "owngoal";
                  const team = sideName(e.side);
                  return (
                    <li key={`${e.kind}-${e.minute}-${i}`} className={`tk-ev tk-${e.kind}${big ? " tk-big" : ""}${e.croat ? " gm-cro" : ""}`}>
                      <span className="tk-min">{e.minute}</span>
                      <span className="tk-ic">
                        <Icon k={e.kind} />
                      </span>
                      <span className="tk-txt">
                        <strong>{T.kind[e.kind]}</strong>
                        {who ? ` · ${e.croat ? "🇭🇷 " : ""}${who}` : ""}
                        {team ? <span className="muted"> · {team}</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted small">{T.noEvents}</p>
            )}
          </section>
        )}

        {g.stats.length > 0 && (
          <section className="card" aria-labelledby="gm-st">
            <div className="card-head">
              <h2 id="gm-st">{T.stats}</h2>
            </div>
            <div className="gm-stats">
              <div className="gm-stat gm-stat-head">
                <span>{g.home.abbr ?? H}</span>
                <span />
                <span>{g.away.abbr ?? A}</span>
              </div>
              {g.stats.map((s) => {
                const h = parseFloat(s.home);
                const a = parseFloat(s.away);
                const share = Number.isFinite(h) && Number.isFinite(a) && h + a > 0 && !s.key.includes("-") ? (h / (h + a)) * 100 : null;
                return (
                  <div key={s.key} className="gm-stat">
                    <span className="gm-v">{s.home}</span>
                    <span className="gm-l">
                      {T.stat[s.key] ?? s.key}
                      {share != null && (
                        <span className="gm-bar" aria-hidden="true">
                          <span style={{ width: `${share}%` }} />
                        </span>
                      )}
                    </span>
                    <span className="gm-v">{s.away}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {g.box.length > 0 && (
          <section className="card" aria-labelledby="gm-box">
            <div className="card-head">
              <h2 id="gm-box">{T.box}</h2>
            </div>
            {g.box.map((b) => (
              <div key={b.side} className="table-wrap gm-boxwrap">
                <table className="table gm-table">
                  <caption className="gm-cap">{sideName(b.side)}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="left">{lang === "hr" ? "Igrač" : "Spieler"}</th>
                      {b.cols.map((c) => (
                        <th key={c} scope="col">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r) => (
                      <tr key={r.id} className={r.croat ? "gm-hl" : undefined}>
                        <td className="left">
                          {r.croat ? "🇭🇷 " : ""}
                          {r.name}
                        </td>
                        {b.cols.map((c) => (
                          <td key={c}>{r.cells[c]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p className="small muted">{T.boxNote}</p>
          </section>
        )}

        {g.lineups.length > 0 && (
          <section className="card" aria-labelledby="gm-lu">
            <div className="card-head">
              <h2 id="gm-lu">{T.lineups}</h2>
            </div>
            <div className="tk-lineups">
              {(["home", "away"] as const).map((s) => {
                const lu = g.lineups.find((l) => l.side === s);
                return lu ? <Lineup key={s} lu={lu} name={sideName(s)!} lang={lang} /> : null;
              })}
            </div>
          </section>
        )}

        {g.standings.length > 0 && (
          <section className="card" aria-labelledby="gm-tb">
            <div className="card-head">
              <h2 id="gm-tb">{T.table}</h2>
              <span className="pill">{dataLabel(g.competition, lang)}</span>
            </div>
            {g.standings.map((st, i) => (
              <Table key={i} st={st} g={g} lang={lang} many={g.standings.length > 1} />
            ))}
            <p className="small muted">{g.sport === "hnl" ? T.tableNoteHnl : T.tableNote}</p>
          </section>
        )}
        {g.standings.length === 0 && g.sport === "soccer" && (
          <section className="card">
            <p className="small muted">{T.noTable}</p>
          </section>
        )}

        <p className="stand gm-stand">
          {live ? `${T.auto} · ` : ""}
          {T.updated}: {formatTime(g.fetchedAt, lang)} {T.oclock} · {T.source}: {g.source}
          {anyCroat ? ` · ${T.croatMark}` : ""}
        </p>
      </main>
      <FreshGuard renderedAt={new Date().toISOString()} />
      <SiteFooter lang={lang} />
    </>
  );
}
