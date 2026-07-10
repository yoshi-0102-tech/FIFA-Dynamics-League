/**
 * 総当たり（ホーム＆アウェイ）の組み合わせを生成する純粋関数。
 * 各チームが他の全チームと2回（ホーム1回・アウェイ1回）対戦する。
 */
export function generateRoundRobinFixtures(
  teamIds: string[],
): { home_team_id: string; away_team_id: string }[] {
  const fixtures: { home_team_id: string; away_team_id: string }[] = [];

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = 0; j < teamIds.length; j++) {
      if (i === j) continue;
      fixtures.push({ home_team_id: teamIds[i], away_team_id: teamIds[j] });
    }
  }

  return fixtures;
}
