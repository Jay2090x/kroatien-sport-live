"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ExternalLink,
  Shield,
  Tv2,
  AlertTriangle,
  MapPin,
  Globe2,
} from "lucide-react";
import { TV_CHANNELS, VPN_PROVIDERS, LEGAL_DISCLAIMER } from "@/lib/constants";
import {
  COUNTRY_LABELS,
  streamsForCountry,
  vpnStreamsForCountry,
  type FreeStream,
} from "@/lib/free-streams";
import { useLocale } from "next-intl";

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

  const typeLabel = (type: string) => {
    if (type === "free") return t("free");
    if (type === "paid") return t("paid");
    return t("streaming");
  };

  const localFree = streamsForCountry(country);
  const vpnFree = vpnStreamsForCountry(country);
  const lang = locale === "hr" || locale === "en" ? locale : "de";
  const countryLabel = country
    ? COUNTRY_LABELS[country]?.[lang] || country
    : t("unknownCountry");

  const note = (s: FreeStream) => s.note[lang];

  return (
    <section id="tv" className="scroll-mt-14" aria-labelledby="tv-title">
      <div className="mb-3">
        <h2
          id="tv-title"
          className="flex items-center gap-1.5 text-lg font-bold tracking-tight sm:text-xl"
        >
          <Tv2 className="h-5 w-5 text-primary" aria-hidden />
          {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div
        role="note"
        className="mb-3 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5"
      >
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
          aria-hidden
        />
        <div>
          <p className="text-xs font-semibold text-amber-200">
            {t("disclaimerTitle")}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {LEGAL_DISCLAIMER} {t("legalOnly")}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-primary/25 bg-primary/5 p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold">{t("localFree")}</h3>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {geoReady
              ? t("ipCountry", { country: countryLabel })
              : t("detecting")}
          </span>
        </div>
        <p className="mb-3 text-[11px] text-muted-foreground">{t("geoHint")}</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {localFree.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full items-start justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {note(s)}
                  </p>
                  <span className="mt-1 inline-block text-[10px] font-bold uppercase text-emerald-400">
                    {t("free")}
                  </span>
                </div>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Globe2 className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-bold">{t("vpnFree")}</h3>
        </div>
        <p className="mb-2 text-[11px] text-muted-foreground">
          {t("vpnFreeHint")}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {vpnFree.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{s.name}</p>
                  <span className="shrink-0 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[9px] font-bold">
                    VPN → {s.vpnCountry}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {note(s)}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <h3 className="mb-2 text-sm font-bold">{t("moreProviders")}</h3>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TV_CHANNELS.map((ch) => (
          <li key={ch.id}>
            <a
              href={ch.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{ch.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {typeLabel(ch.type)}
                  {ch.region ? ` · ${ch.region}` : ""}
                </p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-accent" aria-hidden />
          <h3 className="text-sm font-bold">{t("vpnTitle")}</h3>
        </div>
        <p className="mb-2 text-[10px] text-muted-foreground">
          <strong>Affiliate: </strong>
          {t("affiliateDisclosure")}
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {VPN_PROVIDERS.map((vpn) => (
            <li key={vpn.id}>
              <a
                href={vpn.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="block rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-accent/40"
              >
                <p className="text-sm font-semibold">
                  {vpn.name}
                  {vpn.isAffiliate && (
                    <span className="ml-1 text-[9px] font-normal text-muted-foreground">
                      Affiliate
                    </span>
                  )}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                  {vpn.description}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
