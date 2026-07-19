/**
 * Web Push – OneSignal (optional) oder native Notification API Fallback
 * Ohne OneSignal App ID: Browser-Notifications lokal (Demo)
 */

export async function enableWebPush(
  onesignalAppId?: string
): Promise<{ ok: boolean; message: string }> {
  if (typeof window === "undefined") {
    return { ok: false, message: "Nur im Browser verfügbar" };
  }

  if (!("Notification" in window)) {
    return { ok: false, message: "Browser unterstützt keine Push-Nachrichten" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, message: "Berechtigung verweigert" };
    }

    // OneSignal lazy load (wenn App ID gesetzt)
    if (onesignalAppId) {
      await loadOneSignal(onesignalAppId);
      return { ok: true, message: "OneSignal Push aktiviert" };
    }

    // Demo-Notification
    new Notification("Kroatien Sport Live", {
      body: "Benachrichtigungen sind aktiv. Du wirst bei Live-Toren informiert.",
      icon: "/icon-192.png",
      tag: "ksl-welcome",
    });

    return { ok: true, message: "Push-Benachrichtigungen aktiv" };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Push-Aktivierung fehlgeschlagen",
    };
  }
}

async function loadOneSignal(appId: string) {
  // Dynamisches Laden des OneSignal SDK – erweiterbar
  // Docs: https://documentation.onesignal.com/docs/web-push-quickstart
  const w = window as Window & {
    OneSignalDeferred?: Array<(OneSignal: OneSignalStub) => void | Promise<void>>;
    OneSignal?: OneSignalStub;
  };

  if (!document.getElementById("onesignal-sdk")) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.id = "onesignal-sdk";
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("OneSignal SDK konnte nicht geladen werden"));
      document.head.appendChild(s);
    });
  }

  w.OneSignalDeferred = w.OneSignalDeferred || [];
  w.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: { enable: false },
    });
  });
}

interface OneSignalStub {
  init: (opts: Record<string, unknown>) => Promise<void>;
}

/**
 * Supabase Realtime Hook – optional für Live-Score-Updates
 * Verwendung in Client-Komponente:
 *
 * useEffect(() => {
 *   const client = createClient();
 *   if (!client) return;
 *   const channel = client.channel('matches')
 *     .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, payload => { ... })
 *     .subscribe();
 *   return () => { client.removeChannel(channel); };
 * }, []);
 */
