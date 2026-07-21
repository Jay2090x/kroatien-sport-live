"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Tv2 } from "lucide-react";
import type { LeagueId, Match } from "@/types";
import {
  filterChannelsForMarket,
  otherMarketFreeHints,
  rightsUpdatedAt,
} from "@/lib/broadcast-rights";
import { useGeoCountry } from "@/hooks/use-geo-country";
import { COUNTRY_LABELS } from "@/lib/free-streams";
import { LEGAL_DISCLAIMER } from "@/lib/constants";

function countryLabel(iso: string, locale: string): string {
  const row = COUNTRY_LABELS[iso];
  if (!row) return iso;
  if (locale === "en") return row.en;
  if (locale === "hr") return row.hr;
  return row.de;
}

/**
 * Match-spezifische TV-Hinweise: nur Geo-Markt + ehrlicher VPN-Hinweis.
 */
export function MatchTvBlock({ match }: { match: Match }) {
  const t = useTranslations("TvRights");
  const tTv = useTranslations("TV");
  const locale = useLocale();
  const { country, ready } = useGeoCountry();
  const local = filterChannelsForMarket(match.tvChannels, country);
  const vpnHints = otherMarketFreeHints(match.league as LeagueId, country);
  const updated = rightsUpdatedAt(match.league);
  const countryName = country
    ? countryLabel(country, locale)
    : t("unknownCountry");

  return (
    <section aria-labelledby="match-tv">
      <h2
        id="match-tv"
        className="mb-2 flex items-center gap-2 text-sm font-semibold"
      >
        <Tv2 className="h-4 w-4 text-primary" />
        {t("title")}
      </h2>

      {!ready ? (
        <p className="text-sm text-muted-foreground">{t("detecting")}</p>
      ) : (
        <>
          <p className="mb-2 text-[11px] text-muted-foreground">
            {t("forCountry", { country: countryName })}
            {updated ? ` · ${t("rightsAsOf", { date: updated })}` : ""}
          </p>

          {local.length === 0 ? (
            <p className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
              {t("noneLocal")}
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {local.map((ch) => (
                <li key={`${ch.id}-${ch.region}`}>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-secondary/50"
                  >
                    <span>
                      <span className="font-medium">{ch.name}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {ch.region}
                        {ch.certainty === "typical"
                          ? ` · ${t("typical")}`
                          : ""}
                      </span>
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          )}

          {vpnHints.length > 0 && (
            <div className="mt-3 rounded-lg border border-sky-500/25 bg-sky-500/5 px-3 py-2.5">
              <p className="text-xs font-semibold text-sky-200/95">
                {t("vpnTitle")}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {t("vpnBody")}
              </p>
              <ul className="mt-2 space-y-1">
                {vpnHints.slice(0, 4).map((h) => {
                  const label = countryLabel(h.market, locale);
                  return (
                    <li
                      key={h.market}
                      className="text-[11px] text-muted-foreground"
                    >
                      <span className="font-semibold text-foreground/90">
                        VPN → {label}:
                      </span>{" "}
                      {h.channels.map((c) => c.name).join(", ")}
                      <span className="text-muted-foreground/80">
                        {" "}
                        ({t("noGuarantee")})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200/90 dark:text-amber-100/80">
        <strong className="font-semibold">{tTv("disclaimerTitle")}: </strong>
        {LEGAL_DISCLAIMER}
      </p>
    </section>
  );
}
