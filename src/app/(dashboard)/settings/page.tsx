import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, Card } from "@/components/ui";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: settings, error } = await supabase.from("app_settings").select("key, value");

  const valueOf = (key: string, fallback: string) =>
    settings?.find((s) => s.key === key)?.value ?? fallback;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="設定" description="大会全体のルールに関わる設定を変更できます" />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {error.message}
        </p>
      )}

      <Card className="p-5">
        <SettingsForm
          tournamentName={valueOf("tournament_name", "FIFA Dynamics League")}
          yellowCardsForSuspension={valueOf("yellow_cards_for_suspension", "3")}
          groupStageQualifiers={valueOf("group_stage_qualifiers", "4")}
        />
      </Card>

      <Card className="flex flex-col gap-2 p-5 text-sm text-foreground/70">
        <p className="font-medium text-foreground">その他の設定について</p>
        <p>
          パスワード（<code className="rounded bg-surface-muted px-1 py-0.5 text-xs">APP_PASSWORD</code>）や
          Supabase の接続情報は、セキュリティ上この画面ではなく Vercel / ローカルの環境変数で管理しています。変更方法は
          README を参照してください。
        </p>
      </Card>
    </div>
  );
}
