"use server";

import { redirect } from "next/navigation";
import { invalidateLeagueData } from "@/lib/data-cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateRoundRobinFixtures } from "@/lib/fixtures";
import { resolveNextUnplayedMatchId } from "@/lib/cards";
import { reflectTournamentProgress } from "./tournamentActions";
import type { MatchStatus, Stage } from "@/lib/types";

export type FormState = { error: string | null };

function parseMatchForm(formData: FormData): { error: string } | { error: null; values: {
  home_team_id: string;
  away_team_id: string;
  stage: Stage;
  status: MatchStatus;
  match_datetime: string | null;
  home_score: number | null;
  away_score: number | null;
  note: string | null;
} } {
  const homeTeamId = String(formData.get("home_team_id") ?? "");
  const awayTeamId = String(formData.get("away_team_id") ?? "");
  const stage = String(formData.get("stage") ?? "group") as Stage;
  const status = String(formData.get("status") ?? "scheduled") as MatchStatus;
  const matchDatetimeRaw = String(formData.get("match_datetime") ?? "").trim();
  const homeScoreRaw = String(formData.get("home_score") ?? "").trim();
  const awayScoreRaw = String(formData.get("away_score") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!homeTeamId || !awayTeamId) return { error: "ホーム・アウェイチームは必須です" };
  if (homeTeamId === awayTeamId) return { error: "ホームとアウェイに同じチームは選べません" };

  const homeScore = homeScoreRaw === "" ? null : Number(homeScoreRaw);
  const awayScore = awayScoreRaw === "" ? null : Number(awayScoreRaw);

  if (status === "completed" && (homeScore === null || awayScore === null)) {
    return { error: "終了ステータスの場合はスコアが必須です" };
  }
  if (status === "completed" && stage !== "group" && homeScore === awayScore) {
    return { error: "決勝トーナメントで同点の場合は「同点再試合待ち」を選んでください" };
  }

  return {
    error: null,
    values: {
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      stage,
      status,
      match_datetime: matchDatetimeRaw ? new Date(matchDatetimeRaw).toISOString() : null,
      home_score: homeScore,
      away_score: awayScore,
      note: note || null,
    },
  };
}

export async function createMatch(_prevState: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseMatchForm(formData);
  if (parsed.error !== null) return { error: parsed.error };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("matches").insert(parsed.values);
  if (error) return { error: error.message };

  invalidateLeagueData();
  redirect("/matches");
}

export async function updateMatch(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseMatchForm(formData);
  if (parsed.error !== null) return { error: parsed.error };

  const supabase = createSupabaseServerClient();

  if (parsed.values.status === "completed") {
    await serveSuspensionsForCompletedMatch(id);
  }

  const { error } = await supabase.from("matches").update(parsed.values).eq("id", id);
  if (error) {
    invalidateLeagueData();
    return { error: error.message };
  }

  try {
    if (parsed.values.status === "completed") {
      await reflectTournamentProgress();
    }
  } finally {
    invalidateLeagueData();
  }

  redirect("/matches");
}

/**
 * 試合が「終了」になる直前に、この試合が「次の未実施試合」として
 * 解決されていた未消化の出場停止を消化済みにする。
 */
async function serveSuspensionsForCompletedMatch(matchId: string) {
  const supabase = createSupabaseServerClient();

  const [{ data: pendingSuspensions }, { data: matches }] = await Promise.all([
    supabase.from("suspensions").select("id, team_id, source_match_id").eq("is_served", false),
    supabase.from("matches").select("id, home_team_id, away_team_id, status, match_datetime, created_at"),
  ]);

  if (!pendingSuspensions || !matches) return;

  const idsToServe = pendingSuspensions
    .filter((s) => resolveNextUnplayedMatchId(s.team_id, matches, s.source_match_id) === matchId)
    .map((s) => s.id);

  if (idsToServe.length === 0) return;

  await supabase
    .from("suspensions")
    .update({ is_served: true, served_at: new Date().toISOString(), suspension_match_id: matchId })
    .in("id", idsToServe);
}

export async function deleteMatch(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("matches").delete().eq("id", id);
  if (error) throw new Error(error.message);

  invalidateLeagueData();
}

export async function generateGroupFixtures(mode: "overwrite" | "append") {
  const supabase = createSupabaseServerClient();

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id")
    .order("display_order", { ascending: true });
  if (teamsError) throw new Error(teamsError.message);
  if (!teams || teams.length < 2) {
    throw new Error("チームが2つ以上登録されている必要があります");
  }

  const fixtures = generateRoundRobinFixtures(teams.map((t) => t.id));
  const rows = fixtures.map((f) => ({
    stage: "group" as Stage,
    home_team_id: f.home_team_id,
    away_team_id: f.away_team_id,
    status: "scheduled" as MatchStatus,
  }));

  let mutated = false;
  try {
    if (mode === "overwrite") {
      const { error: deleteError } = await supabase.from("matches").delete().eq("stage", "group");
      if (deleteError) throw new Error(deleteError.message);
      mutated = true;
    }

    const { error: insertError } = await supabase.from("matches").insert(rows);
    if (insertError) throw new Error(insertError.message);
    mutated = true;
  } finally {
    if (mutated) invalidateLeagueData();
  }

  redirect("/matches");
}
