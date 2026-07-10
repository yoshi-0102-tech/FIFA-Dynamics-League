import { describe, expect, it } from "vitest";
import { generateRoundRobinFixtures } from "./fixtures";

describe("generateRoundRobinFixtures", () => {
  it("チームが2つなら2試合（ホーム・アウェイ各1）生成する", () => {
    const fixtures = generateRoundRobinFixtures(["A", "B"]);
    expect(fixtures).toHaveLength(2);
    expect(fixtures).toContainEqual({ home_team_id: "A", away_team_id: "B" });
    expect(fixtures).toContainEqual({ home_team_id: "B", away_team_id: "A" });
  });

  it("チームがN個ならN*(N-1)試合生成する", () => {
    const teams = ["A", "B", "C", "D", "E"];
    const fixtures = generateRoundRobinFixtures(teams);
    expect(fixtures).toHaveLength(5 * 4);
  });

  it("同一チーム同士の対戦は生成しない", () => {
    const fixtures = generateRoundRobinFixtures(["A", "B", "C"]);
    expect(fixtures.some((f) => f.home_team_id === f.away_team_id)).toBe(false);
  });

  it("各カードでホーム・アウェイが1回ずつ入れ替わる", () => {
    const fixtures = generateRoundRobinFixtures(["A", "B", "C"]);
    const abHome = fixtures.filter((f) => f.home_team_id === "A" && f.away_team_id === "B");
    const baHome = fixtures.filter((f) => f.home_team_id === "B" && f.away_team_id === "A");
    expect(abHome).toHaveLength(1);
    expect(baHome).toHaveLength(1);
  });

  it("チームが0または1つなら試合は生成されない", () => {
    expect(generateRoundRobinFixtures([])).toHaveLength(0);
    expect(generateRoundRobinFixtures(["A"])).toHaveLength(0);
  });
});
