"use client";

import { useTranslations } from "next-intl";
import { Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { Sahovnica } from "./sahovnica";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { GlobalSearch } from "./global-search";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Link } from "@/i18n/navigation";
import { SITE } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/#vatreni", key: "vatreni" as const, hash: true },
  { href: "/news", key: "news" as const, hash: false },
  { href: "/#dashboard", key: "matches" as const, hash: true },
  { href: "/#players", key: "players" as const, hash: true },
  { href: "/#tv", key: "tv" as const, hash: true },
];

export function Navbar() {
  const t = useTranslations("Nav");
  const { setSettingsOpen } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={SITE.name}
        >
          <Sahovnica size="md" />
          <div className="hidden min-[420px]:block">
            <span className="block text-sm font-bold leading-tight">
              {t("brandName")}
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-primary">
              {t("brandLive")}
            </span>
          </div>
        </Link>

        <nav
          className="ml-2 hidden items-center gap-0.5 lg:flex"
          aria-label="Hauptnavigation"
        >
          {NAV_LINKS.map((link) =>
            link.hash ? (
              <a
                key={link.key}
                href={link.href}
                className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {t(link.key)}
              </a>
            ) : (
              <Link
                key={link.key}
                href={link.href}
                className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {t(link.key)}
              </Link>
            )
          )}
        </nav>

        <GlobalSearch className="ml-auto" />

        <div className="flex shrink-0 items-center gap-0.5">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t("settings")}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="border-t border-border bg-background px-3 py-2 lg:hidden"
          aria-label="Mobile Navigation"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                {link.hash ? (
                  <a
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(link.key)}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-secondary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(link.key)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-border pt-2">
            <LanguageSwitcher className="w-full justify-stretch [&>button]:flex-1" />
          </div>
        </nav>
      )}
    </header>
  );
}
