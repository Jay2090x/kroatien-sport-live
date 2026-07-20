"use client";

import { Flag, Newspaper, Radio, Tv2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "#vatreni", icon: Flag, key: "vatreni" as const },
  { href: "#news", icon: Newspaper, key: "news" as const },
  { href: "#dashboard", icon: Radio, key: "matches" as const },
  { href: "#players", icon: Users, key: "players" as const },
  { href: "#tv", icon: Tv2, key: "tv" as const },
] as const;

/**
 * Sticky Bottom-Nav nur auf Mobile
 */
export function MobileBottomNav() {
  const t = useTranslations("Nav");

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={t("quickNav")}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const short =
            item.key === "vatreni"
              ? "NT"
              : item.key === "tv"
                ? "TV"
                : t(item.key).split(" ")[0] || t(item.key);
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-semibold text-muted-foreground transition-colors",
                  "hover:bg-secondary hover:text-foreground active:scale-[0.98]"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="max-w-full truncate px-0.5">{short}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
