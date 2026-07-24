"use server";

import { redirect } from "next/navigation";
import { invalidateLeagueData } from "@/lib/data-cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

export async function createTeam(_prevState: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  if (!name) return { error: "チーム名は必須です" };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("teams").insert({
    name,
    display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
    note: note || null,
  });
  if (error) return { error: error.message };

  invalidateLeagueData();
  redirect("/teams");
}

export async function updateTeam(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  if (!name) return { error: "チーム名は必須です" };

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name,
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      note: note || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  invalidateLeagueData();
  redirect("/teams");
}

export async function deleteTeam(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw new Error(error.message);

  invalidateLeagueData();
}
