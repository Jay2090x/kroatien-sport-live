import { cachedSource } from "../cache";
import { fetchJson } from "../http";
import { countryDe } from "../names";
import { PLAYER_NAME } from "../players-meta";
import { COMPETITION_DE, ESPN_CROATIA_ID, SITE_API, loadEspnCroatiaMatches } from "./espn";

/**
 * Live-Ticker für Länderspiele (ESPN-Spielbericht).
 * - Aufstellung, sobald ESPN sie hat (meist ca. 1 Std. vor Anpfiff).
 * - Tore, Karten, Wechsel aus den Schlüsselereignissen (eigene DE/HR-Texte,
 *   kein Übernehmen fremder Kommentartexte).
 * - Nur Kroatien-Spiele (Event-ID wird gegen den Kroatien-Spielplan geprüft).
 */

const MIN = 60_000;
export const LIVE_WINDOW = { before: 90 * MIN, after: 150 * MIN } as const;

export type TickerKind = "goal" | "penalty" | "owngoal" | "yellow" | "red" | "sub" | "pen-miss" | "half" | "end";

export interface TickerEvent {
  kind: TickerKind;
  minute: string;
  teamId: string | null;
  /** [Haupt-Akteur, zweiter Akteur] – Tor: [Schütze, Vorlage]; Wechsel: [rein, raus] */
  names: string[];
}

export interface LineupPlayer {
  id: string;
  name: string;
  jersey: string | null;
  pos: string | null; // G | D | M | F
  starter: boolean;
}

export interface TickerSide {
  id: string;
  name: string; // deutsch
  score: number | null;
  formation: string | null;
  lineup: LineupPlayer[];
}

export interface Ticker {
  eventId: string;
  slug: string;
  kickoff: string;
  competition: string;
  venue: string | null;
  state: "pre" | "in" | "post";
  statusName: string;
  clock: string | null;
  home: TickerSide;
  away: TickerSide;
  events: TickerEvent[];
  fetchedAt: string;
}

export interface TickerTarget {
  eventId: string;
  slug: string;
  kickoff: string;
}

export interface LiveOverview {
  /** Spiel im Ticker-Fenster (90 min vor bis 150 min nach Anpfiff) oder laufend */
  active: TickerTarget | null;
  next: TickerTarget | null;
  last: TickerTarget | null;
}

interface RawComp {
  id?: string;
  team?: { id?: string; displayName?: string };
  score?: string | number;
  homeAway?: "home" | "away";
}
interface RawSummary {
  header?: {
    competitions?: Array<{
      date?: string;
      status?: { displayClock?: string; type?: { name?: string; state?: string; completed?: boolean; shortDetail?: string } };
      competitors?: RawComp[];
    }>;
    league?: { slug?: string; name?: string };
  };
  gameInfo?: { venue?: { fullName?: string; address?: { city?: string } } };
  rosters?: Array<{
    team?: { id?: string };
    formation?: string;
    roster?: Array<{
      athlete?: { id?: string; displayName?: string };
      jersey?: string;
      starter?: boolean;
      position?: { abbreviation?: string };
    }>;
  }>;
  keyEvents?: Array<{
    type?: { text?: string };
    clock?: { displayValue?: string };
    team?: { id?: string };
    participants?: Array<{ athlete?: { id?: string; displayName?: string } }>;
  }>;
}

export function kindOf(text: string): TickerKind | null {
  const t = text.toLowerCase();
  if (t.includes("own goal")) return "owngoal";
  if (t.startsWith("penalty - scored")) return "penalty";
  if (t.startsWith("penalty - missed") || t.startsWith("penalty - saved")) return "pen-miss";
  if (t.startsWith("goal")) return "goal";
  if (t.includes("red card")) return "red";
  if (t.includes("yellow card")) return "yellow";
  if (t.startsWith("substitution")) return "sub";
  if (t === "halftime") return "half";
  if (t.startsWith("end regular time") || t === "full time" || t.startsWith("end of extra")) return "end";
  return null;
}

function minuteOf(display: string): string {
  const nums = display.match(/\d+/g) ?? [];
  if (!nums.length) return "";
  return nums.length > 1 ? `${nums[0]}+${nums[1]}'` : `${nums[0]}'`;
}

const name = (id: string | undefined, fallback: string | undefined) => (id && PLAYER_NAME[id]) || fallback || "?";

export function parseTicker(json: RawSummary, eventId: string, slug: string, fetchedAt: string): Ticker {
  const c = json.header?.competitions?.[0];
  if (!c?.competitors?.length) throw new Error(`ESPN summary ${eventId}: no competitors`);
  const st = c.status?.type;
  const state = (st?.state === "in" || st?.state === "post" ? st.state : st?.completed ? "post" : "pre") as Ticker["state"];
  const side = (ha: "home" | "away"): TickerSide => {
    const x = c.competitors!.find((k) => k.homeAway === ha);
    const id = String(x?.team?.id ?? "");
    const r = json.rosters?.find((k) => String(k.team?.id) === id);
    const score = state === "pre" ? null : Number(x?.score);
    return {
      id,
      name: countryDe(x?.team?.displayName ?? "?"),
      score: score != null && Number.isFinite(score) ? score : null,
      formation: r?.formation ?? null,
      lineup: (r?.roster ?? [])
        .filter((p) => p.athlete?.id)
        .map((p) => ({
          id: String(p.athlete!.id),
          name: name(String(p.athlete!.id), p.athlete?.displayName),
          jersey: p.jersey ?? null,
          pos: p.position?.abbreviation ?? null,
          starter: Boolean(p.starter),
        })),
    };
  };
  const events: TickerEvent[] = [];
  for (const k of json.keyEvents ?? []) {
    const kind = kindOf(k.type?.text ?? "");
    if (!kind) continue;
    events.push({
      kind,
      minute: minuteOf(k.clock?.displayValue ?? ""),
      teamId: k.team?.id ? String(k.team.id) : null,
      names: (k.participants ?? []).map((p) => name(p.athlete?.id ? String(p.athlete.id) : undefined, p.athlete?.displayName)),
    });
  }
  const statusName = (st?.name ?? "").toUpperCase();
  let clock: string | null = null;
  if (state === "in") clock = statusName.includes("HALFTIME") ? "HT" : c.status?.displayClock ?? null;
  const v = json.gameInfo?.venue;
  return {
    eventId,
    slug,
    kickoff: new Date(c.date ?? 0).toISOString(),
    competition: COMPETITION_DE[slug] ?? json.header?.league?.name ?? "Länderspiel",
    venue: v?.fullName ? `${v.fullName}${v.address?.city ? `, ${v.address.city}` : ""}` : null,
    state,
    statusName,
    clock,
    home: side("home"),
    away: side("away"),
    events,
    fetchedAt,
  };
}

async function croatiaTargets(): Promise<TickerTarget[]> {
  const s = await cachedSource(["nt", "espn"], 600, loadEspnCroatiaMatches);
  if (!s) throw new Error("ESPN Croatia schedule unavailable");
  return s.data.raw
    .filter((r) => r.slug && !r.slug.endsWith(".friendly_u21"))
    .map((r) => ({ eventId: r.id, slug: r.slug!, kickoff: new Date(r.date).toISOString() }))
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
}

/** Welches Spiel gehört gerade in den Ticker? */
export async function getLiveOverview(now = Date.now()): Promise<LiveOverview | null> {
  try {
    const ts = await croatiaTargets();
    const active =
      ts.find((t) => {
        const k = Date.parse(t.kickoff);
        return now >= k - LIVE_WINDOW.before && now <= k + LIVE_WINDOW.after;
      }) ?? null;
    const next = ts.find((t) => Date.parse(t.kickoff) > now) ?? null;
    const last = [...ts].reverse().find((t) => Date.parse(t.kickoff) + LIVE_WINDOW.after < now) ?? null;
    return { active, next, last };
  } catch (err) {
    console.error("[data] live overview failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Ticker eines Kroatien-Spiels; im Live-Fenster 60 s gecacht, sonst 1 h (beendet: 24 h). */
export async function getTicker(eventId: string, now = Date.now()): Promise<Ticker | null> {
  try {
    const ts = await croatiaTargets();
    const t = ts.find((x) => x.eventId === eventId);
    if (!t) return null; // kein Kroatien-Spiel
    const k = Date.parse(t.kickoff);
    const live = now >= k - LIVE_WINDOW.before && now <= k + LIVE_WINDOW.after + 60 * MIN;
    const done = now > k + 6 * 3600_000;
    const ttl = live ? 60 : done ? 24 * 3600 : 3600;
    const mode = live ? "live" : done ? "final" : "pre";
    const s = await cachedSource(["live", eventId, mode], ttl, async () => {
      const json = await fetchJson<RawSummary>(`${SITE_API}/${t.slug}/summary?event=${eventId}`);
      return parseTicker(json, eventId, t.slug, new Date().toISOString());
    });
    return s ? { ...s.data, fetchedAt: s.fetchedAt } : null;
  } catch (err) {
    console.error("[data] ticker failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export { ESPN_CROATIA_ID };
