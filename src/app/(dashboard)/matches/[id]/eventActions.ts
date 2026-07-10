"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStageBucket, shouldGenerateSuspension } from "@/lib/cards";
import type { EventType, Stage } from "@/lib/types";

export type EventFormState = { error: string | null };

export async function createMatchEvent(
  matchId: string,
  _prevState: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const eventType = String(formData.get("event_type") ?? "") as EventType;
  const playerName = String(formData.get("player_name") ?? "").trim();
  const teamId = String(formData.get("team_id") ?? "");
  const minuteRaw = String(formData.get("minute") ?? "").trim();
  const relatedGoalEventIdRaw = String(formData.get("related_goal_event_id") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!playerName) return { error: "選手名は必須です" };
  if (!teamId) return { error: "所属チームは必須です" };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("match_events").insert({
    match_id: matchId,
    team_id: teamId,
    player_name: playerName,
    event_type: eventType,
    minute: minuteRaw ? Number(minuteRaw) : null,
    related_goal_event_id: relatedGoalEventIdRaw || null,
    note: note || null,
  });
  if (error) return { error: error.message };

  if (eventType === "yellow_card" || eventType === "red_card") {
    await maybeCreateSuspension({ matchId, playerName, teamId, eventType });
  }

  revalidatePath(`/matches/${matchId}`);
  return { error: null };
}

async function maybeCreateSuspension({
  matchId,
  playerName,
  teamId,
  eventType,
}: {
  matchId: string;
  playerName: string;
  teamId: string;
  eventType: "yellow_card" | "red_card";
}) {
  const supabase = createSupabaseServerClient();

  if (eventType === "red_card") {
    const { error } = await supabase.from("suspensions").insert({
      player_name: playerName,
      team_id: teamId,
      reason: "red_card",
      source_match_id: matchId,
      is_served: false,
    });
    if (error) throw new Error(error.message);
    return;
  }

  const { data: allMatches } = await supabase.from("matches").select("id, stage");
  const matchStageById = new Map((allMatches ?? []).map((m) => [m.id, m.stage as Stage]));
  const thisMatchStage = matchStageById.get(matchId) ?? "group";
  const currentBucket = getStageBucket(thisMatchStage);

  const { data: yellowEvents } = await supabase
    .from("match_events")
    .select("match_id")
    .eq("player_name", playerName)
    .eq("team_id", teamId)
    .eq("event_type", "yellow_card");

  const stageYellowCount = (yellowEvents ?? []).filter(
    (e) => getStageBucket(matchStageById.get(e.match_id) ?? "group") === currentBucket,
  ).length;

  if (shouldGenerateSuspension(stageYellowCount)) {
    const { error } = await supabase.from("suspensions").insert({
      player_name: playerName,
      team_id: teamId,
      reason: "yellow_accumulation",
      source_match_id: matchId,
      is_served: false,
    });
    if (error) throw new Error(error.message);
  }
}

export async function deleteMatchEvent(matchId: string, eventId: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("match_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath(`/matches/${matchId}`);
}
