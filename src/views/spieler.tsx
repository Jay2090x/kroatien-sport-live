import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlayerCard } from "@/components/player-card";
import { NoData, Stand } from "@/components/stand";
import { getPlayers, type PlayerRow } from "@/lib/sources/players";
import { POSITION_GROUP } from "@/lib/players-meta";
import { formatShortDate } from "@/lib/time";
import { dict, href, type Lang } from "@/lib/i18n";

const POS_HR: Record<string, string> = { Tor: "Vratari", Abwehr: "Obrana", Mittelfeld: "Vezni red", Angriff: "Napad" };

export async function SpielerView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const data = await getPlayers();

  const groups = new Map<string, PlayerRow[]>();
  for (const p of data?.players ?? []) {
    const de = POSITION_GROUP[p.position]?.label;
    const k = de ? (lang === "hr" ? POS_HR[de] ?? de : de) : t.players.more;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  return (
    <>
      <SiteHeader current="spieler" lang={lang} path="/spieler" />
      <main className="container page-spieler">
        <section className="card" aria-labelledby="spieler-h">
          <div className="card-head">
            <h1 id="spieler-h" className="h1">{t.players.h1}</h1>
            <Link href={href(lang, "/#vatreni")} className="pill">{t.players.back}</Link>
          </div>
          {!data ? (
            <NoData what={t.players.what} lang={lang} />
          ) : (
            <>
              <p className="intro">
                {t.players.intro(
                  data.players.length,
                  data.window.matches,
                  formatShortDate(data.window.from, lang),
                  formatShortDate(data.window.to, lang)
                )}
              </p>
              {data.squadNote && (
                <p className="footnote">
                  {data.squadNote.text}{" "}
                  <a href={data.squadNote.url} rel="noopener" target="_blank">
                    {t.source}: {data.squadNote.source}
                  </a>
                </p>
              )}
              <p className="legend">
                <span>⚽ {t.players.goal}</span>
                <span><span className="cardicon cardicon-y" aria-hidden="true" /> {t.players.yellow}</span>
                <span><span className="cardicon cardicon-r" aria-hidden="true" /> {t.players.red}</span>
                <span>{t.players.minutesNote}</span>
              </p>
              <Stand fetchedAt={data.fetchedAt} source="ESPN, TheSportsDB" lang={lang} />
            </>
          )}
        </section>

        {[...groups.entries()].map(([label, players]) => (
          <section key={label} className="pgroup" aria-label={label}>
            <h2 className="pgroup-h">{label}</h2>
            <div className="players">
              {players.map((p) => (
                <PlayerCard key={p.id} p={p} lang={lang} />
              ))}
            </div>
          </section>
        ))}

        {data && (
          <section className="card notes" aria-label={t.sport.notes}>
            <h2 className="pgroup-h">{t.sport.notes}</h2>
            <ul>
              {t.players.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
              {data.gaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
