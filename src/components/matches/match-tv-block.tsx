"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Tv2 } from "lucide-react";
import type { Match, TvChannel } from "@/types";
import { useGeoCountry } from "@/hooks/use-geo-country";
import { COUNTRY_LABELS } from "@/lib/free-streams";
import { LEGAL_DISCLAIMER, isAllowedTvChannel } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

function countryLabel(iso: string, locale: string): string {
  const row = COUNTRY_LABELS[iso];
  if (!row) return iso;
  if (locale === "en") return row.en;
  if (locale === "hr") return row.hr;
  return row.de;
}

/**
 * TV: nur redaktionell bestätigte Live-Sender.
 * Zeigt alle bestätigten Märkte (nicht nur Geo) – mit Hervorhebung des User-Landes.
 * Keine Spekulation, kein VPN, kein Affiliate.
 */
export function MatchTvBlock({ match }: { match: Match }) {
  const t = useTranslations("TvRights");
  const tTv = useTranslations("TV");
  const locale = useLocale();
  const { country, ready } = useGeoCountry();

  const confirmed = (match.tvChannels ?? []).filter(
    (c) =>
      isAllowedTvChannel(c.id) &&
      isAllowedTvChannel(c.name) &&
      c.certainty === "confirmed"
  );

  const countryName = country
    ? countryLabel(country, locale)
    : t("unknownCountry");

  const local = country
    ? confirmed.filter((c) => channelInMarket(c, country))
    : [];
  const other = country
    ? confirmed.filter((c) => !channelInMarket(c, country))
    : confirmed;

  // Group others by market label
  const byMarket = groupByMarket(other, locale);

  return (
    <section aria-labelledby="match-tv">
      <h2
        id="match-tv"
        className="mb-2 flex items-center gap-2 text-sm font-semibold"
      >
        <Tv2 className="h-4 w-4 text-primary" />
        {t("title")}
      </h2>

      <p className="mb-2 text-[11px] text-muted-foreground">
        {t("confirmedOnlyHint")}
        {ready && country
          ? ` · ${t("forCountry", { country: countryName })}`
          : !ready
            ? ` · ${t("detecting")}`
            : ""}
      </p>

      {confirmed.length === 0 ? (
        <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
          {t("noneConfirmed")}
        </p>
      ) : (
        <div className="space-y-3">
          {local.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                {t("inYourCountry", { country: countryName })}
              </p>
              <ChannelList channels={local} t={t} />
            </div>
          )}

          {byMarket.map(({ market, channels }) => (
            <div key={market}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("inMarket", { market })}
              </p>
              <ChannelList channels={channels} t={t} />
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200/90 dark:text-amber-100/80">
        <strong className="font-semibold">{tTv("disclaimerTitle")}: </strong>
        {LEGAL_DISCLAIMER}
      </p>
    </section>
  );
}

function channelInMarket(c: TvChannel, market: string): boolean {
  const m = market.toUpperCase();
  if (c.markets?.map((x) => x.toUpperCase()).includes(m)) return true;
  if (c.region) {
    return c.region
      .toUpperCase()
      .split(/[/,]/)
      .map((x) => x.trim())
      .includes(m);
  }
  return false;
}

function groupByMarket(
  channels: TvChannel[],
  locale: string
): { market: string; channels: TvChannel[] }[] {
  const map = new Map<string, TvChannel[]>();
  for (const ch of channels) {
    const keys =
      ch.markets?.length
        ? ch.markets
        : ch.region
          ? ch.region.split(/[/,]/).map((s) => s.trim())
          : ["—"];
    for (const k of keys) {
      const label = countryLabel(k, locale) || k;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(ch);
    }
  }
  return [...map.entries()].map(([market, channels]) => ({
    market,
    channels: dedupeChannels(channels),
  }));
}

function dedupeChannels(chs: TvChannel[]): TvChannel[] {
  const seen = new Set<string>();
  return chs.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

function ChannelList({
  channels,
  t,
}: {
  channels: TvChannel[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {channels.map((ch) => (
        <li key={`${ch.id}-${ch.region}`}>
          <a
            href={ch.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-secondary/50"
          >
            <span>
              <span className="font-medium">{ch.name}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                <Badge
                  variant="outline"
                  className="px-1 py-0 text-[9px] font-semibold text-emerald-300 border-emerald-500/40"
                >
                  {t("confirmedBadge")}
                </Badge>
                {ch.type === "free" ? t("free") : t("paid")}
              </span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </a>
        </li>
      ))}
    </ul>
  );
}
