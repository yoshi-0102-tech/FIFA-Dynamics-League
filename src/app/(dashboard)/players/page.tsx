import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computePlayerRankings, type RankingRow } from "@/lib/rankings";
import { PageHeader, Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function RankingTable({ title, rows, teamNameById }: { title: string; rows: RankingRow[]; teamNameById: Map<string, string> }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <Card className="overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 text-center font-medium text-foreground/60">順位</th>
                <th className="px-4 py-3 font-medium text-foreground/60">選手名</th>
                <th className="px-4 py-3 font-medium text-foreground/60">チーム</th>
                <th className="px-4 py-3 text-right font-medium text-foreground/60">数</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.player_name}-${row.team_id}`}
                  className="border-t border-border transition-colors hover:bg-surface-muted/60"
                >
                  <td className="px-4 py-3 text-center">
                    {RANK_MEDALS[row.rank] ?? row.rank}
                  </td>
                  <td className="px-4 py-3 font-medium">{row.player_name}</td>
                  <td className="px-4 py-3 text-foreground/70">{teamNameById.get(row.team_id) ?? "?"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-primary-dark dark:text-primary">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState>記録がまだありません</EmptyState>
        )}
      </Card>
    </div>
  );
}

export default async function PlayersPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: events, error }, { data: teams }] = await Promise.all([
    supabase.from("match_events").select("player_name, team_id, event_type"),
    supabase.from("teams").select("id, name"),
  ]);

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const goalRankings = computePlayerRankings(events ?? [], "goal");
  const assistRankings = computePlayerRankings(events ?? [], "assist");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="個人成績" description="得点・アシストのランキングです" />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}
      <RankingTable title="得点ランキング" rows={goalRankings} teamNameById={teamNameById} />
      <RankingTable title="アシストランキング" rows={assistRankings} teamNameById={teamNameById} />
    </div>
  );
}
