import type { EventType, MatchStatus, Stage } from "./types";

export type StageBucket = "group" | "tournament";

export function getStageBucket(stage: Stage): StageBucket {
  return stage === "group" ? "group" : "tournament";
}

/** イエロー加算後の枚数が3の倍数に達したら出場停止を1回発生させる */
export function shouldGenerateSuspension(stageYellowCountAfterEvent: number): boolean {
  return stageYellowCountAfterEvent > 0 && stageYellowCountAfterEvent % 3 === 0;
}

export type MatchForResolution = {
  id: string;
  home_team_id: string;
  away_team_id: string;
  status: MatchStatus;
  match_datetime: string | null;
  created_at: string;
};

/**
 * チームの「次の未実施試合」を日時順（未設定は末尾）で動的に解決する。
 * 中止・延期・終了・同点再試合待ちの試合は対象外。
 * excludeMatchId: カード発生元の試合など、まだ結果未確定でも候補から除外したい試合ID。
 */
export function resolveNextUnplayedMatchId(
  teamId: string,
  matches: MatchForResolution[],
  excludeMatchId?: string,
): string | null {
  const candidates = matches.filter(
    (m) =>
      (m.home_team_id === teamId || m.away_team_id === teamId) &&
      m.status === "scheduled" &&
      m.id !== excludeMatchId,
  );

  const sorted = [...candidates].sort((a, b) => {
    if (a.match_datetime && b.match_datetime) {
      return new Date(a.match_datetime).getTime() - new Date(b.match_datetime).getTime();
    }
    if (a.match_datetime) return -1;
    if (b.match_datetime) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return sorted[0]?.id ?? null;
}

export type CardEvent = {
  player_name: string;
  team_id: string;
  event_type: EventType;
  match_id: string;
};

export type SuspensionRecord = {
  id: string;
  player_name: string;
  team_id: string;
  reason: "yellow_accumulation" | "red_card";
  is_served: boolean;
  source_match_id: string;
};

export type MatchStageInfo = {
  id: string;
  stage: Stage;
};

export type CardSummaryRow = {
  player_name: string;
  team_id: string;
  total_yellow: number;
  current_stage_yellow: number;
  total_red: number;
  pending_suspension_count: number;
  is_suspended: boolean;
  next_suspension_match_id: string | null;
};

/**
 * カード集計テーブル（§4.4）用の行データを計算する。
 * currentBucket: トーナメント日程が1件でも存在すれば 'tournament'、無ければ 'group'。
 */
export function computeCardSummary(
  events: CardEvent[],
  matchStageById: Map<string, Stage>,
  suspensions: SuspensionRecord[],
  currentBucket: StageBucket,
  matches: MatchForResolution[],
): CardSummaryRow[] {
  const keyOf = (playerName: string, teamId: string) => `${playerName}::${teamId}`;
  const players = new Map<string, { player_name: string; team_id: string }>();

  for (const e of events) {
    if (e.event_type !== "yellow_card" && e.event_type !== "red_card") continue;
    players.set(keyOf(e.player_name, e.team_id), { player_name: e.player_name, team_id: e.team_id });
  }
  for (const s of suspensions) {
    players.set(keyOf(s.player_name, s.team_id), { player_name: s.player_name, team_id: s.team_id });
  }

  const rows: CardSummaryRow[] = [];

  for (const { player_name, team_id } of players.values()) {
    const playerEvents = events.filter((e) => e.player_name === player_name && e.team_id === team_id);

    const total_yellow = playerEvents.filter((e) => e.event_type === "yellow_card").length;
    const total_red = playerEvents.filter((e) => e.event_type === "red_card").length;
    const current_stage_yellow = playerEvents.filter(
      (e) =>
        e.event_type === "yellow_card" &&
        getStageBucket(matchStageById.get(e.match_id) ?? "group") === currentBucket,
    ).length;

    const playerSuspensions = suspensions.filter(
      (s) => s.player_name === player_name && s.team_id === team_id,
    );
    const pending = playerSuspensions.filter((s) => !s.is_served);

    rows.push({
      player_name,
      team_id,
      total_yellow,
      current_stage_yellow,
      total_red,
      pending_suspension_count: pending.length,
      is_suspended: pending.length > 0,
      next_suspension_match_id:
        pending.length > 0 ? resolveNextUnplayedMatchId(team_id, matches, pending[0].source_match_id) : null,
    });
  }

  return rows.sort((a, b) => a.player_name.localeCompare(b.player_name, "ja"));
}
