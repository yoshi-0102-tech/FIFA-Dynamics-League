import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "./supabase/server";
import { LEAGUE_DATA_CACHE_TAG } from "./data-cache";
import type { AppSetting, Match, MatchEvent, Suspension, Team } from "./types";

const CACHE_OPTIONS = {
  tags: [LEAGUE_DATA_CACHE_TAG],
  revalidate: 300,
};

export const getTeams = unstable_cache(
  async (): Promise<Team[]> => {
    const { data, error } = await createSupabaseServerClient()
      .from("teams")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["teams"],
  CACHE_OPTIONS,
);

export const getMatches = unstable_cache(
  async (): Promise<Match[]> => {
    const { data, error } = await createSupabaseServerClient()
      .from("matches")
      .select("*")
      .order("match_datetime", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["matches"],
  CACHE_OPTIONS,
);

export const getMatchEvents = unstable_cache(
  async (): Promise<MatchEvent[]> => {
    const { data, error } = await createSupabaseServerClient()
      .from("match_events")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["match-events"],
  CACHE_OPTIONS,
);

export const getSuspensions = unstable_cache(
  async (): Promise<Suspension[]> => {
    const { data, error } = await createSupabaseServerClient().from("suspensions").select("*");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["suspensions"],
  CACHE_OPTIONS,
);

export const getAppSettings = unstable_cache(
  async (): Promise<AppSetting[]> => {
    const { data, error } = await createSupabaseServerClient().from("app_settings").select("*");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["app-settings"],
  CACHE_OPTIONS,
);
