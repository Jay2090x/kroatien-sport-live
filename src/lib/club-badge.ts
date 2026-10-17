import data from "@/data/club-colors.json";

/**
 * Vereinsfarben-Kreise statt Wappen: schlichter Kreis in den Vereinsfarben
 * (Füllung + Ring, bei Kroatien zweigeteilt) mit 2–4 Buchstaben.
 * Keine Logos, Wappen oder wappenähnlichen Elemente. Farben stammen aus
 * Wikipedia (Colours/Kit), siehe src/data/club-colors.json.
 * Unbekannte Vereine: neutraler grauer Kreis mit automatischem Kürzel.
 */
export interface BadgeSpec {
  abbr: string;
  bg: string;
  ring: string;
  fg: string;
  split?: boolean;
  known: boolean;
}

interface Entry {
  n: string;
  a: string;
  c: string[];
  aka?: string[];
  split?: boolean;
}

const FALLBACK_BG = "#6B7280";
const FALLBACK_RING = "#9CA3AF";

/** generische Vereinszusätze, die für Abgleich und Kürzel ignoriert werden */
const NOISE = new Set([
  "fc", "cf", "sc", "ac", "as", "ss", "ssc", "us", "afc", "nk", "hnk", "gnk", "hsk", "fk", "sk", "bk", "if", "ik", "kv",
  "krc", "rc", "rcd", "cd", "ud", "sd", "ca", "sv", "vfb", "vfl", "tsg", "tsv", "bsc", "osc", "ogc", "aj", "fsv", "spvgg",
  "pfc", "kf", "aik", "ff", "sl", "cp", "jk", "bc", "fbc", "calcio", "club", "de", "del", "la", "1", "1.", "04", "05", "07",
]);

export function normName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ø/gi, "o")
    .replace(/æ/gi, "ae")
    .replace(/ß/g, "ss")
    .replace(/ı/g, "i")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function core(n: string): string {
  return n
    .split(" ")
    .filter((w) => !NOISE.has(w))
    .join(" ");
}

function lum(hex: string): number {
  const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = v.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
/** Schriftfarbe mit dem besten (Mindest-)Kontrast zu allen Hintergrundflächen */
function textOn(bgs: string[]): string {
  const cands = ["#FFFFFF", "#111111"];
  let best = cands[0];
  let bestC = 0;
  for (const c of cands) {
    const m = Math.min(...bgs.map((b) => contrast(c, b)));
    if (m > bestC) {
      bestC = m;
      best = c;
    }
  }
  return best;
}

function toSpec(e: Entry): BadgeSpec {
  const [bg, ring] = e.c;
  return { abbr: e.a, bg, ring, fg: textOn(e.split ? [bg, ring] : [bg]), split: e.split || undefined, known: true };
}

const exact = new Map<string, BadgeSpec>();
const loose = new Map<string, BadgeSpec>();
for (const e of [...(data.nations as Entry[]), ...(data.clubs as Entry[])]) {
  const spec = toSpec(e);
  for (const k of [e.n, ...(e.aka ?? [])]) {
    const n = normName(k);
    if (!exact.has(n)) exact.set(n, spec);
    const c = core(n);
    if (c && !loose.has(c)) loose.set(c, spec);
  }
}

/** Automatisches Kürzel: erstes markantes Wort, 3 Buchstaben (bzw. Initialen) */
export function autoAbbr(name: string): string {
  const words = core(normName(name)).split(" ").filter(Boolean);
  if (!words.length) return "?";
  const w = words.find((x) => x.length >= 3 && !/^\d+$/.test(x)) ?? words[0];
  return w.slice(0, 3).toUpperCase();
}

const cache = new Map<string, BadgeSpec>();

export function badgeFor(name: string | null | undefined): BadgeSpec {
  const raw = (name ?? "").trim();
  const hit = cache.get(raw);
  if (hit) return hit;
  const n = normName(raw);
  const spec = exact.get(n) ??
    loose.get(core(n)) ?? { abbr: autoAbbr(raw), bg: FALLBACK_BG, ring: FALLBACK_RING, fg: "#FFFFFF", known: false };
  cache.set(raw, spec);
  return spec;
}
