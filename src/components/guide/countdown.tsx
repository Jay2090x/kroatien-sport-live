"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ kickoff }: { kickoff: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const diff = Math.max(0, new Date(kickoff).getTime() - now);
  if (diff <= 0) return <span className="font-mono text-live">00:00:00</span>;

  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);

  return (
    <span className="font-mono text-sm font-bold tabular-nums tracking-tight text-foreground">
      {h > 99 ? `${h}h` : `${pad(h)}:${pad(m)}:${pad(s)}`}
    </span>
  );
}
