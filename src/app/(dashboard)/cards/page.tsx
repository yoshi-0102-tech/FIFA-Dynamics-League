import { getMatches, getMatchEvents, getSuspensions, getTeams } from "@/lib/data";
import { computeCardSummary, type StageBucket } from "@/lib/cards";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";
import type { Stage } from "@/lib/types";

export default async function CardsPage() {
  const [events, matches, suspensions, teams] = await Promise.all([
    getMatchEvents(),
    getMatches(),
    getSuspensions(),
    getTeams(),
  ]);

  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));
  const matchStageById = new Map(matches.map((m) => [m.id, m.stage as Stage]));
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const currentBucket: StageBucket = matches.some((m) => m.stage !== "group") ? "tournament" : "group";

  const rows = computeCardSummary(
    events,
    matchStageById,
    suspensions,
    currentBucket,
    matches,
  );

  const totalSuspensionsByPlayer = new Map<string, number>();
  for (const s of suspensions) {
    const key = `${s.player_name}::${s.team_id}`;
    totalSuspensionsByPlayer.set(key, (totalSuspensionsByPlayer.get(key) ?? 0) + 1);
  }

  function formatMatchLabel(matchId: string | null): string {
    if (!matchId) return "-";
    const m = matchById.get(matchId);
    if (!m) return "-";
    const home = teamNameById.get(m.home_team_id) ?? "?";
    const away = teamNameById.get(m.away_team_id) ?? "?";
    const date = m.match_datetime
      ? new Date(m.match_datetime).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
      : "未定";
    return `${home} vs ${away}（${date}）`;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="カード・出場停止"
        description={`現在のステージ区分: ${
          currentBucket === "group" ? "グループリーグ" : "決勝トーナメント"
        }（決勝トーナメント進出時にステージ内イエローはリセットされます。通算イエローは残ります）`}
      />

      <Card className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground/60">選手名</th>
                <th className="px-4 py-3 font-medium text-foreground/60">チーム</th>
                <th className="px-4 py-3 text-right font-medium text-foreground/60">通算イエロー</th>
                <th className="px-4 py-3 text-right font-medium text-foreground/60">ステージ内イエロー</th>
                <th className="px-4 py-3 text-right font-medium text-foreground/60">レッド</th>
                <th className="px-4 py-3 font-medium text-foreground/60">状態</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = `${row.player_name}::${row.team_id}`;
                const hasAnySuspension = (totalSuspensionsByPlayer.get(key) ?? 0) > 0;
                return (
                  <tr key={key} className="border-t border-border transition-colors hover:bg-surface-muted/60">
                    <td className="px-4 py-3 font-medium">{row.player_name}</td>
                    <td className="px-4 py-3 text-foreground/70">{teamNameById.get(row.team_id) ?? "?"}</td>
                    <td className="px-4 py-3 text-right text-foreground/70">{row.total_yellow}</td>
                    <td className="px-4 py-3 text-right text-foreground/70">{row.current_stage_yellow}</td>
                    <td className="px-4 py-3 text-right text-foreground/70">{row.total_red}</td>
                    <td className="px-4 py-3">
                      {row.is_suspended ? (
                        <Badge tone="danger">
                          出場停止中（次: {formatMatchLabel(row.next_suspension_match_id)}）
                        </Badge>
                      ) : hasAnySuspension ? (
                        <Badge tone="neutral">消化済み</Badge>
                      ) : (
                        <span className="text-foreground/30">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState>カード記録がまだありません</EmptyState>
        )}
      </Card>
    </div>
  );
}
