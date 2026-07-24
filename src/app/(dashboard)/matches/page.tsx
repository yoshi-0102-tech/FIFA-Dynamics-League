import Link from "next/link";
import { getMatches, getTeams } from "@/lib/data";
import { PageHeader, Card, Badge, EmptyState, SecondaryButton } from "@/components/ui";
import { STAGE_LABELS, STATUS_LABELS, STATUS_TONES } from "./stageLabels";
import DeleteMatchButton from "./DeleteMatchButton";
import GenerateTournamentButton from "./GenerateTournamentButton";
import CreateReplayButton from "./CreateReplayButton";

export default async function MatchesPage() {
  const [matches, teams] = await Promise.all([getMatches(), getTeams()]);

  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="試合入力"
        description="日程の追加・結果入力・選手イベント記録・決勝トーナメント生成をここで行います"
        actions={
          <>
            <Link href="/matches/generate">
              <SecondaryButton>日程自動生成</SecondaryButton>
            </Link>
            <GenerateTournamentButton />
            <Link
              href="/matches/new"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-dark"
            >
              + 試合追加
            </Link>
          </>
        }
      />

      <Card className="overflow-x-auto">
        {matches.length ? (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground/60">日時</th>
                <th className="px-4 py-3 font-medium text-foreground/60">ステージ</th>
                <th className="px-4 py-3 font-medium text-foreground/60">ホーム</th>
                <th className="px-4 py-3 font-medium text-foreground/60">スコア</th>
                <th className="px-4 py-3 font-medium text-foreground/60">アウェイ</th>
                <th className="px-4 py-3 font-medium text-foreground/60">状態</th>
                <th className="px-4 py-3 font-medium text-foreground/60"></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="border-t border-border transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/70">
                    {match.match_datetime
                      ? new Date(match.match_datetime).toLocaleString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "未定"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground/70">{STAGE_LABELS[match.stage]}</td>
                  <td className="px-4 py-3 font-medium">{teamNameById.get(match.home_team_id) ?? "?"}</td>
                  <td className="px-4 py-3 text-center font-semibold whitespace-nowrap">
                    {match.home_score ?? "-"} - {match.away_score ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-medium">{teamNameById.get(match.away_team_id) ?? "?"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge tone={STATUS_TONES[match.status]}>{STATUS_LABELS[match.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/matches/${match.id}`} className="text-primary-dark hover:underline dark:text-primary">
                        編集
                      </Link>
                      {match.status === "draw_replay_needed" && (
                        <CreateReplayButton matchId={match.id} />
                      )}
                      <DeleteMatchButton matchId={match.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState>試合がまだ登録されていません</EmptyState>
        )}
      </Card>
    </div>
  );
}
