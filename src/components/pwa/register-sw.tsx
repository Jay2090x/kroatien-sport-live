"use client";

import { useEffect } from "react";

/** Registers the placeholder service worker once in production / secure context */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Allow on localhost + production
    const run = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* silent – non-critical */
      });
    };
    if (document.readyState === "complete") run();
    else window.addEventListener("load", run);
    return () => window.removeEventListener("load", run);
  }, []);

  return null;
}
