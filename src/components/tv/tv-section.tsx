"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Shield, MapPin } from "lucide-react";
import { LEGAL_DISCLAIMER, TV_CHANNELS } from "@/lib/constants";
import { COUNTRY_LABELS, streamsForCountry } from "@/lib/free-streams";
import { SectionHeader } from "@/components/layout/section-header";

/**
 * Legal-Launch: nur Free-Mediatheken im Nutzerland + offizielle Anbieter-Homepages.
 * Kein VPN, kein Affiliate, kein Sky/DAZN.
 */
export function TvSection() {
  const t = useTranslations("TV");
  const locale = useLocale();
  const [country, setCountry] = useState<string | null>(null);
  const [geoReady, setGeoReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { country?: string | null } | null) => {
        if (!cancelled) {
          setCountry(data?.country ?? null);
          setGeoReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setGeoReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const localFree = streamsForCountry(country);
  const countryName = country
    ? locale === "en"
      ? COUNTRY_LABELS[country]?.en
      : locale === "hr"
        ? COUNTRY_LABELS[country]?.hr
        : COUNTRY_LABELS[country]?.de
    : t("unknownCountry");

  const official = TV_CHANNELS.filter((c) => c.type === "free" || c.region?.includes("HR"));

  return (
    <section id="tv" className="scroll-mt-16 space-y-4">
      <SectionHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={<Shield className="h-4 w-4 text-primary" aria-hidden />}
      />

      <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground/90">{t("disclaimerTitle")}: </strong>
        {LEGAL_DISCLAIMER}
      </div>

      <div>
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-bold">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {t("localFree")}
        </h3>
        <p className="mb-2 text-[11px] text-muted-foreground">
          {geoReady
            ? t("ipCountry", { country: countryName || t("unknownCountry") })
            : t("detecting")}
          {" · "}
          {t("legalOnly")}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {localFree.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm hover:border-primary/40"
              >
                <span>
                  <span className="font-semibold">{s.name}</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {locale === "en"
                      ? s.note.en
                      : locale === "hr"
                        ? s.note.hr
                        : s.note.de}
                  </span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold">{t("moreProviders")}</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {official.map((ch) => (
            <li key={ch.id}>
              <a
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-card/80 px-3 py-2 text-sm hover:border-primary/40"
              >
                <span className="font-medium">{ch.name}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
