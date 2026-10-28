"use client";

import { useEffect } from "react";

/**
 * Hauptmenü-Verhalten (ohne Bibliothek, Menüs sind native <details>):
 * nur ein Menü offen, Klick daneben / Esc / Linkklick schließt; mobil aktive Rubrik in Sicht scrollen.
 */
export function NavScroll() {
  useEffect(() => {
    const nav = document.getElementById("site-nav");
    if (!nav) return;
    const menus = Array.from(nav.querySelectorAll<HTMLDetailsElement>("details.nav-menu"));
    const closeAll = (except?: HTMLDetailsElement) => menus.forEach((d) => d !== except && (d.open = false));
    const onToggle = (e: Event) => {
      const d = e.currentTarget as HTMLDetailsElement;
      if (d.open) closeAll(d);
    };
    const onDoc = (e: MouseEvent) => {
      if (!(e.target instanceof Node) || !nav.contains(e.target)) closeAll();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const open = menus.find((d) => d.open);
      if (open) {
        open.open = false;
        open.querySelector("summary")?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest(".nav-panel a")) closeAll();
    };
    menus.forEach((d) => d.addEventListener("toggle", onToggle));
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    nav.addEventListener("click", onClick);
    if (nav.scrollWidth > nav.clientWidth) {
      const cur = nav.querySelector<HTMLElement>(".nav-top.on");
      if (cur) nav.scrollLeft = Math.max(0, cur.offsetLeft - nav.offsetLeft - nav.clientWidth / 2 + cur.offsetWidth / 2);
    }
    return () => {
      menus.forEach((d) => d.removeEventListener("toggle", onToggle));
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
      nav.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
