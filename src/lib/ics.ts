/**
 * ICS calendar export – client-side only, no third-party tracking.
 * Events describe kick-off times; no streaming claims.
 */

export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startIso: string;
  /** Duration in minutes (default 120) */
  durationMin?: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC timestamp for ICS: 20260802T180000Z */
export function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

export function buildIcsCalendar(
  events: IcsEvent[],
  calendarName = "Kroatien Sport Live"
): string {
  const stamp = toIcsUtc(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kroatien Sport Live//Match Calendar//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
  ];

  for (const ev of events) {
    const start = toIcsUtc(ev.startIso);
    if (!start) continue;
    const endDate = new Date(ev.startIso);
    endDate.setMinutes(endDate.getMinutes() + (ev.durationMin ?? 120));
    const end = toIcsUtc(endDate.toISOString());
    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${escapeIcs(ev.uid)}@kroatien-sport-live`));
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(foldLine(`SUMMARY:${escapeIcs(ev.title)}`));
    if (ev.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeIcs(ev.description)}`));
    }
    if (ev.location) {
      lines.push(foldLine(`LOCATION:${escapeIcs(ev.location)}`));
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(filename: string, icsBody: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([icsBody], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
