"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Shield, Tv2, AlertTriangle } from "lucide-react";
import { TV_CHANNELS, VPN_PROVIDERS, LEGAL_DISCLAIMER } from "@/lib/constants";

export function TvSection() {
  const t = useTranslations("TV");

  const typeLabel = (type: string) => {
    if (type === "free") return t("free");
    if (type === "paid") return t("paid");
    return t("streaming");
  };

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
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <div>
          <p className="text-xs font-semibold text-amber-200">{t("disclaimerTitle")}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground line-clamp-2">
            {LEGAL_DISCLAIMER}
          </p>
        </div>
      </div>

      {/* Channels */}
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
