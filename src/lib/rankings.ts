export type RankingEvent = {
  player_name: string;
  team_id: string;
  event_type: string;
};

export type RankingRow = {
  rank: number;
  player_name: string;
  team_id: string;
  count: number;
};

/**
 * 選手名＋チームの組で同一人物とみなして件数を集計し、順位付けする。
 * 同数は同順位（1,1,3のように次の順位を飛ばす）。
 */
export function computePlayerRankings(events: RankingEvent[], eventType: string): RankingRow[] {
  const counts = new Map<string, { player_name: string; team_id: string; count: number }>();

  for (const event of events) {
    if (event.event_type !== eventType) continue;
    const key = `${event.player_name}::${event.team_id}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { player_name: event.player_name, team_id: event.team_id, count: 1 });
    }
  }

  const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);

  const rows: RankingRow[] = [];
  let rank = 0;
  let previousCount: number | null = null;

  sorted.forEach((entry, index) => {
    if (entry.count !== previousCount) {
      rank = index + 1;
      previousCount = entry.count;
    }
    rows.push({ rank, ...entry });
  });

  return rows;
}
