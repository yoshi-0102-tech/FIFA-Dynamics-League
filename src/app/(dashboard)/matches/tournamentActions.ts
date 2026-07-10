"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeStandings } from "@/lib/standings";
import { buildSemifinalPairings, getEffectiveOutcome, type MatchOutcomeInput } from "@/lib/tournament";
import type { Stage } from "@/lib/types";

export async function generateTournament() {
  const supabase = createSupabaseServerClient();

  const { data: groupMatches, error: groupError } = await supabase
    .from("matches")
    .select("id, status")
    .eq("stage", "group");
  if (groupError) throw new Error(groupError.message);

  if (!groupMatches || groupMatches.length === 0) {
    throw new Error("グループリーグの試合がまだありません");
  }
  if (groupMatches.some((m) => m.status !== "completed")) {
    throw new Error("グループリーグの全試合が終了してから生成してください");
  }

  const { data: existingSemifinals, error: semiError } = await supabase
    .from("matches")
    .select("id")
    .eq("stage", "semifinal");
  if (semiError) throw new Error(semiError.message);
  if (existingSemifinals && existingSemifinals.length > 0) {
    throw new Error("決勝トーナメントはすでに生成されています");
  }

  const [{ data: teams }, { data: qualifiersSetting }] = await Promise.all([
    supabase.from("teams").select("id, name, display_order").order("display_order", { ascending: true }),
    supabase.from("app_settings").select("value").eq("key", "group_stage_qualifiers").maybeSingle(),
  ]);

  const qualifiersCount = Number(qualifiersSetting?.value ?? 4);

  const { data: completedGroupMatches, error: fullMatchError } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, home_score, away_score")
    .eq("stage", "group")
    .eq("status", "completed");
  if (fullMatchError) throw new Error(fullMatchError.message);

  const { rows } = computeStandings(
    teams ?? [],
    (completedGroupMatches ?? []).map((m) => ({
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: m.home_score as number,
      away_score: m.away_score as number,
    })),
  );

  const qualifiedTeamIds = rows.slice(0, qualifiersCount).map((r) => r.team_id);
  const [semi1, semi2] = buildSemifinalPairings(qualifiedTeamIds);

  const { error: insertError } = await supabase.from("matches").insert([
    { stage: "semifinal" as Stage, round_name: "準決勝1", status: "scheduled", ...semi1 },
    { stage: "semifinal" as Stage, round_name: "準決勝2", status: "scheduled", ...semi2 },
  ]);
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/matches");
  redirect("/matches");
}

export async function createReplay(matchId: string) {
  const supabase = createSupabaseServerClient();

  const { data: source, error: fetchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  if (!source) throw new Error("試合が見つかりません");
  if (source.status !== "draw_replay_needed") {
    throw new Error("同点再試合待ちの試合のみ再試合を作成できます");
  }

  const { error: insertError } = await supabase.from("matches").insert({
    stage: "replay" as Stage,
    round_name: source.round_name,
    home_team_id: source.home_team_id,
    away_team_id: source.away_team_id,
    status: "scheduled",
    replay_of_match_id: matchId,
  });
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/matches");
}

/**
 * 準決勝2試合の勝敗（再試合チェーン込み）が両方決着したら、
 * 決勝・3位決定戦をまだ作っていなければ自動生成する。
 */
export async function reflectTournamentProgress() {
  const supabase = createSupabaseServerClient();

  const { data: finalMatches } = await supabase.from("matches").select("id").eq("stage", "final");
  if (finalMatches && finalMatches.length > 0) return;

  const { data: semifinals } = await supabase
    .from("matches")
    .select("id")
    .eq("stage", "semifinal")
    .is("replay_of_match_id", null);
  if (!semifinals || semifinals.length < 2) return;

  const { data: allMatches } = await supabase
    .from("matches")
    .select("id, status, home_score, away_score, home_team_id, away_team_id, replay_of_match_id");
  if (!allMatches) return;

  const outcomes: MatchOutcomeInput[] = allMatches;
  const [semi1Result, semi2Result] = semifinals.map((s) => getEffectiveOutcome(s.id, outcomes));

  if (!semi1Result || !semi2Result) return;

  const { error: insertError } = await supabase.from("matches").insert([
    {
      stage: "final" as Stage,
      round_name: "決勝",
      status: "scheduled",
      home_team_id: semi1Result.winner_team_id,
      away_team_id: semi2Result.winner_team_id,
    },
    {
      stage: "third_place" as Stage,
      round_name: "3位決定戦",
      status: "scheduled",
      home_team_id: semi1Result.loser_team_id,
      away_team_id: semi2Result.loser_team_id,
    },
  ]);
  if (insertError) throw new Error(insertError.message);

  revalidatePath("/matches");
}
