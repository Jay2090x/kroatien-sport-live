import { FreshGuard } from "@/components/fresh-guard";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PlayerCard } from "@/components/player-card";
import { x2 } from "@/lib/fan/i18n2";
import { NoData, Stand } from "@/components/stand";
import { getPlayers, type PlayerRow } from "@/lib/sources/players";
import { getPlayerClips } from "@/lib/sources/player-clips";
import { POSITION_GROUP } from "@/lib/players-meta";
import { formatShortDate } from "@/lib/time";
import { dict, href, type Lang } from "@/lib/i18n";
import { JsonLd, breadcrumbs } from "@/components/json-ld";
import { SITE } from "@/lib/site";

const POS_HR: Record<string, string> = { Tor: "Vratari", Abwehr: "Obrana", Mittelfeld: "Vezni red", Angriff: "Napad" };

export async function SpielerView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const data = await getPlayers();
  const clips = data ? (await getPlayerClips(data.players.map((p) => ({ name: p.name, club: p.club }))))?.data ?? [] : [];

  const groups = new Map<string, PlayerRow[]>();
  for (const p of data?.players ?? []) {
    const de = POSITION_GROUP[p.position]?.label;
    const k = de ? (lang === "hr" ? POS_HR[de] ?? de : de) : t.players.more;
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  return (
    <>
      {data && (
        <JsonLd
          data={[
            breadcrumbs([
              { name: SITE.name, url: `${SITE.url}${href(lang, "/")}` },
              { name: t.players.h1, url: `${SITE.url}${href(lang, "/spieler")}` },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: t.players.metaTitle,
              itemListElement: data.players.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Person",
                  name: p.name,
                  nationality: { "@type": "Country", name: "Croatia" },
                  ...(p.club ? { affiliation: { "@type": "SportsTeam", name: p.club } } : {}),
                  memberOf: { "@type": "SportsTeam", name: "Croatia national football team" },
                },
              })),
            },
          ]}
        />
      )}
      <SiteHeader current="spieler" lang={lang} path="/spieler" />
      <main lang={lang} className="container page-spieler">
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
                  {lang === "hr" ? data.squadNote.textHr : data.squadNote.text}{" "}
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
                <PlayerCard key={p.id} p={p} lang={lang} clips={clips.filter((c) => c.player === p.name).slice(0, 2)} />
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

        {[...groups.values()].some((ps) => ps.some((p) => p.form?.length)) && (
          <p className="form-legend small muted" aria-label={lang === "hr" ? "Legenda" : "Legende"}>
            {x2(lang).form.legend}
          </p>
        )}
      </main>
      <FreshGuard renderedAt={new Date().toISOString()} />
      <SiteFooter lang={lang} />
    </>
  );
}
