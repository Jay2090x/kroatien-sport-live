/**
 * Minimaler iCalendar-Generator (RFC 5545) für abonnierbare Spielpläne.
 * Zeiten in UTC (…Z), damit jedes Handy sie korrekt in die lokale Zeit umrechnet.
 */
export interface IcsEvent {
  uid: string;
  start: string; // ISO
  durationMin: number;
  summary: string;
  description?: string;
  location?: string;
  url?: string;
  status?: "CONFIRMED" | "CANCELLED" | "TENTATIVE";
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function utc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Zeilen > 75 Oktette falten (UTF-8-sicher). */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out.join("\r\n ");
}

export function buildIcs(opts: { name: string; description: string; events: IcsEvent[]; now?: number }): string {
  const stamp = utc(new Date(opts.now ?? Date.now()).toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kroatien Sport Live//Kalender//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(opts.name)}`,
    `X-WR-CALDESC:${esc(opts.description)}`,
    "X-WR-TIMEZONE:Europe/Vienna",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];
  for (const e of opts.events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${utc(e.start)}`,
      `DURATION:PT${Math.round(e.durationMin)}M`,
      `SUMMARY:${esc(e.summary)}`
    );
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push(`STATUS:${e.status ?? "CONFIRMED"}`, "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
