"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enableWebPush } from "@/lib/notifications/push";
import { STORAGE_KEYS, safeJsonParse } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Soft prompt: enable match reminders (native Notification API).
 * Hidden if permission already granted/denied or user dismissed.
 */
export function PushPrompt() {
  const t = useTranslations("Push");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;
    if (localStorage.getItem(STORAGE_KEYS.pushPromptDismissed) === "1") return;

    const visits =
      Number(localStorage.getItem(STORAGE_KEYS.visitCount) || "0") || 0;
    // show from 2nd visit
    if (visits < 2) return;

    const timer = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  async function enable() {
    const settings = safeJsonParse<{ onesignalAppId?: string }>(
      localStorage.getItem(STORAGE_KEYS.apiSettings),
      {}
    );
    const result = await enableWebPush(settings.onesignalAppId);
    if (result.ok) {
      toast.success(t("enabled"));
      setVisible(false);
      // enable match start prefs by default
      const notif = safeJsonParse<Record<string, unknown>>(
        localStorage.getItem(STORAGE_KEYS.notifications),
        {}
      );
      localStorage.setItem(
        STORAGE_KEYS.notifications,
        JSON.stringify({
          liveGoals: true,
          matchStart: true,
          lineupAnnounced: false,
          ...notif,
        })
      );
    } else {
      toast.error(result.message || t("denied"));
    }
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEYS.pushPromptDismissed, "1");
    setVisible(false);
  }

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-[4.5rem] z-40 mx-auto max-w-md rounded-xl border border-border bg-card p-3 shadow-xl sm:inset-x-auto sm:right-4 sm:bottom-4 lg:bottom-6",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      role="dialog"
      aria-label={t("title")}
    >
      <div className="flex gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Bell className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("title")}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {t("body")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => void enable()}>
              {t("enable")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              {t("later")}
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary"
          aria-label={t("later")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
