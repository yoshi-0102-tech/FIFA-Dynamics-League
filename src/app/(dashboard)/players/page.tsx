import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computePlayerRankings, type RankingRow } from "@/lib/rankings";

export const dynamic = "force-dynamic";

function RankingTable({ title, rows, teamNameById }: { title: string; rows: RankingRow[]; teamNameById: Map<string, string> }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="px-3 py-2 text-center font-medium">順位</th>
              <th className="px-3 py-2 font-medium">選手名</th>
              <th className="px-3 py-2 font-medium">チーム</th>
              <th className="px-3 py-2 text-right font-medium">数</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.player_name}-${row.team_id}`} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2 text-center">{row.rank}</td>
                  <td className="px-3 py-2">{row.player_name}</td>
                  <td className="px-3 py-2">{teamNameById.get(row.team_id) ?? "?"}</td>
                  <td className="px-3 py-2 text-right font-semibold">{row.count}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                  記録がまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
      <h1 className="text-2xl font-bold">個人成績</h1>
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
