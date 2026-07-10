import { describe, expect, it } from "vitest";
import {
  computeCardSummary,
  getStageBucket,
  resolveNextUnplayedMatchId,
  shouldGenerateSuspension,
  type CardEvent,
  type MatchForResolution,
  type SuspensionRecord,
} from "./cards";
import type { Stage } from "./types";

describe("getStageBucket", () => {
  it("groupは'group'、それ以外は'tournament'を返す", () => {
    expect(getStageBucket("group")).toBe("group");
    expect(getStageBucket("semifinal")).toBe("tournament");
    expect(getStageBucket("final")).toBe("tournament");
    expect(getStageBucket("third_place")).toBe("tournament");
    expect(getStageBucket("replay")).toBe("tournament");
  });
});

describe("shouldGenerateSuspension", () => {
  it("3の倍数に達したときのみtrueを返す", () => {
    expect(shouldGenerateSuspension(1)).toBe(false);
    expect(shouldGenerateSuspension(2)).toBe(false);
    expect(shouldGenerateSuspension(3)).toBe(true);
    expect(shouldGenerateSuspension(4)).toBe(false);
    expect(shouldGenerateSuspension(6)).toBe(true);
    expect(shouldGenerateSuspension(0)).toBe(false);
  });

  it("閾値を変更できる（app_settings の yellow_cards_for_suspension 相当）", () => {
    expect(shouldGenerateSuspension(2, 2)).toBe(true);
    expect(shouldGenerateSuspension(4, 2)).toBe(true);
    expect(shouldGenerateSuspension(3, 2)).toBe(false);
    expect(shouldGenerateSuspension(5, 0)).toBe(false);
  });
});

describe("resolveNextUnplayedMatchId", () => {
  const base: Omit<MatchForResolution, "id" | "match_datetime" | "created_at"> = {
    home_team_id: "A",
    away_team_id: "B",
    status: "scheduled",
  };

  it("日時が早い未実施試合を選ぶ", () => {
    const matches: MatchForResolution[] = [
      { ...base, id: "m2", match_datetime: "2026-08-02T00:00:00Z", created_at: "2026-01-01T00:00:00Z" },
      { ...base, id: "m1", match_datetime: "2026-08-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" },
    ];
    expect(resolveNextUnplayedMatchId("A", matches)).toBe("m1");
  });

  it("日時未設定の試合は日時ありの試合より後回しにする", () => {
    const matches: MatchForResolution[] = [
      { ...base, id: "m-no-date", match_datetime: null, created_at: "2026-01-01T00:00:00Z" },
      { ...base, id: "m-dated", match_datetime: "2026-08-01T00:00:00Z", created_at: "2026-01-02T00:00:00Z" },
    ];
    expect(resolveNextUnplayedMatchId("A", matches)).toBe("m-dated");
  });

  it("終了・中止・延期の試合は対象外", () => {
    const matches: MatchForResolution[] = [
      { ...base, id: "m-done", status: "completed", match_datetime: "2026-08-01T00:00:00Z", created_at: "x" },
      { ...base, id: "m-postponed", status: "postponed", match_datetime: "2026-08-02T00:00:00Z", created_at: "x" },
      { ...base, id: "m-next", status: "scheduled", match_datetime: "2026-08-03T00:00:00Z", created_at: "x" },
    ];
    expect(resolveNextUnplayedMatchId("A", matches)).toBe("m-next");
  });

  it("対象試合が無ければnullを返す", () => {
    expect(resolveNextUnplayedMatchId("Z", [])).toBeNull();
  });

  it("チームがホームでもアウェイでも対象にする", () => {
    const matches: MatchForResolution[] = [
      { id: "m1", home_team_id: "X", away_team_id: "A", status: "scheduled", match_datetime: null, created_at: "1" },
    ];
    expect(resolveNextUnplayedMatchId("A", matches)).toBe("m1");
  });
});

describe("computeCardSummary", () => {
  const matchStageById = new Map<string, Stage>([
    ["g1", "group"],
    ["g2", "group"],
    ["s1", "semifinal"],
  ]);

  it("通算イエローとステージ内イエローを分けて集計する", () => {
    const events: CardEvent[] = [
      { player_name: "選手A", team_id: "T1", event_type: "yellow_card", match_id: "g1" },
      { player_name: "選手A", team_id: "T1", event_type: "yellow_card", match_id: "g2" },
      { player_name: "選手A", team_id: "T1", event_type: "yellow_card", match_id: "s1" },
    ];
    const rows = computeCardSummary(events, matchStageById, [], "tournament", []);
    const row = rows.find((r) => r.player_name === "選手A");
    expect(row?.total_yellow).toBe(3);
    expect(row?.current_stage_yellow).toBe(1); // s1のみがtournamentバケット
  });

  it("未消化のsuspensionがあればis_suspended=trueで次の試合を解決する", () => {
    const suspensions: SuspensionRecord[] = [
      { id: "sus1", player_name: "選手B", team_id: "T1", reason: "red_card", is_served: false, source_match_id: "g1" },
    ];
    const matches: MatchForResolution[] = [
      { id: "next-match", home_team_id: "T1", away_team_id: "T2", status: "scheduled", match_datetime: null, created_at: "1" },
    ];
    const rows = computeCardSummary([], matchStageById, suspensions, "group", matches);
    const row = rows.find((r) => r.player_name === "選手B");
    expect(row?.is_suspended).toBe(true);
    expect(row?.next_suspension_match_id).toBe("next-match");
  });

  it("消化済みのsuspensionのみならis_suspended=false", () => {
    const suspensions: SuspensionRecord[] = [
      { id: "sus1", player_name: "選手C", team_id: "T1", reason: "yellow_accumulation", is_served: true, source_match_id: "g1" },
    ];
    const rows = computeCardSummary([], matchStageById, suspensions, "group", []);
    const row = rows.find((r) => r.player_name === "選手C");
    expect(row?.is_suspended).toBe(false);
    expect(row?.next_suspension_match_id).toBeNull();
  });

  it("発生元の試合がまだ未実施でも、次の試合として選ばれない", () => {
    const suspensions: SuspensionRecord[] = [
      {
        id: "sus1",
        player_name: "選手E",
        team_id: "T1",
        reason: "yellow_accumulation",
        is_served: false,
        source_match_id: "source-match",
      },
    ];
    const matches: MatchForResolution[] = [
      { id: "source-match", home_team_id: "T1", away_team_id: "T2", status: "scheduled", match_datetime: "2026-08-01T00:00:00Z", created_at: "1" },
      { id: "future-match", home_team_id: "T1", away_team_id: "T2", status: "scheduled", match_datetime: "2026-08-08T00:00:00Z", created_at: "2" },
    ];
    const rows = computeCardSummary([], matchStageById, suspensions, "group", matches);
    const row = rows.find((r) => r.player_name === "選手E");
    expect(row?.next_suspension_match_id).toBe("future-match");
  });

  it("レッドカード枚数も集計する", () => {
    const events: CardEvent[] = [
      { player_name: "選手D", team_id: "T1", event_type: "red_card", match_id: "g1" },
    ];
    const rows = computeCardSummary(events, matchStageById, [], "group", []);
    expect(rows.find((r) => r.player_name === "選手D")?.total_red).toBe(1);
  });
});
