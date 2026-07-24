"use server";

import { invalidateLeagueData } from "@/lib/data-cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SettingsFormState = { error: string | null; success?: boolean };

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const tournamentName = String(formData.get("tournament_name") ?? "").trim();
  const yellowCards = Number(formData.get("yellow_cards_for_suspension"));
  const qualifiers = Number(formData.get("group_stage_qualifiers"));

  if (!tournamentName) return { error: "大会名は必須です" };
  if (!Number.isInteger(yellowCards) || yellowCards < 1) {
    return { error: "出場停止までのイエロー枚数は1以上の整数で入力してください" };
  }
  if (!Number.isInteger(qualifiers) || qualifiers < 2 || qualifiers % 2 !== 0) {
    return { error: "決勝トーナメント進出枠数は2以上の偶数で入力してください" };
  }

  const supabase = createSupabaseServerClient();
  const updates = [
    { key: "tournament_name", value: tournamentName },
    { key: "yellow_cards_for_suspension", value: String(yellowCards) },
    { key: "group_stage_qualifiers", value: String(qualifiers) },
  ];

  for (const update of updates) {
    const { error } = await supabase
      .from("app_settings")
      .update({ value: update.value })
      .eq("key", update.key);
    if (error) {
      invalidateLeagueData();
      return { error: error.message };
    }
  }

  invalidateLeagueData();
  return { error: null, success: true };
}
