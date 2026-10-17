import data from "@/data/photos.json";

/**
 * Spieler-/Athletenfotos – ausschließlich frei lizenzierte Bilder von Wikimedia Commons
 * (CC0, Public Domain, CC BY, CC BY-SA), aufgelöst über Wikidata (P18) und
 * vorab mit scripts/resolve-photos.mjs geprüft. Zuordnung über Schlüssel
 * "soccer:<ESPN-ID>", "nba:<ESPN-ID>", "mma:<ESPN-ID>", "box:<id>" – nie über Namen.
 * Die Vorschaubilder liegen lokal unter /public/photos (keine Drittanfragen im Browser).
 */
export interface Photo {
  name: string;
  qid: string;
  file: string;
  page: string;
  src: string;
  w: number;
  h: number;
  author: string;
  license: string;
  licenseUrl: string | null;
  date: string | null;
  sa: boolean;
  focus: { x: number; y: number; zoom: number };
}

const PHOTOS = data.photos as Record<string, Photo>;

export const photoKey = {
  soccer: (espnId: string) => `soccer:${espnId}`,
  nba: (espnId: string) => `nba:${espnId}`,
  mma: (espnId: string) => `mma:${espnId}`,
  box: (id: string) => `box:${id}`,
};

export function photoFor(key: string | undefined | null): Photo | null {
  return (key && PHOTOS[key]) || null;
}

/** Alle Fotos, alphabetisch nach Nachname (für /bildnachweise). */
export function allPhotos(): Array<Photo & { key: string }> {
  return Object.entries(PHOTOS)
    .map(([key, p]) => ({ ...p, key }))
    .sort((a, b) => a.name.split(" ").at(-1)!.localeCompare(b.name.split(" ").at(-1)!, "hr"));
}

export function initials(name: string): string {
  const parts = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export const PHOTOS_GENERATED = data.generated;
