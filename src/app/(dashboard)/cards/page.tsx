import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeCardSummary, type StageBucket } from "@/lib/cards";
import type { Stage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: events, error: eventsError }, { data: matches, error: matchesError }, { data: suspensions }, { data: teams }] =
    await Promise.all([
      supabase.from("match_events").select("player_name, team_id, event_type, match_id"),
      supabase
        .from("matches")
        .select("id, stage, home_team_id, away_team_id, status, match_datetime, created_at"),
      supabase.from("suspensions").select("id, player_name, team_id, reason, is_served, source_match_id"),
      supabase.from("teams").select("id, name"),
    ]);

  const error = eventsError ?? matchesError;
  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const matchStageById = new Map((matches ?? []).map((m) => [m.id, m.stage as Stage]));
  const matchById = new Map((matches ?? []).map((m) => [m.id, m]));

  const currentBucket: StageBucket = (matches ?? []).some((m) => m.stage !== "group")
    ? "tournament"
    : "group";

  const rows = computeCardSummary(
    events ?? [],
    matchStageById,
    suspensions ?? [],
    currentBucket,
    matches ?? [],
  );

  const totalSuspensionsByPlayer = new Map<string, number>();
  for (const s of suspensions ?? []) {
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
      <h1 className="text-2xl font-bold">カード・出場停止</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        現在のステージ区分: {currentBucket === "group" ? "グループリーグ" : "決勝トーナメント"}
        （ステージ内イエローはトーナメント進出時にリセットされます。通算イエローは残ります）
      </p>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="px-3 py-2 font-medium">選手名</th>
              <th className="px-3 py-2 font-medium">チーム</th>
              <th className="px-3 py-2 text-right font-medium">通算イエロー</th>
              <th className="px-3 py-2 text-right font-medium">ステージ内イエロー</th>
              <th className="px-3 py-2 text-right font-medium">レッド</th>
              <th className="px-3 py-2 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => {
                const key = `${row.player_name}::${row.team_id}`;
                const hasAnySuspension = (totalSuspensionsByPlayer.get(key) ?? 0) > 0;
                return (
                  <tr key={key} className="border-t border-black/10 dark:border-white/10">
                    <td className="px-3 py-2">{row.player_name}</td>
                    <td className="px-3 py-2">{teamNameById.get(row.team_id) ?? "?"}</td>
                    <td className="px-3 py-2 text-right">{row.total_yellow}</td>
                    <td className="px-3 py-2 text-right">{row.current_stage_yellow}</td>
                    <td className="px-3 py-2 text-right">{row.total_red}</td>
                    <td className="px-3 py-2">
                      {row.is_suspended ? (
                        <span className="text-red-600 dark:text-red-400">
                          出場停止中（次: {formatMatchLabel(row.next_suspension_match_id)}）
                        </span>
                      ) : hasAnySuspension ? (
                        <span className="text-black/50 dark:text-white/50">消化済み</span>
                      ) : (
                        <span className="text-black/30 dark:text-white/30">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                  カード記録がまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
