import type { EventType, MatchStatus, Stage } from "@/lib/types";

export const STAGE_LABELS: Record<Stage, string> = {
  group: "グループリーグ",
  semifinal: "準決勝",
  final: "決勝",
  third_place: "3位決定戦",
  replay: "再試合",
};

export const STATUS_LABELS: Record<MatchStatus, string> = {
  scheduled: "未実施",
  completed: "終了",
  draw_replay_needed: "同点再試合待ち",
  postponed: "中止・延期",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  goal: "ゴール",
  assist: "アシスト",
  yellow_card: "イエロー",
  red_card: "レッド",
};
