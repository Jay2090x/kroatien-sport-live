"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Während das Spiel läuft (oder kurz vor Anpfiff): Seite alle `sec` Sekunden neu vom Server holen, nur wenn sichtbar. */
export function GameRefresh({ active, sec = 30 }: { active: boolean; sec?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const tick = () => {
      if (!document.hidden) router.refresh();
    };
    const id = setInterval(tick, sec * 1000);
    const onVis = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active, sec, router]);
  return null;
}
