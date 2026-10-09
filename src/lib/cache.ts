import { unstable_cache } from "next/cache";

export interface Sourced<T> {
  data: T;
  /** ISO-Zeitpunkt des letzten erfolgreichen Abrufs */
  fetchedAt: string;
}

/**
 * Serverseitiger Daten-Cache (Vercel Data Cache / .next/cache).
 *
 * - Der Loader muss bei unbrauchbaren Daten werfen – dann wird nichts gecacht.
 * - Ist schon ein Eintrag vorhanden und die Revalidierung schlägt fehl, liefert
 *   Next.js weiter den letzten guten Stand (stale-while-revalidate).
 * - Gibt es noch gar keinen guten Stand, kommt `null` zurück und die UI zeigt
 *   "derzeit keine Daten". Es werden nie Daten erfunden.
 */
export async function cachedSource<T>(
  keyParts: string[],
  revalidateSeconds: number,
  loader: () => Promise<T>
): Promise<Sourced<T> | null> {
  const cachedFn = unstable_cache(
    async (): Promise<Sourced<T>> => ({
      data: await loader(),
      fetchedAt: new Date().toISOString(),
    }),
    ["ksl-v3", ...keyParts],
    { revalidate: revalidateSeconds, tags: [`ksl:${keyParts[0]}`] }
  );
  try {
    return await cachedFn();
  } catch (err) {
    console.error(
      `[data] ${keyParts.join("/")} failed:`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/** Revalidierungs-Intervalle (Sekunden) */
export const REVALIDATE = {
  default: 600, // 10 min
  live: 60, // ±3 h um einen Kroatien-Anpfiff
  news: 300, // 5 min
  hnl: 3600, // 1 h
  hnlOldRound: 7 * 24 * 3600, // abgeschlossene, ältere Runden
  day: 24 * 3600,
} as const;
