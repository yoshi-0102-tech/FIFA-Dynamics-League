import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import GenerateFixturesForm from "./GenerateFixturesForm";

export const dynamic = "force-dynamic";

export default async function GenerateFixturesPage() {
  const supabase = createSupabaseServerClient();
  const [{ data: teams }, { count: existingGroupMatches }] = await Promise.all([
    supabase.from("teams").select("id, name"),
    supabase.from("matches").select("id", { count: "exact", head: true }).eq("stage", "group"),
  ]);

  const teamCount = teams?.length ?? 0;
  const expectedMatchCount = teamCount * (teamCount - 1);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="日程自動生成" />
      <Card className="flex max-w-md flex-col gap-4 p-5">
        <p className="text-sm text-foreground/70">
          登録済み全チーム（{teamCount}チーム）の総当たりで、ホーム・アウェイ各1試合ずつ（計{expectedMatchCount}試合）をグループリーグ日程として生成します。日時は未設定で生成されるため、後から個別に編集してください。
        </p>
        {existingGroupMatches ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            現在グループリーグの試合が{existingGroupMatches}件登録されています。
          </p>
        ) : null}
        <GenerateFixturesForm teamCount={teamCount} hasExistingMatches={(existingGroupMatches ?? 0) > 0} />
      </Card>
    </div>
  );
}
