import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STAGE_LABELS, STATUS_LABELS } from "./stageLabels";
import DeleteMatchButton from "./DeleteMatchButton";
import GenerateTournamentButton from "./GenerateTournamentButton";
import CreateReplayButton from "./CreateReplayButton";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: matches, error }, { data: teams }] = await Promise.all([
    supabase
      .from("matches")
      .select("*")
      .order("match_datetime", { ascending: true, nullsFirst: false }),
    supabase.from("teams").select("id, name"),
  ]);

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">試合入力</h1>
        <div className="flex gap-2">
          <Link
            href="/matches/generate"
            className="rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
          >
            日程自動生成
          </Link>
          <GenerateTournamentButton />
          <Link
            href="/matches/new"
            className="rounded-md bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            + 試合追加
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="px-3 py-2 font-medium">日時</th>
              <th className="px-3 py-2 font-medium">ステージ</th>
              <th className="px-3 py-2 font-medium">ホーム</th>
              <th className="px-3 py-2 font-medium">スコア</th>
              <th className="px-3 py-2 font-medium">アウェイ</th>
              <th className="px-3 py-2 font-medium">状態</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {matches?.length ? (
              matches.map((match) => (
                <tr key={match.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {match.match_datetime
                      ? new Date(match.match_datetime).toLocaleString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "未定"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{STAGE_LABELS[match.stage]}</td>
                  <td className="px-3 py-2">{teamNameById.get(match.home_team_id) ?? "?"}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {match.home_score ?? "-"} - {match.away_score ?? "-"}
                  </td>
                  <td className="px-3 py-2">{teamNameById.get(match.away_team_id) ?? "?"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{STATUS_LABELS[match.status]}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-3">
                      <Link href={`/matches/${match.id}`} className="text-blue-600 dark:text-blue-400">
                        編集
                      </Link>
                      {match.status === "draw_replay_needed" && (
                        <CreateReplayButton matchId={match.id} />
                      )}
                      <DeleteMatchButton matchId={match.id} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                  試合がまだ登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
