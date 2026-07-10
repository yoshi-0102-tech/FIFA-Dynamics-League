import { describe, expect, it } from "vitest";
import { computePlayerRankings } from "./rankings";

describe("computePlayerRankings", () => {
  it("同一選手＋チームのイベントを合算する", () => {
    const rows = computePlayerRankings(
      [
        { player_name: "田中", team_id: "A", event_type: "goal" },
        { player_name: "田中", team_id: "A", event_type: "goal" },
        { player_name: "田中", team_id: "A", event_type: "assist" },
      ],
      "goal",
    );
    expect(rows).toEqual([{ rank: 1, player_name: "田中", team_id: "A", count: 2 }]);
  });

  it("同名でもチームが違えば別人として扱う", () => {
    const rows = computePlayerRankings(
      [
        { player_name: "田中", team_id: "A", event_type: "goal" },
        { player_name: "田中", team_id: "B", event_type: "goal" },
      ],
      "goal",
    );
    expect(rows).toHaveLength(2);
  });

  it("同数は同順位になり、次の順位を飛ばす", () => {
    const rows = computePlayerRankings(
      [
        { player_name: "A選手", team_id: "1", event_type: "goal" },
        { player_name: "A選手", team_id: "1", event_type: "goal" },
        { player_name: "B選手", team_id: "1", event_type: "goal" },
        { player_name: "B選手", team_id: "1", event_type: "goal" },
        { player_name: "C選手", team_id: "1", event_type: "goal" },
      ],
      "goal",
    );
    const ranks = rows.map((r) => r.rank);
    expect(ranks).toEqual([1, 1, 3]);
  });

  it("指定したイベント種別のみ集計する", () => {
    const rows = computePlayerRankings(
      [
        { player_name: "田中", team_id: "A", event_type: "goal" },
        { player_name: "田中", team_id: "A", event_type: "assist" },
      ],
      "assist",
    );
    expect(rows).toEqual([{ rank: 1, player_name: "田中", team_id: "A", count: 1 }]);
  });

  it("イベントが無ければ空配列を返す", () => {
    expect(computePlayerRankings([], "goal")).toEqual([]);
  });
});
