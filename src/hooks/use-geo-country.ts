"use client";

import { useEffect, useState } from "react";

/**
 * Client geo for TV filtering (same source as TV section).
 */
export function useGeoCountry(): {
  country: string | null;
  ready: boolean;
} {
  const [country, setCountry] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { country?: string | null } | null) => {
        if (cancelled) return;
        setCountry(data?.country ? String(data.country).toUpperCase() : null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setCountry(null);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { country, ready };
}
