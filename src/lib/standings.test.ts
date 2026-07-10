import { describe, expect, it } from "vitest";
import {
  computeStandings,
  type StandingsMatch,
  type StandingsTeam,
} from "./standings";

const team = (id: string, order: number): StandingsTeam => ({
  id,
  name: id,
  display_order: order,
});

const match = (
  home: string,
  hs: number,
  away: string,
  as: number,
): StandingsMatch => ({
  home_team_id: home,
  away_team_id: away,
  home_score: hs,
  away_score: as,
});

describe("computeStandings", () => {
  it("試合が無ければ全チーム0で、表示順どおりに並ぶ", () => {
    const { rows, fullyResolved } = computeStandings(
      [team("A", 0), team("B", 1)],
      [],
    );
    expect(rows.map((r) => r.team_id)).toEqual(["A", "B"]);
    expect(rows.every((r) => r.played === 0 && r.points === 0)).toBe(true);
    // 全員0で並ぶので確定できない
    expect(fullyResolved).toBe(false);
    expect(rows.every((r) => r.provisional)).toBe(true);
  });

  it("勝点で順位が決まり、勝ち/分け/負けを正しく数える", () => {
    const teams = [team("A", 0), team("B", 1), team("C", 2)];
    const matches = [
      match("A", 2, "B", 0), // A win
      match("A", 1, "C", 1), // draw
      match("B", 0, "C", 3), // C win
    ];
    const { rows } = computeStandings(teams, matches);
    const a = rows.find((r) => r.team_id === "A")!;
    const c = rows.find((r) => r.team_id === "C")!;
    const b = rows.find((r) => r.team_id === "B")!;
    // A: 1勝1分=4, C: 1勝1分=4, B: 2敗=0 → A と C は勝点同じ、得失差で決着
    expect(a.points).toBe(4);
    expect(c.points).toBe(4);
    expect(b.points).toBe(0);
    expect(b.rank).toBe(3);
    // C の得失差(+3-1=+2)> A(+2-1=+1) なので C が1位
    expect(c.rank).toBe(1);
    expect(a.rank).toBe(2);
  });

  it("勝点が同じなら得失点差で決まる", () => {
    const teams = [team("A", 0), team("B", 1)];
    // 両者1勝1敗で勝点3、A の得失差を上にする
    const matches = [match("A", 5, "B", 0), match("B", 1, "A", 0)];
    const { rows, fullyResolved } = computeStandings(teams, matches);
    expect(rows[0].team_id).toBe("A");
    expect(rows[0].rank).toBe(1);
    expect(rows[1].rank).toBe(2);
    expect(fullyResolved).toBe(true);
  });

  it("勝点・得失差が同じでも直接対決の勝点で決まる（総得点数までは見ない）", () => {
    // A は B に直接対決で2連勝（h2h: A 6pt/GD+4, B 0pt/GD-4）。
    // B は第三チーム C との試合で得たポイント・得失差で全体では A と並ぶが、
    // 直接対決（A対Bの試合だけ）では A が明確に上回るため、そこで決着する。
    const teams = [team("A", 0), team("B", 1), team("C", 2)];
    const matches: StandingsMatch[] = [
      // 直接対決: A の2連勝
      match("A", 2, "B", 0),
      match("B", 0, "A", 2),
      // B だけが C と対戦し、全体の勝点・得失差を A に合わせる
      match("B", 5, "C", 1),
      match("C", 1, "B", 5),
    ];
    const { rows, fullyResolved } = computeStandings(teams, matches);
    const a = rows.find((r) => r.team_id === "A")!;
    const b = rows.find((r) => r.team_id === "B")!;
    // 全体では勝点・得失差ともに一致する
    expect(a.points).toBe(b.points);
    expect(a.goal_difference).toBe(b.goal_difference);
    // 直接対決で A が上回るためここで確定する
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(2);
    expect(a.provisional).toBe(false);
    expect(b.provisional).toBe(false);
    expect(fullyResolved).toBe(true);
  });

  it("勝点・得失差・直接対決まで並ぶ場合は総得点数で決まる", () => {
    // A と B は全体の勝点・得失差が一致し、直接対決（2試合とも1-1）も完全に並ぶ。
    // 第三チーム C との成績で総得点数だけに差をつけて決着させる。
    const teams = [team("A", 0), team("B", 1), team("C", 2)];
    const matches: StandingsMatch[] = [
      // 直接対決: 2試合とも1-1の引き分け
      match("A", 1, "B", 1),
      match("B", 1, "A", 1),
      // 対Cで同じ勝点・得失差（+5）だが、B のほうが総得点は多い
      match("A", 3, "C", 0),
      match("C", 0, "A", 2),
      match("B", 3, "C", 1),
      match("C", 1, "B", 4),
    ];
    const { rows, fullyResolved } = computeStandings(teams, matches);
    const a = rows.find((r) => r.team_id === "A")!;
    const b = rows.find((r) => r.team_id === "B")!;
    expect(a.points).toBe(b.points);
    expect(a.goal_difference).toBe(b.goal_difference);
    // 総得点数（goals_for）は B のほうが多い
    expect(b.goals_for).toBeGreaterThan(a.goals_for);
    expect(b.rank).toBe(1);
    expect(a.rank).toBe(2);
    expect(a.provisional).toBe(false);
    expect(b.provisional).toBe(false);
    expect(fullyResolved).toBe(true);
  });

  it("直接対決（ミニリーグ）で同点を解消する", () => {
    // A,B,C が勝点・得失差・得点・勝利数まで全体では並ぶが、
    // 3チーム間の直接対決で差がつくケース
    const teams = [team("A", 0), team("B", 1), team("C", 2), team("D", 3)];
    // A,B,C は D に対して全勝、D は3敗。A,B,C 間は総当たりで循環に見えないよう構成
    const matches: StandingsMatch[] = [
      // 各自 D に勝つ（同じ 2-0）
      match("A", 2, "D", 0),
      match("B", 2, "D", 0),
      match("C", 2, "D", 0),
      // A,B,C 直接対決: A が2チームに勝ち、B が C に勝つ（順位 A>B>C）
      match("A", 1, "B", 0),
      match("A", 1, "C", 0),
      match("B", 1, "C", 0),
    ];
    const { rows } = computeStandings(teams, matches);
    // D は最下位
    expect(rows.find((r) => r.team_id === "D")!.rank).toBe(4);
    // A,B,C は全体では勝点差がつく（A9,B6,C3）ので、実は第1段階で決まる
    const a = rows.find((r) => r.team_id === "A")!;
    const b = rows.find((r) => r.team_id === "B")!;
    const c = rows.find((r) => r.team_id === "C")!;
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(2);
    expect(c.rank).toBe(3);
    expect(a.points).toBe(9);
    expect(b.points).toBe(6);
    expect(c.points).toBe(3);
  });

  it("直接対決でも並ぶ完全同点は同順位・provisional・未確定になる", () => {
    // A と B が全指標で並び、直接対決も引き分け → 決着不能
    const teams = [team("A", 0), team("B", 1)];
    const matches = [match("A", 1, "B", 1), match("B", 1, "A", 1)];
    const { rows, fullyResolved } = computeStandings(teams, matches);
    expect(rows[0].rank).toBe(1);
    expect(rows[1].rank).toBe(1); // 同順位
    expect(rows.every((r) => r.provisional)).toBe(true);
    expect(fullyResolved).toBe(false);
    // 表示順（display_order）で仮に並ぶ
    expect(rows.map((r) => r.team_id)).toEqual(["A", "B"]);
  });

  it("同順位の次のチームには人数分ずれた順位が付く（1,1,3）", () => {
    // A,B が完全同点で1位、C は明確に下位
    const teams = [team("A", 0), team("B", 1), team("C", 2)];
    const matches: StandingsMatch[] = [
      match("A", 3, "C", 0),
      match("B", 3, "C", 0),
      match("A", 0, "B", 0),
      match("B", 0, "A", 0),
    ];
    const { rows } = computeStandings(teams, matches);
    const a = rows.find((r) => r.team_id === "A")!;
    const b = rows.find((r) => r.team_id === "B")!;
    const c = rows.find((r) => r.team_id === "C")!;
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(1);
    expect(c.rank).toBe(3);
    expect(a.provisional).toBe(true);
    expect(b.provisional).toBe(true);
    expect(c.provisional).toBe(false);
  });
});
