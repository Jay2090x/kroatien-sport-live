import { cachedSource, REVALIDATE } from "../cache";
import { loadEspnCroatiaMatches, loadEspnNationsGroup, loadEspnScoreboardMatch } from "./espn";
import { loadOpenLigaCroatiaMatches } from "./openligadb";
import type { GroupTable, NtMatch } from "./types";

const H = 3600_000;
const LIVE_WINDOW = 3 * H;

export interface VatreniData {
  source: "ESPN" | "OpenLigaDB" | null;
  fetchedAt: string | null;
  liveMode: boolean;
  live: NtMatch | null;
  next: NtMatch | null;
  last: NtMatch[];
  group: GroupTable | null;
  groupFetchedAt: string | null;
}

function nearKickoff(matches: NtMatch[], now: number): NtMatch | undefined {
  return matches.find(
    (m) =>
      m.state !== "postponed" &&
      m.state !== "cancelled" &&
      Math.abs(Date.parse(m.kickoff) - now) <= LIVE_WINDOW
  );
}

export async function getVatreni(now = Date.now()): Promise<VatreniData> {
  let source: VatreniData["source"] = null;
  let fetchedAt: string | null = null;
  let matches: NtMatch[] = [];

  const base = await cachedSource(["nt", "espn"], REVALIDATE.default, loadEspnCroatiaMatches);
  const near = base ? nearKickoff(base.data.matches, now) : undefined;

  if (base) {
    source = "ESPN";
    fetchedAt = base.fetchedAt;
    matches = base.data.matches;
  }

  // ±3 h um einen Anpfiff: eigener Cache-Eintrag mit 60 s Revalidierung
  if (base && near) {
    const live = await cachedSource(["nt", "espn-live", near.id], REVALIDATE.live, async () => {
      const fresh = await loadEspnCroatiaMatches();
      const raw = fresh.raw.find((r) => `espn-${r.id}` === near.id);
      if (raw?.slug) {
        try {
          const sb = await loadEspnScoreboardMatch(raw.slug, raw.date, raw.id);
          if (sb) {
            return { ...fresh, matches: fresh.matches.map((m) => (m.id === sb.id ? sb : m)) };
          }
        } catch {
          /* Scoreboard optional – Team-Spielplan reicht */
        }
      }
      return fresh;
    });
    if (live) {
      fetchedAt = live.fetchedAt;
      matches = live.data.matches;
    }
  }

  // Fallback / Ergänzung: OpenLigaDB
  const hasUpcoming = matches.some((m) => m.state === "pre" && Date.parse(m.kickoff) > now);
  if (!base || !hasUpcoming) {
    const oldb = await cachedSource(["nt", "oldb"], REVALIDATE.default, loadOpenLigaCroatiaMatches);
    if (oldb) {
      if (!base) {
        source = "OpenLigaDB";
        fetchedAt = oldb.fetchedAt;
        matches = oldb.data;
      } else {
        const upcoming = oldb.data.filter((m) => m.state === "pre" && Date.parse(m.kickoff) > now);
        matches = [...matches, ...upcoming];
      }
    }
  }

  const live = matches.find((m) => m.state === "in") ?? null;
  const next =
    matches
      .filter(
        (m) =>
          m.state === "pre" &&
          m.id !== live?.id &&
          // nie ein längst vergangenes Spiel als "nächstes" anzeigen
          Date.parse(m.kickoff) > now - 150 * 60_000
      )
      .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff))[0] ?? null;
  const last = matches
    .filter((m) => m.state === "post" && m.homeScore != null && m.awayScore != null)
    .sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff))
    .slice(0, 5);

  const nlRelevant = [next, live, last[0]].some((m) => m?.competition === "UEFA Nations League");
  let group: GroupTable | null = null;
  let groupFetchedAt: string | null = null;
  if (nlRelevant) {
    const g = near
      ? await cachedSource(["nt", "nl-group-live"], REVALIDATE.live, loadEspnNationsGroup)
      : await cachedSource(["nt", "nl-group"], REVALIDATE.default, loadEspnNationsGroup);
    if (g?.data) {
      group = g.data;
      groupFetchedAt = g.fetchedAt;
    }
  }

  return { source, fetchedAt, liveMode: Boolean(near), live, next, last, group, groupFetchedAt };
}
