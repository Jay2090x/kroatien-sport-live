"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Shield } from "lucide-react";
import {
  streamsForCountry,
  COUNTRY_LABELS,
} from "@/lib/free-streams";
import { SectionHeader } from "@/components/layout/section-header";

/**
 * Kompakter Legal-Hinweis – kein zweites TV-Board, nur Free-Mediatheken im Land.
 */
export function LegalStreamsStrip() {
  const t = useTranslations("TV");
  const tGuide = useTranslations("Guide");
  const locale = useLocale();
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { country?: string | null } | null) => {
        setCountry(d?.country ?? null);
      })
      .catch(() => setCountry(null));
  }, []);

  const streams = streamsForCountry(country).slice(0, 4);
  const countryName = country
    ? locale === "en"
      ? COUNTRY_LABELS[country]?.en
      : locale === "hr"
        ? COUNTRY_LABELS[country]?.hr
        : COUNTRY_LABELS[country]?.de
    : null;

  return (
    <section id="legal-tv" className="scroll-mt-16 border-t border-border pt-8">
      <SectionHeader
        title={t("localFree")}
        subtitle={
          countryName
            ? t("ipCountry", { country: countryName })
            : t("geoHint")
        }
        icon={<Shield className="h-4 w-4 text-primary" aria-hidden />}
      />
      <p className="mb-3 text-[11px] text-muted-foreground">{t("legalOnly")}</p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {streams.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40"
            >
              <span className="font-semibold">{s.name}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-muted-foreground">
        {tGuide("legalFootnote")}
      </p>
    </section>
  );
}
