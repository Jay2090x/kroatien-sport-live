"use client";

import { useEffect, useState } from "react";

const TZ = "Europe/Vienna";

function todayVienna(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function diffDays(from: string, to: string): number {
  const [a, b] = [from, to].map((s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  });
  return Math.round((b - a) / 86_400_000);
}

/**
 * "noch N Tage" bis zu einem Kalendertag (Wiener Zeit). Clientseitig gerechnet,
 * damit gecachtes HTML nie falsch zählt. Texte: "{n}" wird ersetzt.
 */
export function DaysUntil({
  ymd,
  label,
  lang,
  today,
  one,
  many,
}: {
  ymd: string;
  label: string;
  lang: "de" | "hr";
  today: string;
  one: string;
  many: string;
}) {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setN(diffDays(todayVienna(), ymd));
    tick();
    const id = setInterval(tick, 60 * 60_000);
    return () => clearInterval(id);
  }, [ymd]);
  if (n === null || n < 0) return <div className="daysuntil" aria-hidden="true" />;
  const singular = lang === "hr" ? n % 10 === 1 && n % 100 !== 11 : n === 1;
  const text = n === 0 ? today : (singular ? one : many).replace("{n}", String(n));
  return (
    <div className="daysuntil" role="timer">
      <strong>{text}</strong>
      <small>{label}</small>
    </div>
  );
}
