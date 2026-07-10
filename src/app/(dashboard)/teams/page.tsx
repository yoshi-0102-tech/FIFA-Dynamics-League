import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DeleteTeamButton from "./DeleteTeamButton";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const supabase = createSupabaseServerClient();
  const { data: teams, error } = await supabase
    .from("teams")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">チーム管理</h1>
        <Link
          href="/teams/new"
          className="rounded-md bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          + チーム追加
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="px-3 py-2 font-medium">表示順</th>
              <th className="px-3 py-2 font-medium">チーム名</th>
              <th className="px-3 py-2 font-medium">備考</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {teams?.length ? (
              teams.map((team) => (
                <tr key={team.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2">{team.display_order}</td>
                  <td className="px-3 py-2">{team.name}</td>
                  <td className="px-3 py-2 text-black/60 dark:text-white/60">{team.note ?? ""}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-3">
                      <Link href={`/teams/${team.id}`} className="text-blue-600 dark:text-blue-400">
                        編集
                      </Link>
                      <DeleteTeamButton teamId={team.id} teamName={team.name} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                  チームがまだ登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
