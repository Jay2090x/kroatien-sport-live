/**
 * Redaktioneller Tagesbrief – immer vorhanden, auch wenn RSS ausfällt.
 * Kein Fixture-Spam: 3–6 Sätze Kontext + Verweis auf Board/Tracker.
 */

import type { Match, Player } from "@/types";
import type { NewsArticle, NewsLocaleText } from "@/lib/data/news";
import { filterNationalTeamMatches } from "@/lib/data/national-team";
import { isLiveStatus } from "@/lib/utils";

function todayIso(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function fmtKick(iso: string, locale: "de" | "en" | "hr"): string {
  try {
    return new Date(iso).toLocaleString(
      locale === "hr" ? "hr-HR" : locale === "en" ? "en-GB" : "de-DE",
      { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
    );
  } catch {
    return iso;
  }
}

const IMG =
  "https://r2.thesportsdb.com/images/media/team/badge/vvtsyu1455465317.png";

/**
 * Baut den täglichen Brief aus Live-Kontext (ohne pro-Spiel-„News“).
 */
export function buildDailyBrief(
  now = new Date(),
  live?: { matches?: Match[]; players?: Player[] }
): NewsArticle {
  const today = todayIso(now);
  const matches = live?.matches ?? [];
  const players = live?.players ?? [];

  const liveNow = matches.filter(
    (m) => isLiveStatus(m.status) && m.croatianPlayers.length > 0
  );
  const nt = filterNationalTeamMatches(matches);
  const nextNt = nt
    .filter(
      (m) =>
        m.status === "scheduled" ||
        m.status === "live" ||
        m.status === "halftime" ||
        m.status === "postponed"
    )
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    )[0];

  const weekClub = matches.filter((m) => {
    if (m.status !== "scheduled" && m.status !== "postponed" && !isLiveStatus(m.status))
      return false;
    if (!m.croatianPlayers.length) return false;
    const t = new Date(m.kickoff).getTime();
    return t >= now.getTime() - 3 * 3600_000 && t <= now.getTime() + 7 * 24 * 3600_000;
  });

  const croatNames = new Set<string>();
  for (const m of weekClub) {
    for (const p of m.croatianPlayers.slice(0, 2)) croatNames.add(p.playerName);
  }
  const nameSample = [...croatNames].slice(0, 5).join(", ");

  const title: NewsLocaleText = {
    de: `Tagesbrief ${today}: Vatreni, Clubs & Tracker`,
    en: `Daily brief ${today}: Vatreni, clubs & tracker`,
    hr: `Dnevni brief ${today}: Vatreni, klubovi i tracker`,
  };

  // Body blocks per locale
  const deParts: string[] = [];
  const enParts: string[] = [];
  const hrParts: string[] = [];

  if (liveNow.length > 0) {
    const line = liveNow
      .slice(0, 2)
      .map(
        (m) =>
          `${m.homeTeam}–${m.awayTeam} (${m.homeScore ?? "–"}:${m.awayScore ?? "–"})`
      )
      .join("; ");
    deParts.push(`🔴 Gerade live mit kroatischen Spielern: ${line}. Details und bestätigte TV-Hinweise nur im Live-Board.`);
    enParts.push(`🔴 Live now with Croatians involved: ${line}. Details and confirmed TV tips only on the live board.`);
    hrParts.push(`🔴 Trenutno uživo s hrvatskim igračima: ${line}. Detalji i potvrđeni TV savjeti samo na live boardu.`);
  } else {
    deParts.push(
      `Heute ${weekClub.length} relevante Club-/Länderspiel-Termine mit Kroaten im 7-Tage-Fenster${nameSample ? ` (u. a. ${nameSample})` : ""}. Die Liste steht im Live-Board – nicht als künstliche „News“-Flut.`
    );
    enParts.push(
      `Today: ${weekClub.length} relevant club/NT fixtures with Croatians in the 7-day window${nameSample ? ` (incl. ${nameSample})` : ""}. Full list on the live board – not as fake news spam.`
    );
    hrParts.push(
      `Danas: ${weekClub.length} relevantnih klupskih/reprezentativnih termina s Hrvatima u 7-dnevnom prozoru${nameSample ? ` (npr. ${nameSample})` : ""}. Potpuni popis na live boardu – ne kao lažni news spam.`
    );
  }

  if (nextNt) {
    deParts.push(
      `Nächstes Länderspiel im Kalender: ${nextNt.homeTeam} – ${nextNt.awayTeam} · ${fmtKick(nextNt.kickoff, "de")} (${nextNt.leagueName}). Kader erst nach Nominierung – wir spekulieren nicht.`
    );
    enParts.push(
      `Next international on the calendar: ${nextNt.homeTeam} – ${nextNt.awayTeam} · ${fmtKick(nextNt.kickoff, "en")} (${nextNt.leagueName}). Squad only after nomination – we don’t guess.`
    );
    hrParts.push(
      `Iduća utakmica reprezentacije: ${nextNt.homeTeam} – ${nextNt.awayTeam} · ${fmtKick(nextNt.kickoff, "hr")} (${nextNt.leagueName}). Sastav tek nakon nominacije – ne nagađamo.`
    );
  } else {
    deParts.push(
      `Kein anstehendes Länderspiel in den aktuellen API-Daten. Nationalteam-Rubrik und Tracker bleiben die Anlaufstellen für den nächsten Zyklus.`
    );
    enParts.push(
      `No upcoming international in current API data. Use the national-team section and tracker for the next cycle.`
    );
    hrParts.push(
      `Nema nadolazeće utakmice reprezentacije u trenutnim API podacima. Rubrika reprezentacije i tracker ostaju polazište za idući ciklus.`
    );
  }

  deParts.push(
    `Redaktionell: Status und Verletzungen nur mit Quelle. TV nur bei bestätigter Live-Übertragung. Keine illegalen Streams, kein VPN, keine Affiliate-Werbung.`
  );
  enParts.push(
    `Editorial policy: status/injuries only with a source. TV only when a live broadcast is confirmed. No illegal streams, no VPN, no affiliate ads.`
  );
  hrParts.push(
    `Urednička politika: status/ozljede samo s izvorom. TV samo uz potvrđen live prijenos. Bez ilegalnih streamova, bez VPN-a, bez affiliate oglasa.`
  );

  deParts.push(
    `${players.length} Spieler im Tracker. Favoriten → „Meine Woche“ + Kalender-Export. Headlines unten aus öffentlichen Quellen mit Original-Link.`
  );
  enParts.push(
    `${players.length} players in the tracker. Favorites → “My week” + calendar export. Headlines below from public sources with original links.`
  );
  hrParts.push(
    `${players.length} igrača u trackeru. Omiljeni → „Moj tjedan“ + izvoz kalendara. Naslovi ispod iz javnih izvora s originalnim linkom.`
  );

  const summary: NewsLocaleText = {
    de: deParts[0]!.slice(0, 220),
    en: enParts[0]!.slice(0, 220),
    hr: hrParts[0]!.slice(0, 220),
  };

  return {
    id: `daily-brief-${today}`,
    date: today,
    featured: true,
    category: "vatreni",
    tag: { de: "Tagesbrief", en: "Daily brief", hr: "Dnevni brief" },
    title,
    summary,
    body: {
      de: deParts.join("\n\n"),
      en: enParts.join("\n\n"),
      hr: hrParts.join("\n\n"),
    },
    image: {
      url: IMG,
      alt: {
        de: "Kroatien / Tagesbrief",
        en: "Croatia / daily brief",
        hr: "Hrvatska / dnevni brief",
      },
    },
  };
}
