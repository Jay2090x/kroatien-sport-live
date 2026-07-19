"use client";

import { useTranslations } from "next-intl";
import { Sahovnica } from "./sahovnica";
import { SITE } from "@/lib/constants";

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Sahovnica size="sm" />
          <p className="text-sm font-semibold">{SITE.name}</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          © {year} {SITE.shortName} · {t("disclaimer")} · {t("madeWith")}
        </p>
      </div>
    </footer>
  );
}
