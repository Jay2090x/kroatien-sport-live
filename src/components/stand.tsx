import { formatStand } from "@/lib/time";

export function Stand({ fetchedAt, source }: { fetchedAt: string | null; source?: string | null }) {
  if (!fetchedAt) return null;
  return (
    <p className="stand">
      Stand: {formatStand(fetchedAt)} Uhr{source ? ` · Quelle: ${source}` : ""}
    </p>
  );
}

export function NoData({ what }: { what: string }) {
  return (
    <p className="nodata" role="status">
      {what}: derzeit keine Daten verfügbar. Bitte später erneut versuchen.
    </p>
  );
}
