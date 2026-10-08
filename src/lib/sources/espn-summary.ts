import { fetchJson } from "../http";
import { SITE_API } from "./espn";

/**
 * ESPN-Spielbericht ("summary"): Spieltagskader (rosters) + Ereignisse
 * (keyEvents: Tore, Karten, Wechsel). Kein API-Key nötig.
 * Zuordnung ausschließlich über ESPN-Athleten-IDs – kein Namensabgleich.
 */

interface RawStat {
  name?: string;
  value?: number;
}
interface RawRosterEntry {
  athlete?: { id?: string; displayName?: string };
  starter?: boolean;
  subbedIn?: boolean | { didSub?: boolean };
  subbedOut?: boolean | { didSub?: boolean };
  stats?: RawStat[];
}
interface RawKeyEvent {
  type?: { text?: string; type?: string };
  clock?: { displayValue?: string };
  team?: { id?: string };
  participants?: Array<{ athlete?: { id?: string } }>;
}
interface RawSummary {
  header?: {
    competitions?: Array<{ status?: { type?: { name?: string; state?: string; completed?: boolean } } }>;
  };
  rosters?: Array<{ team?: { id?: string }; roster?: RawRosterEntry[] }>;
  keyEvents?: RawKeyEvent[];
}

export interface SummaryEvent {
  kind: "goal" | "penalty" | "owngoal" | "yellow" | "red" | "sub";
  minute: string; // Anzeige, z. B. "45+2'"
  base: number | null; // Minute ohne Nachspielzeit
  athleteIds: string[]; // bei Wechsel: [rein, raus]
}

export interface SummaryPlayer {
  id: string;
  name: string;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
  stats: Record<string, number>;
}

export interface MatchSummary {
  statusName: string;
  state: string; // pre | in | post
  /** Spieltagskader je ESPN-Team-ID (leer = noch nicht veröffentlicht) */
  rosters: Record<string, SummaryPlayer[]>;
  events: SummaryEvent[];
}

function flag(v: boolean | { didSub?: boolean } | undefined): boolean {
  if (typeof v === "boolean") return v;
  return Boolean(v?.didSub);
}

function parseMinute(display: string): { minute: string; base: number | null } {
  const nums = display.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length === 0) return { minute: display, base: null };
  const minute = nums.length > 1 ? `${nums[0]}+${nums[1]}'` : `${nums[0]}'`;
  return { minute, base: nums[0] };
}

function kindOf(text: string): SummaryEvent["kind"] | null {
  const t = text.toLowerCase();
  if (t.includes("own goal")) return "owngoal";
  if (t.startsWith("penalty - scored")) return "penalty";
  if (t.startsWith("goal")) return "goal";
  if (t.includes("red card")) return "red";
  if (t.includes("yellow card")) return "yellow";
  if (t.startsWith("substitution")) return "sub";
  return null;
}

export function parseSummary(json: RawSummary): MatchSummary {
  const status = json.header?.competitions?.[0]?.status?.type;
  const rosters: Record<string, SummaryPlayer[]> = {};
  for (const r of json.rosters ?? []) {
    const teamId = r.team?.id;
    if (!teamId) continue;
    rosters[teamId] = (r.roster ?? [])
      .filter((x) => x.athlete?.id)
      .map((x) => ({
        id: String(x.athlete!.id),
        name: x.athlete?.displayName ?? "",
        starter: Boolean(x.starter),
        subbedIn: flag(x.subbedIn),
        subbedOut: flag(x.subbedOut),
        stats: Object.fromEntries(
          (x.stats ?? [])
            .filter((s) => s.name && typeof s.value === "number")
            .map((s) => [s.name as string, s.value as number])
        ),
      }));
  }
  const events: SummaryEvent[] = [];
  for (const k of json.keyEvents ?? []) {
    const kind = kindOf(k.type?.text ?? "");
    if (!kind) continue;
    const { minute, base } = parseMinute(k.clock?.displayValue ?? "");
    events.push({
      kind,
      minute,
      base,
      athleteIds: (k.participants ?? []).map((p) => String(p.athlete?.id ?? "")),
    });
  }
  return {
    statusName: (status?.name ?? "").toUpperCase(),
    state: status?.state ?? (status?.completed ? "post" : "pre"),
    rosters,
    events,
  };
}

export async function loadSummary(slug: string, eventId: string): Promise<MatchSummary> {
  const json = await fetchJson<RawSummary>(`${SITE_API}/${slug}/summary?event=${eventId}`);
  if (!json.header) throw new Error(`ESPN summary ${eventId}: unexpected format`);
  return parseSummary(json);
}

/** Einsatz eines Spielers in einem Spiel (nur Fakten aus dem Spielbericht). */
export interface Performance {
  /** false = ESPN hat für dieses Spiel keinen Spieltagskader */
  rosterAvailable: boolean;
  inSquad: boolean;
  starter: boolean;
  subIn: string | null; // Minute der Einwechslung
  subOut: string | null; // Minute der Auswechslung
  played: boolean;
  /** Spielminuten ohne Nachspielzeit (aus Wechsel-/Platzverweis-Minuten berechnet) */
  minutes: number | null;
  goals: number;
  goalMinutes: string[];
  assists: number | null;
  ownGoals: number;
  yellow: string[]; // Minuten
  red: string | null; // Minute
}

export function performanceOf(
  s: MatchSummary,
  teamId: string,
  athleteId: string
): Performance {
  const roster = s.rosters[teamId] ?? [];
  const empty: Performance = {
    rosterAvailable: roster.length > 0,
    inSquad: false,
    starter: false,
    subIn: null,
    subOut: null,
    played: false,
    minutes: null,
    goals: 0,
    goalMinutes: [],
    assists: null,
    ownGoals: 0,
    yellow: [],
    red: null,
  };
  const p = roster.find((x) => x.id === athleteId);
  if (!p) return empty;

  const mine = (k: SummaryEvent["kind"], idx = 0) =>
    s.events.filter((e) => e.kind === k && e.athleteIds[idx] === athleteId);
  const subInEv = mine("sub", 0)[0];
  const subOutEv = mine("sub", 1)[0];
  const goalEvs = [...mine("goal"), ...mine("penalty")];
  const yellowEvs = mine("yellow");
  const redEv = mine("red")[0];

  const played = p.starter || p.subbedIn || Boolean(subInEv);
  const extraTime = /AET|PEN|PK|EXTRA|SHOOTOUT/.test(s.statusName);
  const full = extraTime ? 120 : 90;
  let minutes: number | null = null;
  if (played && s.state === "post") {
    const start = p.starter ? 0 : subInEv?.base ?? null;
    const endEv = redEv ?? subOutEv;
    const end = endEv ? endEv.base : p.subbedOut ? null : full;
    if (start != null && end != null) minutes = Math.max(0, Math.min(full, end) - start);
  }
  const stat = (n: string) => (typeof p.stats[n] === "number" ? p.stats[n] : null);
  const goals = stat("totalGoals") ?? goalEvs.length;
  const reds = stat("redCards");
  return {
    rosterAvailable: true,
    inSquad: true,
    starter: p.starter,
    subIn: subInEv?.minute ?? (p.subbedIn ? "?" : null),
    subOut: subOutEv?.minute ?? (p.subbedOut ? "?" : null),
    played,
    minutes,
    goals,
    goalMinutes: goalEvs.map((e) => e.minute),
    assists: stat("goalAssists"),
    ownGoals: stat("ownGoals") ?? mine("owngoal").length,
    yellow: yellowEvs.length
      ? yellowEvs.map((e) => e.minute)
      : Array.from({ length: stat("yellowCards") ?? 0 }, () => "?"),
    red: redEv?.minute ?? (reds && reds > 0 ? "?" : null),
  };
}

/** Aufstellungsstatus vor/während eines Spiels. */
export type LineupStatus = "unknown" | "start" | "bench" | "out";

export function lineupStatusOf(s: MatchSummary, teamId: string, athleteId: string): LineupStatus {
  const roster = s.rosters[teamId] ?? [];
  if (roster.length === 0) return "unknown";
  const p = roster.find((x) => x.id === athleteId);
  if (!p) return "out";
  return p.starter ? "start" : "bench";
}
