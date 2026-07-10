import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeStandings, type StandingsMatch } from "@/lib/standings";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";

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
  const [{ data: teams, error: teamsError }, { data: matches, error: matchesError }, { data: qualifiersSetting }] =
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
      supabase.from("app_settings").select("value").eq("key", "group_stage_qualifiers").maybeSingle(),
    ]);

  const error = teamsError ?? matchesError;
  const qualifiersCount = Number(qualifiersSetting?.value ?? 4);

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
      <PageHeader
        title="順位表"
        description={`グループリーグ。上位${qualifiersCount}チームが決勝トーナメントに進出します`}
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      {(teams?.length ?? 0) === 0 ? (
        <Card className="p-5">
          <EmptyState>チームがまだ登録されていません。チーム管理から登録してください。</EmptyState>
        </Card>
      ) : (
        <>
          {!fullyResolved && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              ※ 同順位（<span className="font-medium">*</span>印）のチームは、勝点・得失点差・得点・勝利数・直接対決まで比較しても並んでいるため、
              完全には順位を決定できません。表示順は仮の並びです。
            </p>
          )}

          <Card className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-right text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-3 text-center font-medium text-foreground/60">順位</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground/60">チーム</th>
                  {COLS.map((c) => (
                    <th key={c.key} className="px-3 py-3 font-medium text-foreground/60">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const qualifies = row.rank <= qualifiersCount;
                  return (
                    <tr
                      key={row.team_id}
                      className={`border-t border-border transition-colors hover:bg-surface-muted/60 ${
                        qualifies ? "border-l-4 border-l-accent" : ""
                      }`}
                    >
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {row.rank}
                        {row.provisional && <span className="text-amber-600 dark:text-amber-400">*</span>}
                      </td>
                      <td className="px-3 py-3 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{row.team_name}</span>
                          {qualifies && <Badge tone="accent">進出圏</Badge>}
                        </div>
                      </td>
                      {COLS.map((c) => (
                        <td
                          key={c.key}
                          className={c.key === "points" ? "px-3 py-3 font-semibold" : "px-3 py-3 text-foreground/70"}
                        >
                          {c.key === "goal_difference" && row.goal_difference > 0
                            ? `+${row.goal_difference}`
                            : row[c.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <p className="text-xs text-foreground/50">
            集計対象はステージ「グループリーグ」かつステータス「終了」の試合のみです（現在
            {completedMatches.length}試合）。
          </p>
        </>
      )}
    </div>
  );
}
