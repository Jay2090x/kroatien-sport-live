"use client";

import { MoreHorizontal, Newspaper, Radio, Star, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Sticky Bottom-Nav (Mobile): Live · Meine · News · Spieler · Mehr
 */
export function MobileBottomNav() {
  const t = useTranslations("Nav");
  const tFav = useTranslations("Favorites");
  const pathname = usePathname();
  const onHome = pathname === "/" || pathname === "";

  const items = [
    {
      href: "/#live-board",
      icon: Radio,
      label: t("navLive"),
      short: t("navLive"),
      hash: true as const,
    },
    {
      href: "/#favorites",
      icon: Star,
      label: tFav("navShort"),
      short: tFav("navShort"),
      hash: true as const,
    },
    {
      href: "/news",
      icon: Newspaper,
      label: t("news"),
      short: t("news").slice(0, 8),
      hash: false as const,
    },
    {
      href: "/#players",
      icon: Users,
      label: t("players"),
      short: t("players").slice(0, 8),
      hash: true as const,
    },
    {
      href: "/#more",
      icon: MoreHorizontal,
      label: t("navMore"),
      short: t("navMore"),
      hash: true as const,
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={t("quickNav")}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isNewsActive = !item.hash && pathname.includes("/news");
          return (
            <li key={item.href} className="flex-1 min-w-0">
              {item.hash ? (
                <a
                  href={onHome ? item.href.replace(/^\//, "") : item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-2 text-[9px] font-semibold text-muted-foreground transition-colors sm:text-[10px]",
                    "hover:bg-secondary hover:text-foreground active:scale-[0.98]"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="max-w-full truncate px-0.5">{item.short}</span>
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-2 text-[9px] font-semibold transition-colors sm:text-[10px]",
                    isNewsActive
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    "active:scale-[0.98]"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="max-w-full truncate px-0.5">{item.short}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
