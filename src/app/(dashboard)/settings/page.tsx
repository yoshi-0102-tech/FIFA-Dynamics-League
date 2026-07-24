import Link from "next/link";
import { APP_UPDATED_AT, APP_VERSION, getBuildId } from "@/lib/app-info";
import { getAppSettings } from "@/lib/data";
import { PageHeader, Card, Badge } from "@/components/ui";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const settings = await getAppSettings();
  const buildId = getBuildId();

  const valueOf = (key: string, fallback: string) =>
    settings.find((s) => s.key === key)?.value ?? fallback;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="設定" description="大会全体のルールに関わる設定を変更できます" />

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

      <Card className="flex flex-col gap-4 p-5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="font-medium">アプリ情報</p>
          <Badge tone="success">v{APP_VERSION}</Badge>
        </div>

        <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-foreground/70">
          <dt>バージョン</dt>
          <dd className="font-medium text-foreground">v{APP_VERSION}</dd>
          <dt>ビルド</dt>
          <dd>
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">{buildId}</code>
          </dd>
          <dt>更新日</dt>
          <dd>{APP_UPDATED_AT.replaceAll("-", "/")}</dd>
        </dl>

        <Link href="/updates" className="self-start font-medium text-primary-dark hover:underline dark:text-primary">
          更新情報を見る
        </Link>
      </Card>
    </div>
  );
}
