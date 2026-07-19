import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications
 * Registriert Push-Subscription oder triggert Test-Notification.
 * OneSignal REST API Integration – erweiterbar.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, playerId, message } = body as {
      action?: "subscribe" | "test";
      playerId?: string;
      message?: string;
    };

    if (action === "test") {
      // OneSignal Push senden (wenn REST API Key gesetzt)
      const appId = process.env.ONESIGNAL_APP_ID;
      const apiKey = process.env.ONESIGNAL_REST_API_KEY;

      if (!appId || !apiKey) {
        return NextResponse.json({
          success: true,
          delivered: false,
          message:
            "OneSignal nicht konfiguriert – nutze Browser Notification API clientseitig",
        });
      }

      const res = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${apiKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          included_segments: ["All"],
          headings: { en: "Kroatien Sport Live", de: "Kroatien Sport Live" },
          contents: {
            en: message || "Live update",
            de: message || "Live-Update",
          },
          data: { playerId },
        }),
      });

      const data = await res.json();
      return NextResponse.json({ success: res.ok, data });
    }

    return NextResponse.json({
      success: true,
      message: "Subscription acknowledged – extend with device tokens as needed",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Notification error",
        message: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
