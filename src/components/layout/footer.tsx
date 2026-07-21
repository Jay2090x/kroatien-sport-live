"use client";

import { useTranslations } from "next-intl";
import { Sahovnica } from "./sahovnica";
import { SITE } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl space-y-3 px-3 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <Sahovnica size="sm" />
            <div>
              <p className="text-sm font-semibold">{SITE.name}</p>
              <p className="mt-0.5 max-w-xs text-[11px] text-muted-foreground">
                {t("brandTagline")}
              </p>
            </div>
          </div>
          <nav
            className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
            aria-label={tNav("quickNav")}
          >
            <a href="#vatreni" className="hover:text-foreground">
              {tNav("vatreni")}
            </a>
            <a href="#news" className="hover:text-foreground">
              {tNav("news")}
            </a>
            <a href="#dashboard" className="hover:text-foreground">
              {tNav("matches")}
            </a>
            <a href="#players" className="hover:text-foreground">
              {tNav("players")}
            </a>
            <a href="#tv" className="hover:text-foreground">
              {tNav("tv")}
            </a>
          </nav>
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {t("sources")}
        </p>
        <p className="text-[11px] text-muted-foreground">
          © {year} {SITE.shortName} · {t("disclaimer")} · {t("madeWith")}
        </p>
      </div>
    </footer>
  );
}
