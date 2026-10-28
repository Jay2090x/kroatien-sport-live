"use client";

import { useEffect } from "react";

/** Mobil: aktive Rubrik in der waagrechten Navigationsleiste sichtbar machen (ohne Seiten-Scroll). */
export function NavScroll() {
  useEffect(() => {
    const nav = document.getElementById("site-nav");
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const cur = nav.querySelector<HTMLElement>('a[aria-current="page"]');
    if (cur) nav.scrollLeft = Math.max(0, cur.offsetLeft - nav.offsetLeft - nav.clientWidth / 2 + cur.offsetWidth / 2);
  }, []);
  return null;
}
