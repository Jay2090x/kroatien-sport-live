import { formatStand } from "@/lib/time";
import { dict, type Lang } from "@/lib/i18n";

export function Stand({ fetchedAt, source, lang = "de" }: { fetchedAt: string | null; source?: string | null; lang?: Lang }) {
  if (!fetchedAt) return null;
  const t = dict(lang);
  return (
    <p className="stand">
      {t.stand}: {formatStand(fetchedAt, lang)} {t.oclock}
      {source ? ` · ${t.source}: ${source}` : ""}
    </p>
  );
}

export function NoData({ what, lang = "de" }: { what: string; lang?: Lang }) {
  return (
    <p className="nodata" role="status">
      {dict(lang).noData(what)}
    </p>
  );
}
