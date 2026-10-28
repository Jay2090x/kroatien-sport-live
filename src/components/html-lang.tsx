"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Ein gemeinsames Root-Layout liefert <html lang="de">; auf /hr-Seiten auf "hr" stellen (Screenreader, Übersetzer). */
export const HTML_LANG_BOOT = `(function(){try{if(/^\\/hr(\\/|$)/.test(location.pathname))document.documentElement.lang="hr"}catch(e){}})();`;

export function HtmlLang() {
  const path = usePathname();
  useEffect(() => {
    document.documentElement.lang = /^\/hr(\/|$)/.test(path ?? "") ? "hr" : "de";
  }, [path]);
  return null;
}
