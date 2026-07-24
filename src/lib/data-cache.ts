import "server-only";

import { revalidatePath, updateTag } from "next/cache";

export const LEAGUE_DATA_CACHE_TAG = "league-data";

export function invalidateLeagueData() {
  updateTag(LEAGUE_DATA_CACHE_TAG);
  revalidatePath("/", "layout");
}
