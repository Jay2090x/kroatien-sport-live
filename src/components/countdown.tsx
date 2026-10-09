"use client";

import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";

function parts(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  return { days, hours, minutes };
}

/** Countdown bis zum Anpfiff (rein clientseitig, damit gecachtes HTML nie falsch zählt). */
export function Countdown({ kickoff, t }: { kickoff: string; t: Dict["countdown"] }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return <div className="countdown" aria-hidden="true" />;

  const diff = Date.parse(kickoff) - now;
  if (diff <= 0) {
    return (
      <div className="countdown">
        <span className="countdown-note">{t.started}</span>
      </div>
    );
  }
  const { days, hours, minutes } = parts(diff);
  return (
    <div className="countdown" role="timer" aria-label={t.label}>
      <span className="cd-unit">
        <strong>{days}</strong>
        <small>{days === 1 ? t.day : t.days}</small>
      </span>
      <span className="cd-unit">
        <strong>{hours}</strong>
        <small>{t.hours}</small>
      </span>
      <span className="cd-unit">
        <strong>{minutes}</strong>
        <small>{t.minutes}</small>
      </span>
    </div>
  );
}
