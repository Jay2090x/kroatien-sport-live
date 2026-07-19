"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { STORAGE_KEYS, safeJsonParse } from "@/lib/utils";
import type { ApiSettings, NotificationPreferences } from "@/types";
import { useRouter, usePathname } from "@/i18n/navigation";
import { enableWebPush } from "@/lib/notifications/push";

const defaultSettings: ApiSettings = {
  theSportsDbKey: "",
  footballDataKey: "",
  onesignalAppId: "",
};

const defaultNotif: NotificationPreferences = {
  liveGoals: true,
  matchStart: true,
  lineupAnnounced: false,
  favoritePlayerIds: [],
};

export function SettingsModal() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { settingsOpen, setSettingsOpen } = useDashboard();

  const [settings, setSettings] = useState<ApiSettings>(defaultSettings);
  const [notif, setNotif] = useState<NotificationPreferences>(defaultNotif);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settingsOpen || typeof window === "undefined") return;
    setSettings(
      safeJsonParse(localStorage.getItem(STORAGE_KEYS.apiSettings), defaultSettings)
    );
    setNotif(
      safeJsonParse(localStorage.getItem(STORAGE_KEYS.notifications), defaultNotif)
    );
  }, [settingsOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload: ApiSettings = {
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.apiSettings, JSON.stringify(payload));
      localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(notif));

      // Optional: an API senden für Supabase-Persistenz (user-scoped später)
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: payload, notifications: notif }),
        });
      } catch {
        // Offline / kein Backend – localStorage reicht
      }

      toast.success(t("saved"));
      setSettingsOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEnablePush() {
    const result = await enableWebPush(settings.onesignalAppId);
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  }

  function switchLocale(next: "de" | "en" | "hr") {
    router.replace(pathname, { locale: next });
  }

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent
        title={t("title")}
        onClose={() => setSettingsOpen(false)}
        className="sm:max-w-lg"
      >
        {/* Language */}
        <fieldset className="mb-6">
          <legend className="mb-2 text-sm font-semibold">{t("language")}</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "de" as const, label: "🇩🇪 Deutsch" },
                { id: "en" as const, label: "🇬🇧 English" },
                { id: "hr" as const, label: "🇭🇷 Hrvatski" },
              ] as const
            ).map((l) => (
              <Button
                key={l.id}
                type="button"
                size="sm"
                variant={locale === l.id ? "default" : "outline"}
                onClick={() => switchLocale(l.id)}
                aria-pressed={locale === l.id}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </fieldset>

        {/* API Keys */}
        <fieldset className="mb-6 space-y-3">
          <legend className="text-sm font-semibold">{t("apiKeys")}</legend>
          <p className="text-xs text-muted-foreground">{t("apiHint")}</p>

          <div>
            <label htmlFor="tsdb" className="mb-1 block text-xs font-medium">
              {t("theSportsDb")}
            </label>
            <Input
              id="tsdb"
              type="password"
              autoComplete="off"
              value={settings.theSportsDbKey}
              onChange={(e) =>
                setSettings((s) => ({ ...s, theSportsDbKey: e.target.value }))
              }
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="fd" className="mb-1 block text-xs font-medium">
              {t("footballData")}
            </label>
            <Input
              id="fd"
              type="password"
              autoComplete="off"
              value={settings.footballDataKey}
              onChange={(e) =>
                setSettings((s) => ({ ...s, footballDataKey: e.target.value }))
              }
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="os" className="mb-1 block text-xs font-medium">
              {t("onesignal")}
            </label>
            <Input
              id="os"
              type="text"
              autoComplete="off"
              value={settings.onesignalAppId ?? ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, onesignalAppId: e.target.value }))
              }
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
        </fieldset>

        {/* Notifications */}
        <fieldset className="mb-6 space-y-3">
          <legend className="text-sm font-semibold">{t("notifications")}</legend>

          <ToggleRow
            id="live-goals"
            label={t("notifLive")}
            checked={notif.liveGoals}
            onChange={(v) => setNotif((n) => ({ ...n, liveGoals: v }))}
          />
          <ToggleRow
            id="match-start"
            label={t("notifStart")}
            checked={notif.matchStart}
            onChange={(v) => setNotif((n) => ({ ...n, matchStart: v }))}
          />
          <ToggleRow
            id="lineup"
            label={t("notifLineup")}
            checked={notif.lineupAnnounced}
            onChange={(v) => setNotif((n) => ({ ...n, lineupAnnounced: v }))}
          />

          <Button type="button" variant="secondary" size="sm" onClick={handleEnablePush}>
            {t("enablePush")}
          </Button>
        </fieldset>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => setSettingsOpen(false)}>
            {t("close")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "…" : t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
      <label htmlFor={id} className="text-sm cursor-pointer">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
