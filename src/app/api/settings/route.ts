import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

/**
 * POST /api/settings
 * Speichert API-Keys / Notification-Prefs optional in Supabase (user_settings).
 * Ohne Auth: nur Bestätigung – Client speichert ohnehin in localStorage.
 *
 * Später: Supabase Auth + user_id RLS
 */

const schema = z.object({
  settings: z
    .object({
      theSportsDbKey: z.string().optional(),
      footballDataKey: z.string().optional(),
      onesignalAppId: z.string().optional(),
      updatedAt: z.string().optional(),
    })
    .optional(),
  notifications: z
    .object({
      liveGoals: z.boolean().optional(),
      matchStart: z.boolean().optional(),
      lineupAnnounced: z.boolean().optional(),
      favoritePlayerIds: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        persisted: false,
        message: "localStorage only – Supabase not configured",
      });
    }

    // Anonym / session-basiert speichern (optional Tabelle user_settings)
    // Ohne Login speichern wir nichts serverseitig (Privacy)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        persisted: false,
        message: "No auth session – client localStorage used",
      });
    }

    // Keys nicht im Klartext speichern in Production – hier nur Prefs
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: user.id,
        // API-Keys idealerweise verschlüsselt / nur clientseitig
        notifications: parsed.data.notifications ?? {},
        // the_sports_db_key / football_data_key bewusst optional
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Settings save failed",
        message: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
