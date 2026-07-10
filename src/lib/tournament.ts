/**
 * 決勝トーナメントの組み合わせ・勝敗判定・再試合チェーン解決（純粋関数）。
 * 要件定義書 §2.2, §6 準拠。
 */

export type Pairing = { home_team_id: string; away_team_id: string };

/** 準決勝1: 1位vs4位 / 準決勝2: 2位vs3位 */
export function buildSemifinalPairings(qualifiedTeamIds: string[]): [Pairing, Pairing] {
  if (qualifiedTeamIds.length < 4) {
    throw new Error("決勝トーナメント生成には上位4チームが必要です");
  }
  const [first, second, third, fourth] = qualifiedTeamIds;
  return [
    { home_team_id: first, away_team_id: fourth },
    { home_team_id: second, away_team_id: third },
  ];
}

export type MatchOutcomeInput = {
  id: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team_id: string;
  away_team_id: string;
  replay_of_match_id: string | null;
};

export type Outcome = { winner_team_id: string; loser_team_id: string };

/**
 * 終了かつスコアが決着していれば勝敗を返す。同点・未終了はnull。
 */
export function determineWinner(match: MatchOutcomeInput): Outcome | null {
  if (match.status !== "completed") return null;
  if (match.home_score === null || match.away_score === null) return null;
  if (match.home_score === match.away_score) return null;

  return match.home_score > match.away_score
    ? { winner_team_id: match.home_team_id, loser_team_id: match.away_team_id }
    : { winner_team_id: match.away_team_id, loser_team_id: match.home_team_id };
}

/**
 * rootMatchId を起点に再試合チェーンをたどり、一番新しい（最後の）試合を返す。
 * 再試合が無ければ root 自身を返す。
 */
export function findReplayChainLatest<T extends { id: string; replay_of_match_id: string | null }>(
  rootMatchId: string,
  matches: T[],
): T {
  let current = matches.find((m) => m.id === rootMatchId);
  if (!current) throw new Error(`match not found: ${rootMatchId}`);

  while (true) {
    const next = matches.find((m) => m.replay_of_match_id === current!.id);
    if (!next) return current;
    current = next;
  }
}

/**
 * rootMatchId（準決勝など）の再試合チェーンをたどった末に決着していれば勝敗を返す。
 * 同点再試合待ちのまま連鎖が途切れていればnull。
 */
export function getEffectiveOutcome(rootMatchId: string, matches: MatchOutcomeInput[]): Outcome | null {
  const latest = findReplayChainLatest(rootMatchId, matches);
  return determineWinner(latest);
}
