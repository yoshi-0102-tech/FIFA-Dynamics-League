import { describe, expect, it } from "vitest";
import {
  buildSemifinalPairings,
  determineWinner,
  findReplayChainLatest,
  getEffectiveOutcome,
  type MatchOutcomeInput,
} from "./tournament";

describe("buildSemifinalPairings", () => {
  it("準決勝1は1位vs4位、準決勝2は2位vs3位", () => {
    const [semi1, semi2] = buildSemifinalPairings(["T1", "T2", "T3", "T4"]);
    expect(semi1).toEqual({ home_team_id: "T1", away_team_id: "T4" });
    expect(semi2).toEqual({ home_team_id: "T2", away_team_id: "T3" });
  });

  it("4チーム未満だとエラー", () => {
    expect(() => buildSemifinalPairings(["T1", "T2", "T3"])).toThrow();
  });
});

describe("determineWinner", () => {
  const base: MatchOutcomeInput = {
    id: "m1",
    status: "completed",
    home_score: 2,
    away_score: 1,
    home_team_id: "H",
    away_team_id: "A",
    replay_of_match_id: null,
  };

  it("ホーム勝利ならホームが勝者", () => {
    expect(determineWinner(base)).toEqual({ winner_team_id: "H", loser_team_id: "A" });
  });

  it("アウェイ勝利ならアウェイが勝者", () => {
    expect(determineWinner({ ...base, home_score: 0, away_score: 3 })).toEqual({
      winner_team_id: "A",
      loser_team_id: "H",
    });
  });

  it("同点はnull（再試合対象のため勝者未確定）", () => {
    expect(determineWinner({ ...base, home_score: 1, away_score: 1 })).toBeNull();
  });

  it("未終了はnull", () => {
    expect(determineWinner({ ...base, status: "scheduled" })).toBeNull();
  });

  it("スコア未入力はnull", () => {
    expect(determineWinner({ ...base, home_score: null })).toBeNull();
  });
});

describe("findReplayChainLatest / getEffectiveOutcome", () => {
  it("再試合が無ければroot自身を返す", () => {
    const matches: MatchOutcomeInput[] = [
      { id: "semi1", status: "completed", home_score: 2, away_score: 1, home_team_id: "H", away_team_id: "A", replay_of_match_id: null },
    ];
    expect(findReplayChainLatest("semi1", matches).id).toBe("semi1");
    expect(getEffectiveOutcome("semi1", matches)).toEqual({ winner_team_id: "H", loser_team_id: "A" });
  });

  it("同点再試合待ちのままなら未決着(null)", () => {
    const matches: MatchOutcomeInput[] = [
      { id: "semi1", status: "draw_replay_needed", home_score: 1, away_score: 1, home_team_id: "H", away_team_id: "A", replay_of_match_id: null },
    ];
    expect(getEffectiveOutcome("semi1", matches)).toBeNull();
  });

  it("1回の再試合で決着したチェーンをたどる", () => {
    const matches: MatchOutcomeInput[] = [
      { id: "semi1", status: "draw_replay_needed", home_score: 1, away_score: 1, home_team_id: "H", away_team_id: "A", replay_of_match_id: null },
      { id: "replay1", status: "completed", home_score: 3, away_score: 2, home_team_id: "H", away_team_id: "A", replay_of_match_id: "semi1" },
    ];
    expect(findReplayChainLatest("semi1", matches).id).toBe("replay1");
    expect(getEffectiveOutcome("semi1", matches)).toEqual({ winner_team_id: "H", loser_team_id: "A" });
  });

  it("複数回の再試合チェーンを最後までたどる", () => {
    const matches: MatchOutcomeInput[] = [
      { id: "semi1", status: "draw_replay_needed", home_score: 0, away_score: 0, home_team_id: "H", away_team_id: "A", replay_of_match_id: null },
      { id: "replay1", status: "draw_replay_needed", home_score: 1, away_score: 1, home_team_id: "H", away_team_id: "A", replay_of_match_id: "semi1" },
      { id: "replay2", status: "completed", home_score: 0, away_score: 2, home_team_id: "H", away_team_id: "A", replay_of_match_id: "replay1" },
    ];
    expect(findReplayChainLatest("semi1", matches).id).toBe("replay2");
    expect(getEffectiveOutcome("semi1", matches)).toEqual({ winner_team_id: "A", loser_team_id: "H" });
  });
});
