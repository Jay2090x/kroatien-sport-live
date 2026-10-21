import { cachedSource } from "../cache";
import { loadEspnCroatiaMatches } from "./espn";
import { getVideos, type Video } from "./videos";
import { viennaYmd } from "../time";
import type { NtMatch } from "./types";

/** Alle Kroatien-Spiele (ESPN), gleicher Cache-Eintrag wie die Startseite. */
export async function getVatreniMatches(): Promise<{ matches: NtMatch[]; fetchedAt: string } | null> {
  const s = await cachedSource(["nt", "espn"], 600, loadEspnCroatiaMatches);
  return s ? { matches: s.data.matches, fetchedAt: s.fetchedAt } : null;
}

export const matchSlug = (m: { id: string }) => m.id.replace(/^espn-/, "");

/** Offizieller HNS-Clip zum Spiel (nur bei eindeutigem Datum ±1 Tag und passender Heim/Gast-Reihenfolge). */
export async function clipForMatch(kickoff: string, croatiaIsHome: boolean): Promise<Video | null> {
  const v = await getVideos();
  if (!v) return null;
  const ymd = viennaYmd(kickoff);
  const day = 86_400_000;
  return (
    v.data.find((x) => {
      if (!x.vatreni || !x.dateHint) return false;
      const dd = Math.abs(Date.parse(`${ymd}T12:00:00Z`) - Date.parse(`${x.dateHint}T12:00:00Z`));
      const hrFirst = x.pairing ? /hrvatska|croatia/i.test(x.pairing.home) : null;
      return dd <= day && (hrFirst == null || hrFirst === croatiaIsHome);
    }) ?? null
  );
}
