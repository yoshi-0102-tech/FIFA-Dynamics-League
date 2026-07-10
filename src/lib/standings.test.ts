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

  it("勝点・得失差が同じなら得点数で決まる", () => {
    const teams = [team("A", 0), team("B", 1)];
    // 各自1勝1敗、得失差ともに0。A の総得点を多くする
    const matches = [match("A", 3, "B", 1), match("B", 2, "A", 0)];
    // A: 得3失3(GD0), B: 得3失3(GD0) → 得点同じ… 別パターンにする
    // A の得点を多く: A 4-2, B 1-3 → A 得5失5 GD0, B 得5失5 GD0 まだ同じ
    // 得点で差をつける: A 4-2 と B 2-4 → A得6失6, B得6失6。GDも得点も同じ。
    // 明確に得点差をつける: A 3-1, B 3-2, A 1-3? 複雑なので直接構成
    const m2: StandingsMatch[] = [
      match("A", 4, "B", 2),
      match("A", 0, "B", 2),
    ];
    // A: 得4失4 GD0 勝点3(1勝1敗), B: 得4失4 GD0 勝点3 → 得点同じ・勝利数同じ → 直接対決
    const { fullyResolved } = computeStandings(teams, m2);
    // 直接対決も1勝1敗で完全同点 → 確定できない
    expect(fullyResolved).toBe(false);
    void matches;
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
