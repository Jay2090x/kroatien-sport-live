"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_META, type Locale, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Einfacher Sprachwechsel DE | EN | HR in der Navbar
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-secondary/40 p-0.5",
        className
      )}
      role="group"
      aria-label="Language / Sprache / Jezik"
    >
      {routing.locales.map((l) => {
        const meta = LOCALE_META[l];
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            aria-pressed={active}
            title={meta.label}
            className={cn(
              "rounded px-1.5 py-1 text-[11px] font-bold tracking-wide transition-colors sm:px-2",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="sm:hidden">{meta.short}</span>
            <span className="hidden sm:inline">
              {meta.flag} {meta.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
