import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui";

const SECTIONS = [
  { id: "flow", label: "大会運用の流れ" },
  { id: "screens", label: "画面の見方" },
  { id: "cards", label: "カード・出場停止のルール" },
  { id: "tournament", label: "決勝トーナメント・再試合" },
  { id: "faq", label: "よくある質問" },
];

export default function GuidePage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="使い方ガイド" description="このアプリの使い方と大会のルールをまとめています" />

      <Card className="p-5">
        <p className="mb-2 text-sm font-medium text-foreground/70">目次</p>
        <ul className="flex flex-wrap gap-2 text-sm">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-block rounded-full bg-surface-muted px-3 py-1 text-foreground/70 hover:bg-primary/10 hover:text-primary-dark"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </Card>

      <Card id="flow" className="flex flex-col gap-4 p-5 scroll-mt-20">
        <h2 className="text-lg font-bold">① 大会運用の流れ</h2>
        <ol className="flex flex-col gap-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span>
              <Link href="/teams" className="font-medium text-primary-dark dark:text-primary">
                チーム管理
              </Link>
              で参加チームを登録する（表示順・備考は任意）
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span>
              <Link href="/matches/generate" className="font-medium text-primary-dark dark:text-primary">
                試合入力 → 日程自動生成
              </Link>
              で、登録済み全チームのホーム＆アウェイ総当たり日程を一括生成する
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <span>
              試合が終わるたびに
              <Link href="/matches" className="font-medium text-primary-dark dark:text-primary">
                {" "}
                試合入力
              </Link>
              の編集画面からスコア・ステータス（終了）を入力し、必要なら選手イベント（ゴール／アシスト／カード）も記録する
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              4
            </span>
            <span>
              <Link href="/standings" className="font-medium text-primary-dark dark:text-primary">
                順位表
              </Link>
              や
              <Link href="/" className="font-medium text-primary-dark dark:text-primary">
                {" "}
                トップページ
              </Link>
              で進行状況を確認する
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              5
            </span>
            <span>グループリーグ全試合が終了したら、試合入力画面の「決勝トーナメント生成」で準決勝を自動生成する</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              6
            </span>
            <span>準決勝の勝敗が両方決まると、決勝・3位決定戦が自動で生成される</span>
          </li>
        </ol>
      </Card>

      <Card id="screens" className="flex flex-col gap-4 p-5 scroll-mt-20">
        <h2 className="text-lg font-bold">② 画面の見方</h2>
        <dl className="flex flex-col gap-4 text-sm">
          <div>
            <dt className="font-medium">日程・結果（トップページ）</dt>
            <dd className="text-foreground/70">
              直近の結果・次回の予定・順位表の簡易表示・出場停止中の選手・得点/アシストランキング上位を1画面で確認できます。下部の全試合一覧はステージや状態でフィルターできます。
            </dd>
          </div>
          <div>
            <dt className="font-medium">順位表</dt>
            <dd className="text-foreground/70">
              勝点→得失点差→直接対決（当該チーム間の勝点→得失点差）→総得点数の順でタイブレークします。それでも並ぶ場合は「＊」印がつき、「完全には順位を決定できません」と表示されます。
            </dd>
          </div>
          <div>
            <dt className="font-medium">個人成績</dt>
            <dd className="text-foreground/70">
              得点・アシストのランキングです。同じ選手名でもチームが違えば別人として集計されます。
            </dd>
          </div>
          <div>
            <dt className="font-medium">カード・出場停止</dt>
            <dd className="text-foreground/70">
              通算イエロー数・現在ステージ内のイエロー数・レッド数・出場停止の状況を一覧できます。詳しいルールは
              <a href="#cards" className="font-medium text-primary-dark dark:text-primary">
                {" "}
                ③カード・出場停止のルール
              </a>
              を参照してください。
            </dd>
          </div>
          <div>
            <dt className="font-medium">チーム管理</dt>
            <dd className="text-foreground/70">
              チームの登録・編集・削除を行います。
              <span className="font-medium">表示順</span>
              は、一覧やドロップダウンでの並び順を指定する数字です。小さい数字ほど先に表示されます（例:
              グループ分けの見出し順や、シード順を反映させたい場合に使います）。全チーム同じ値でも動作に支障はなく、その場合は登録順などで表示されます。
            </dd>
          </div>
          <div>
            <dt className="font-medium">試合入力</dt>
            <dd className="text-foreground/70">
              試合の追加・編集・削除、日程自動生成、決勝トーナメント生成、スコアと選手イベントの入力をまとめて行う管理画面です。
            </dd>
          </div>
          <div>
            <dt className="font-medium">設定</dt>
            <dd className="text-foreground/70">
              大会名、出場停止になるイエロー枚数、決勝トーナメント進出チーム数を変更できます。
            </dd>
          </div>
        </dl>
      </Card>

      <Card id="cards" className="flex flex-col gap-3 p-5 scroll-mt-20">
        <h2 className="text-lg font-bold">③ カード・出場停止のルール</h2>
        <ul className="flex flex-col gap-2 text-sm text-foreground/80">
          <li>
            <Badge tone="warning">イエロー</Badge> がステージ内で設定枚数（既定3枚）の倍数に達するたびに、次の1試合が自動的に出場停止になります（3枚で1回目、6枚で2回目…）。
          </li>
          <li>
            <Badge tone="danger">レッド</Badge> は1枚受けた時点で即座に次の1試合が出場停止になります。
          </li>
          <li>
            「ステージ内」はグループリーグと決勝トーナメントの2区分です。グループリーグが終わり決勝トーナメントに進出すると、ステージ内イエローの枚数はリセットされます（<span className="font-medium">通算イエロー数は消えずに残ります</span>）。
          </li>
          <li>
            出場停止の対象試合は「そのチームの次の未実施試合」を自動的に判定します。日程を後から変更しても、対象試合は自動で追従します。対象試合が終了すると自動的に消化済みになります。
          </li>
          <li>レッドカードによる出場停止が消化されないままグループリーグが終わっても、決勝トーナメントの初戦にそのまま引き継がれます。</li>
        </ul>
      </Card>

      <Card id="tournament" className="flex flex-col gap-3 p-5 scroll-mt-20">
        <h2 className="text-lg font-bold">④ 決勝トーナメント・再試合</h2>
        <ul className="flex flex-col gap-2 text-sm text-foreground/80">
          <li>準決勝1: 順位表1位 vs 4位 ／ 準決勝2: 2位 vs 3位（進出枠は設定画面で変更可能）</li>
          <li>
            決勝トーナメントで同点になった場合は、PK・延長ではなく
            <span className="font-medium">再試合</span>
            を行います。試合ステータスを「同点再試合待ち」にすると、試合一覧に「再試合作成」ボタンが表示されます。
          </li>
          <li>再試合も同点なら、さらに再試合を作成できます（回数の制限はありません）。</li>
          <li>両準決勝の勝敗が決まると、決勝・3位決定戦の対戦カードが自動的に作成されます。</li>
        </ul>
      </Card>

      <Card id="faq" className="flex flex-col gap-4 p-5 scroll-mt-20">
        <h2 className="text-lg font-bold">⑤ よくある質問</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div>
            <p className="font-medium">得点イベントとスコアが合わないと警告が出るのはなぜ？</p>
            <p className="text-foreground/70">
              選手イベントの入力は任意なので、ゴール数とスコアが一致しなくてもブロックはされません（警告表示のみ）。厳密に記録したい場合はゴールイベントを漏れなく入力してください。
            </p>
          </div>
          <div>
            <p className="font-medium">試合や選手イベントを間違えて登録した場合は？</p>
            <p className="text-foreground/70">
              各一覧の「削除」から削除できます。試合を削除すると、関連する選手イベント・出場停止記録も一緒に削除されます。
            </p>
          </div>
          <div>
            <p className="font-medium">しばらくアクセスしないとどうなる？</p>
            <p className="text-foreground/70">
              Supabase の無料プランは7日間アクセスが無いと自動的に一時停止されます。大会オフ期間が長い場合は、運営側で定期的にアクセスするか、Supabase ダッシュボードから手動で再開してください。
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
