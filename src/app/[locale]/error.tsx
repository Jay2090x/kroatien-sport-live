"use client";

import { useEffect } from "react";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Locale error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-semibold text-primary">Fehler / Error / Greška</p>
      <h1 className="text-xl font-bold">Seite konnte nicht geladen werden</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "Internal Server Error"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
