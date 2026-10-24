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
    ["ksl-v4", ...keyParts], // v4: ISR-Fail-Fast bei TheSportsDB-Ausfällen (2026-10-16)
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

/* ---------- Kurzzeit-Cache für Live-Daten ---------- */

interface MemoEntry {
  at: number;
  data: unknown;
  pending?: Promise<void>;
}
const memo = new Map<string, MemoEntry>();

/**
 * Live-Quellen (Spielstände): im Speicher der Funktion, `ttlSeconds` frisch.
 * Anders als unstable_cache wird ein abgelaufener Eintrag NICHT ausgeliefert, sondern
 * neu geladen (unstable_cache liefert beim ersten Aufruf nach langer Pause den alten Stand).
 * Schlägt der Abruf fehl, gibt es den letzten guten Stand höchstens `maxStaleSeconds` lang –
 * mit seinem echten Abrufzeitpunkt, damit die Leiste das Alter ehrlich anzeigen kann.
 */
export async function liveSource<T>(
  keyParts: string[],
  ttlSeconds: number,
  loader: () => Promise<T>,
  maxStaleSeconds = 300
): Promise<Sourced<T> | null> {
  const key = keyParts.join("/");
  const now = Date.now();
  const e = memo.get(key);
  if (e && now - e.at < ttlSeconds * 1000) return { data: e.data as T, fetchedAt: new Date(e.at).toISOString() };
  try {
    const data = await loader();
    memo.set(key, { at: Date.now(), data });
    if (memo.size > 300) memo.delete(memo.keys().next().value as string);
    return { data, fetchedAt: new Date().toISOString() };
  } catch (err) {
    console.error(`[data] ${key} failed:`, err instanceof Error ? err.message : err);
    if (e && now - e.at < maxStaleSeconds * 1000) return { data: e.data as T, fetchedAt: new Date(e.at).toISOString() };
    return null;
  }
}
