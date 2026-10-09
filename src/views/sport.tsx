import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SportFilterBar, SportGate } from "@/components/sport-filter";
import { TimelineList } from "@/components/timeline";
import { NewsList } from "@/components/news-list";
import { Highlights } from "@/components/highlights";
import { NoData, Stand } from "@/components/stand";
import { getSport, type SportItem } from "@/lib/sources/sport";
import { getVatreni } from "@/lib/sources/vatreni";
import { getHnl } from "@/lib/sources/hnl";
import { getBoxers, type BoxerStatus } from "@/lib/sources/boxing";
import { getNews, pickNews } from "@/lib/sources/news";
import { getVideos } from "@/lib/sources/videos";
import { buildTimeline, tlLabels } from "@/lib/timeline";
import { SPORT_EMOJI, type BoxFight } from "@/lib/sport-meta";
import { dict, href, type Dict, type Lang } from "@/lib/i18n";
import { formatDay, formatKickoff } from "@/lib/time";

function Outcome({ o, t }: { o?: "W" | "L" | "D"; t: Dict }) {
  if (!o) return null;
  const cls = o === "W" ? "S" : o === "L" ? "N" : "U";
  const lbl = o === "W" ? t.win : o === "L" ? t.loss : t.draw;
  return (
    <span className={`badge badge-${cls}`} title={lbl} aria-label={lbl}>
      {o === "W" ? t.winShort : o === "L" ? t.lossShort : t.drawShort}
    </span>
  );
}

function MmaFight({ i, t, lang }: { i: SportItem; t: Dict; lang: Lang }) {
  const res = i.result && lang === "hr"
    ? i.result
        .replace(/^Sieg/, t.win)
        .replace(/^Niederlage/, t.loss)
        .replace("einstimmige Punktentscheidung", "jednoglasna odluka sudaca")
        .replace("geteilte Punktentscheidung", "podijeljena odluka sudaca")
        .replace("K.o./TKO", "nokaut/TKO")
        .replace("Aufgabe (Submission)", "predaja (submission)")
        .replace(/Runde (\d+)/, "runda $1")
    : i.result;
  return (
    <div className="fight">
      <p className="fight-when">
        {i.start ? formatDay(i.start, lang) : t.dateOpen}
        {i.state === "pre" ? ` · ${t.timeOpen}` : ""} · {i.competition}
      </p>
      <p className="fight-vs">
        {t.sport.vs} {i.vs}
      </p>
      {res && (
        <p className="si-result">
          <Outcome o={i.outcome} t={t} /> <span>{res}</span>
        </p>
      )}
    </div>
  );
}

function BoxFightLine({ f, t, lang, kind }: { f: BoxFight; t: Dict; lang: Lang; kind: "next" | "last" }) {
  return (
    <div className="fight">
      <p className="fight-when">
        {formatDay(`${f.date}T12:00:00Z`, lang)}
        {kind === "next" ? ` · ${t.timeOpen}` : ""}
        {f.event ? ` · ${f.event}` : ""}
        {f.place ? ` · ${f.place}` : ""}
      </p>
      <p className="fight-vs">
        {t.sport.vs} {f.opponent}
      </p>
      {kind === "last" && f.outcome && (
        <p className="si-result">
          <Outcome o={f.outcome} t={t} />{" "}
          <span>
            {[f.outcome === "W" ? t.win : f.outcome === "L" ? t.loss : t.draw, f.method, f.round ? (lang === "hr" ? `${f.round}. runda` : `Runde ${f.round}`) : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </p>
      )}
      {kind === "last" && !f.outcome && <p className="muted small">{lang === "hr" ? "Rezultat još nije upisan." : "Ergebnis noch nicht eingetragen."}</p>}
      {f.note && <p className="si-detail">{f.note[lang]}</p>}
      <p className="footnote">
        {t.source}: {f.source}
      </p>
    </div>
  );
}

function BoxerCard({ b, t, lang }: { b: BoxerStatus; t: Dict; lang: Lang }) {
  return (
    <section className="card" aria-labelledby={`b-${b.id}`} data-sport="boxen">
      <div className="card-head">
        <h2 id={`b-${b.id}`}>
          {SPORT_EMOJI.boxing} {b.name}
        </h2>
        <span className="pill">{b.division[lang]}</span>
      </div>
      <h3>{t.sport.nextFight}</h3>
      {b.next ? <BoxFightLine f={b.next} t={t} lang={lang} kind="next" /> : <p className="teaser-line">{t.sport.noFight}</p>}
      {b.info && <p className="footnote">{b.info[lang]}</p>}
      <h3>{t.sport.lastFight}</h3>
      {b.last ? <BoxFightLine f={b.last} t={t} lang={lang} kind="last" /> : <p className="muted">—</p>}
    </section>
  );
}

export async function SportView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const now = Date.now();
  const [data, vatreni, hnl, boxers, news, videos] = await Promise.all([
    getSport(),
    getVatreni(),
    getHnl(),
    getBoxers(),
    getNews(),
    getVideos(),
  ]);
  const tl = buildTimeline({ vatreni, hnl, sport: data, boxers }, lang, now);
  const newsRows = news
    ? pickNews(news.data, { lang, now, max: 16, min: 8, perSport: 5 }).map((n) => ({ ...n, when: `${formatKickoff(n.publishedAt, lang)} ${t.oclock}` }))
    : [];
  const clips = (videos?.data ?? []).map((v) => ({ ...v, when: formatKickoff(v.publishedAt, lang) }));
  const de = lang === "de";

  return (
    <>
      <SiteHeader current="sport" lang={lang} path="/sport" />
      <main className="container page-spieler">
        <section className="card" aria-labelledby="sport-h">
          <div className="card-head">
            <h1 id="sport-h" className="h1">{t.sport.h1}</h1>
            <Link href={href(lang, "/")} className="pill">{t.sport.back}</Link>
          </div>
          <p className="intro">{t.sport.intro}</p>
          <SportFilterBar t={{ filter: t.filter }} />
          {data ? <Stand fetchedAt={data.fetchedAt} source={t.timeline.sources} lang={lang} /> : <NoData what={t.sport.what} lang={lang} />}
        </section>

        <div className="grid grid-tight">
          <section className="card" aria-labelledby="up-h">
            <div className="card-head">
              <h2 id="up-h">📅 {t.sport.upcoming}</h2>
            </div>
            <TimelineList items={tl.upcoming} t={tlLabels(t)} limit={40} empty={t.timeline.noneUpcoming} />
          </section>

          <section className="card" aria-labelledby="res-h">
            <div className="card-head">
              <h2 id="res-h">✅ {t.sport.results}</h2>
              <span className="pill">{t.sport.resultsPill}</span>
            </div>
            <TimelineList items={tl.results} t={tlLabels(t)} limit={20} empty={t.timeline.noneResults} />
          </section>

          {data?.fighters.map((f) => (
            <SportGate key={f.name} sport="mma">
              <section className="card" aria-labelledby={`f-${f.name}`}>
                <div className="card-head">
                  <h2 id={`f-${f.name}`}>{SPORT_EMOJI.mma} {f.name}</h2>
                  <span className="pill">{f.org}</span>
                </div>
                <h3>{t.sport.nextFight}</h3>
                {f.next ? <MmaFight i={f.next} t={t} lang={lang} /> : <p className="teaser-line">{t.sport.noFight}</p>}
                <h3>{t.sport.lastFight}</h3>
                {f.last ? <MmaFight i={f.last} t={t} lang={lang} /> : <p className="muted">—</p>}
                <Stand fetchedAt={f.fetchedAt} source="ESPN" lang={lang} />
              </section>
            </SportGate>
          ))}

          {boxers.map((b) => (
            <SportGate key={b.id} sport="boxing">
              <BoxerCard b={b} t={t} lang={lang} />
            </SportGate>
          ))}

          <section className="card" aria-labelledby="hl-h">
            <div className="card-head">
              <h2 id="hl-h">📰 {t.sport.headlines}</h2>
              <span className="pill">{t.news.pill}</span>
            </div>
            {news ? <NewsList items={newsRows} tags={t.tags} empty={t.sport.noHeadlines} /> : <NoData what={t.news.what} lang={lang} />}
            <p className="footnote">{t.news.note}</p>
            <Stand fetchedAt={news?.fetchedAt ?? null} source={t.news.sources} lang={lang} />
          </section>

          <Highlights videos={clips.slice(0, 4)} labels={{ ...t.highlights }} />

          <section className="card notes span-2" aria-label={t.sport.notes}>
            <h2 className="pgroup-h">{t.sport.notes}</h2>
            {de ? (
              <ul>
                <li><strong>Reihenfolge:</strong> Termine aufsteigend nach Datum und Uhrzeit (Wiener Zeit), Ergebnisse absteigend. Termine ohne feste Uhrzeit stehen am Ende des jeweiligen Tages („Uhrzeit offen“).</li>
                <li><strong>Filter:</strong> gilt für die ganze Seite und steht in der Adresse (z. B. <code>?sport=mma</code>) – Links lassen sich teilen.</li>
                <li><strong>MMA:</strong> Kampftermine nur, wenn ESPN einen Kampf führt; sonst „kein Kampf angekündigt“. Gerüchte werden nicht angezeigt.</li>
                <li><strong>Boxen:</strong> Es gibt keine kostenlose Boxen-Datenquelle ohne Konto. Die Kämpfe sind daher von Hand mit mehreren Quellen geprüft (Stand 09.10.2026, Quelle je Kampf angegeben); trägt Wikipedia einen neueren Kampf ein, wird dieser automatisch übernommen. Angekündigt werden nur offiziell bestätigte Kämpfe (z. B. BKFC = Bare-Knuckle-Boxen).</li>
                <li><strong>Tennis:</strong> Matches mit kroatischer Beteiligung (Länderkennung bei ESPN). Bei kommenden Matches nur das Datum – Tennis-Uhrzeiten hängen vom Spielverlauf davor ab.</li>
                <li><strong>Handball &amp; Basketball:</strong> nächste Spiele über TheSportsDB, Handball-Länderspiele aus dem offiziellen EHF-Spielplan.</li>
                <li><strong>Schlagzeilen:</strong> nur mit Bezug zu kroatischen Athletinnen, Athleten oder Teams, in Originalsprache, höchstens 36 Stunden alt (sonst werden die jüngsten älteren ergänzt). Gereiht nach Stichwörtern (Derby, Transfer, Vatreni, UFC/Boxen, Rekord …) und Aktualität; es werden keine Texte dazuerfunden.</li>
                <li>Für Wasserball, Ski-Weltcup und Leichtathletik gibt es derzeit keine verlässliche kostenlose Datenquelle; sie erscheinen nur in den Schlagzeilen.</li>
                {data?.gaps.map((g) => <li key={g}>{g}</li>)}
              </ul>
            ) : (
              <ul>
                <li><strong>Redoslijed:</strong> termini uzlazno po datumu i vremenu (srednjoeuropsko vrijeme), rezultati silazno. Termini bez poznatog vremena nalaze se na kraju dana („vrijeme nije poznato“).</li>
                <li><strong>Filtar:</strong> vrijedi za cijelu stranicu i stoji u adresi (npr. <code>?sport=mma</code>) – poveznice se mogu dijeliti.</li>
                <li><strong>MMA:</strong> termini borbi samo ako ih ESPN vodi; inače „nije najavljena borba“. Glasine se ne prikazuju.</li>
                <li><strong>Boks:</strong> ne postoji besplatan izvor podataka za boks bez korisničkog računa. Borbe su zato ručno provjerene u više izvora (stanje 9. 10. 2026., izvor naveden uz svaku borbu); ako Wikipedia upiše noviju borbu, automatski se preuzima. Najavljuju se samo službeno potvrđene borbe (npr. BKFC = boks bez rukavica).</li>
                <li><strong>Tenis:</strong> mečevi s hrvatskim sudjelovanjem (oznaka zemlje na ESPN-u). Za nadolazeće mečeve samo datum.</li>
                <li><strong>Rukomet i košarka:</strong> sljedeće utakmice preko TheSportsDB-a, utakmice rukometne reprezentacije iz službenog EHF rasporeda.</li>
                <li><strong>Naslovi:</strong> samo s vezom na hrvatske sportaše ili momčadi, na izvornom jeziku, najviše 36 sati stari. Poredak prema ključnim riječima (derbi, transfer, Vatreni, UFC/boks, rekord …) i svježini; ništa se ne izmišlja.</li>
              </ul>
            )}
          </section>
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
