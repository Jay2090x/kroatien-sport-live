"use client";

import { Flag, Newspaper, Radio, Users } from "lucide-react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "#vatreni", icon: Flag, de: "NT", en: "NT", hr: "NT" },
  { href: "#news", icon: Newspaper, de: "News", en: "News", hr: "Vijesti" },
  { href: "#dashboard", icon: Radio, de: "Spiele", en: "Matches", hr: "Utakmice" },
  { href: "#players", icon: Users, de: "Spieler", en: "Players", hr: "Igrači" },
] as const;

/**
 * Sticky Bottom-Nav nur auf Mobile (Daumen-Navigation)
 */
export function MobileBottomNav() {
  const locale = useLocale();
  const label = (item: (typeof ITEMS)[number]) =>
    locale === "hr" ? item.hr : locale === "en" ? item.en : item.de;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Schnellnavigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-[10px] font-semibold text-muted-foreground transition-colors",
                  "hover:bg-secondary hover:text-foreground active:scale-[0.98]"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label(item)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
