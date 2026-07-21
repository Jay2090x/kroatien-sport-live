"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Soft A2HS / install hint after a few visits.
 */
export function InstallHint() {
  const t = useTranslations("Pwa");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // track visits
    const visits =
      (Number(localStorage.getItem(STORAGE_KEYS.visitCount) || "0") || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.visitCount, String(visits));

    if (localStorage.getItem(STORAGE_KEYS.installHintDismissed) === "1") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (visits >= 2) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (visits >= 3 && isIos && isSafari) {
      setIosHint(true);
      setVisible(true);
    } else if (visits >= 2) {
      // may show later when bip fires
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEYS.installHintDismissed, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  }

  return (
    <div
      className="fixed inset-x-3 top-14 z-40 mx-auto max-w-md rounded-xl border border-border bg-card p-3 shadow-lg sm:left-auto sm:right-4 sm:top-16"
      role="status"
    >
      <div className="flex gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {iosHint ? t("iosBody") : t("body")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {deferred && (
              <Button type="button" size="sm" onClick={() => void install()}>
                {t("install")}
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              {t("dismiss")}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
