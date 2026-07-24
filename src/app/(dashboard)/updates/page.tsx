import { APP_VERSION, UPDATE_HISTORY } from "@/lib/app-info";
import { Badge, Card, PageHeader } from "@/components/ui";

export default function UpdatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="更新情報"
        description="アプリに追加された機能や改善内容を確認できます"
        actions={<Badge tone="success">現在 v{APP_VERSION}</Badge>}
      />

      <div className="flex flex-col gap-4">
        {UPDATE_HISTORY.map((update, index) => (
          <Card key={`${update.version}-${update.date}`} className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={index === 0 ? "success" : "neutral"}>v{update.version}</Badge>
                {index === 0 && <Badge tone="accent">最新</Badge>}
                <time dateTime={update.date} className="text-sm text-foreground/50">
                  {new Date(`${update.date}T00:00:00+09:00`).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">{update.title}</h2>
                <p className="text-sm leading-relaxed text-foreground/65">{update.description}</p>
              </div>

              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                {update.changes.map((change) => (
                  <li key={change} className="flex gap-2 rounded-lg bg-surface-muted px-3 py-2">
                    <span className="text-primary-dark dark:text-primary" aria-hidden="true">
                      ✓
                    </span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
