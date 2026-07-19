import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/status-suggestions
 * User meldet falschen System-Status (kein Self-Edit).
 * Speichert optional in Supabase `status_suggestions`, sonst nur 200 (Client hat localStorage).
 */

const schema = z.object({
  id: z.string(),
  playerId: z.string(),
  playerName: z.string(),
  currentStatus: z.string(),
  suggestedStatus: z.string(),
  message: z.string().min(3).max(2000),
  createdAt: z.string(),
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
    if (supabase) {
      const { error } = await supabase.from("status_suggestions").insert({
        id: parsed.data.id,
        player_id: parsed.data.playerId,
        player_name: parsed.data.playerName,
        current_status: parsed.data.currentStatus,
        suggested_status: parsed.data.suggestedStatus,
        message: parsed.data.message,
        created_at: parsed.data.createdAt,
        status: "pending",
      });

      if (error) {
        // Tabelle fehlt oft – trotzdem OK (Client speichert lokal)
        return NextResponse.json({
          success: true,
          persisted: false,
          message: error.message,
        });
      }

      return NextResponse.json({ success: true, persisted: true });
    }

    return NextResponse.json({
      success: true,
      persisted: false,
      message: "Stored client-side only (no Supabase)",
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "Suggestion failed",
        message: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
