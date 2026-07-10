import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeStandings, type StandingsMatch } from "@/lib/standings";

export const dynamic = "force-dynamic";

const COLS = [
  { key: "played", label: "試合" },
  { key: "won", label: "勝" },
  { key: "drawn", label: "分" },
  { key: "lost", label: "負" },
  { key: "goals_for", label: "得点" },
  { key: "goals_against", label: "失点" },
  { key: "goal_difference", label: "得失差" },
  { key: "points", label: "勝点" },
] as const;

export default async function StandingsPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: teams, error: teamsError }, { data: matches, error: matchesError }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, display_order")
        .order("display_order", { ascending: true }),
      supabase
        .from("matches")
        .select("home_team_id, away_team_id, home_score, away_score")
        .eq("stage", "group")
        .eq("status", "completed"),
    ]);

  const error = teamsError ?? matchesError;

  const completedMatches: StandingsMatch[] = (matches ?? [])
    .filter((m) => m.home_score !== null && m.away_score !== null)
    .map((m) => ({
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: m.home_score as number,
      away_score: m.away_score as number,
    }));

  const { rows, fullyResolved } = computeStandings(teams ?? [], completedMatches);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">順位表（グループリーグ）</h1>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      {(teams?.length ?? 0) === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          チームがまだ登録されていません。チーム管理から登録してください。
        </p>
      ) : (
        <>
          {!fullyResolved && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              ※ 同順位（
              <span className="font-medium">*</span>
              印）のチームは、勝点・得失点差・得点・勝利数・直接対決まで比較しても並んでいるため、
              完全には順位を決定できません。表示順は仮の並びです。
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full min-w-[560px] text-right text-sm">
              <thead className="bg-black/5 dark:bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-center font-medium">順位</th>
                  <th className="px-3 py-2 text-left font-medium">チーム</th>
                  {COLS.map((c) => (
                    <th key={c.key} className="px-3 py-2 font-medium">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.team_id}
                    className="border-t border-black/10 dark:border-white/10"
                  >
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {row.rank}
                      {row.provisional && (
                        <span className="text-amber-600 dark:text-amber-400">*</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-left">{row.team_name}</td>
                    {COLS.map((c) => (
                      <td
                        key={c.key}
                        className={c.key === "points" ? "px-3 py-2 font-semibold" : "px-3 py-2"}
                      >
                        {c.key === "goal_difference" && row.goal_difference > 0
                          ? `+${row.goal_difference}`
                          : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-black/50 dark:text-white/50">
            集計対象はステージ「グループリーグ」かつステータス「終了」の試合のみです（現在
            {completedMatches.length}試合）。
          </p>
        </>
      )}
    </div>
  );
}
