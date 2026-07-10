/**
 * グループリーグ順位表の集計（純粋関数）。要件定義書 §4.1 準拠。
 *
 * 順位決定ルール（上から順に適用）:
 *   1. 勝点  2. 得失点差  3. 得点数  4. 勝利数
 *   5. 直接対決の成績（同順位候補チーム同士の試合だけで 1〜4 を再計算）
 *   6. それでも並ぶ場合は同順位（仮順位は表示順）とし、`provisional=true` を立てる
 *
 * DB には集計結果を保存せず、呼び出し側が「グループリーグ かつ 終了」の試合を
 * 渡して都度計算する。集計結果は完全に入力に対して決定的（純粋関数）。
 */

export type StandingsTeam = {
  id: string;
  name: string;
  display_order: number;
};

export type StandingsMatch = {
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
};

export type StandingsRow = {
  rank: number;
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  /** このチームの順位が同順位争いで確定していない場合に true。 */
  provisional: boolean;
};

export type StandingsResult = {
  rows: StandingsRow[];
  /** すべての順位が一意に確定したかどうか。false のとき画面に注意書きを出す。 */
  fullyResolved: boolean;
};

type Stat = {
  team_id: string;
  team_name: string;
  display_order: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

/** 指定チーム集合の中だけで、渡された試合から成績を集計する。 */
function computeStats(
  teams: StandingsTeam[],
  matches: StandingsMatch[],
  idSet: Set<string>,
): Map<string, Stat> {
  const stats = new Map<string, Stat>();
  for (const t of teams) {
    stats.set(t.id, {
      team_id: t.id,
      team_name: t.name,
      display_order: t.display_order,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (!idSet.has(m.home_team_id) || !idSet.has(m.away_team_id)) continue;
    const home = stats.get(m.home_team_id);
    const away = stats.get(m.away_team_id);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goals_for += m.home_score;
    home.goals_against += m.away_score;
    away.goals_for += m.away_score;
    away.goals_against += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.home_score < m.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  for (const s of stats.values()) {
    s.goal_difference = s.goals_for - s.goals_against;
  }
  return stats;
}

/** 勝点→得失差→得点→勝利数 の4指標がすべて等しいか。 */
function keysEqual(a: Stat, b: Stat): boolean {
  return (
    a.points === b.points &&
    a.goal_difference === b.goal_difference &&
    a.goals_for === b.goals_for &&
    a.won === b.won
  );
}

/** 勝点→得失差→得点→勝利数 の降順比較（0 なら4指標同点）。 */
function compareKeys(a: Stat, b: Stat): number {
  return (
    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for ||
    b.won - a.won
  );
}

export function computeStandings(
  teams: StandingsTeam[],
  matches: StandingsMatch[],
): StandingsResult {
  const allIds = new Set(teams.map((t) => t.id));
  const base = computeStats(teams, matches, allIds);
  const statList = teams.map((t) => base.get(t.id)!);

  // 第1段階: 全体を 勝点→得失差→得点→勝利数（同点は表示順）で並べる
  const sorted = [...statList].sort(
    (a, b) => compareKeys(a, b) || a.display_order - b.display_order,
  );

  // 同順位バケツの列を作る（バケツ長 > 1 = その並びの中で確定していない）
  const buckets: Stat[][] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && keysEqual(sorted[i], sorted[j + 1])) j++;
    const group = sorted.slice(i, j + 1);

    if (group.length === 1) {
      buckets.push(group);
    } else {
      // 第5段階: 同順位候補チーム同士の直接対決だけで再集計（ミニリーグ）
      const groupIds = new Set(group.map((g) => g.team_id));
      const groupTeams = group.map((g) => ({
        id: g.team_id,
        name: g.team_name,
        display_order: g.display_order,
      }));
      const h2h = computeStats(groupTeams, matches, groupIds);
      const h2hSorted = [...group].sort((a, b) => {
        const A = h2h.get(a.team_id)!;
        const B = h2h.get(b.team_id)!;
        return compareKeys(A, B) || a.display_order - b.display_order;
      });

      // ミニリーグでも4指標が並ぶ連続チームは同順位（provisional）
      let k = 0;
      while (k < h2hSorted.length) {
        let l = k;
        while (
          l + 1 < h2hSorted.length &&
          keysEqual(h2h.get(h2hSorted[k].team_id)!, h2h.get(h2hSorted[l + 1].team_id)!)
        ) {
          l++;
        }
        buckets.push(h2hSorted.slice(k, l + 1));
        k = l + 1;
      }
    }
    i = j + 1;
  }

  // バケツから順位を割り当てる（同順位バケツは同一 rank、次は人数分ずらす）
  const rows: StandingsRow[] = [];
  let rank = 1;
  for (const bucket of buckets) {
    const provisional = bucket.length > 1;
    for (const s of bucket) {
      rows.push({
        rank,
        team_id: s.team_id,
        team_name: s.team_name,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goals_for: s.goals_for,
        goals_against: s.goals_against,
        goal_difference: s.goal_difference,
        points: s.points,
        provisional,
      });
    }
    rank += bucket.length;
  }

  const fullyResolved = buckets.every((b) => b.length === 1);
  return { rows, fullyResolved };
}
