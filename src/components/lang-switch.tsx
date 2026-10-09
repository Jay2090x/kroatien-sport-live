"use client";

import { useEffect } from "react";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

function setCookie(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  try {
    localStorage.setItem(LANG_COOKIE, lang);
  } catch {}
}

/** DE | HR – wechselt zwischen /pfad und /hr/pfad, Filter (?sport=) bleibt erhalten. */
export function LangSwitch({ lang, paths, label }: { lang: Lang; paths: Record<Lang, string>; label: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="lang" role="group" aria-label={label}>
      {(["de", "hr"] as Lang[]).map((l) => (
        <a
          key={l}
          href={paths[l]}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? "true" : undefined}
          className={l === lang ? "lang-on" : undefined}
          onClick={(e) => {
            setCookie(l);
            if (l === lang) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            window.location.href = `${paths[l]}${window.location.search}${window.location.hash}`;
          }}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
