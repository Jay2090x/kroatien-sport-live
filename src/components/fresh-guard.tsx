"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * ISR liefert dem ersten Besucher nach längerer Pause noch die alte Fassung aus
 * (stale-while-revalidate) und baut erst im Hintergrund neu. Ist die gelieferte
 * Fassung älter als 3 Min., holen wir sie nach kurzer Wartezeit einmal (bzw. bis zu
 * dreimal) neu – ohne kompletten Reload, Scrollposition bleibt.
 */
const MAX_AGE_MS = 3 * 60_000;
const MAX_TRIES = 3;

export function FreshGuard({ renderedAt }: { renderedAt: string }) {
  const router = useRouter();
  const tries = useRef(0);
  useEffect(() => {
    const age = Date.now() - Date.parse(renderedAt);
    if (!(age > MAX_AGE_MS) || tries.current >= MAX_TRIES) return;
    tries.current++;
    const t = setTimeout(() => router.refresh(), 2500 + tries.current * 2500);
    return () => clearTimeout(t);
  }, [renderedAt, router]);
  return null;
}
