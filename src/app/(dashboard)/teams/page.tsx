import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
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
      <PageHeader
        title="チーム管理"
        description="表示順は一覧・選択肢での並び順（小さい数字が先）です"
        actions={
          <Link
            href="/teams/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-dark"
          >
            + チーム追加
          </Link>
        }
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      <Card className="overflow-x-auto">
        {teams?.length ? (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground/60">表示順</th>
                <th className="px-4 py-3 font-medium text-foreground/60">チーム名</th>
                <th className="px-4 py-3 font-medium text-foreground/60">備考</th>
                <th className="px-4 py-3 font-medium text-foreground/60"></th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-t border-border transition-colors hover:bg-surface-muted/60">
                  <td className="px-4 py-3 text-foreground/60">{team.display_order}</td>
                  <td className="px-4 py-3 font-medium">{team.name}</td>
                  <td className="px-4 py-3 text-foreground/60">{team.note ?? ""}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link href={`/teams/${team.id}`} className="text-primary-dark hover:underline dark:text-primary">
                        編集
                      </Link>
                      <DeleteTeamButton teamId={team.id} teamName={team.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState>チームがまだ登録されていません</EmptyState>
        )}
      </Card>
    </div>
  );
}
