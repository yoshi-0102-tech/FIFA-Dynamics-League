# FIFA Dynamics League

FIFA（ゲーム）の身内大会の試合日程・結果・順位表・個人成績・カード/出場停止を管理する Web アプリ。
ワールドカップの結果ページのような見た目で、共通パスワードを知っている参加者だけが閲覧・編集できる。

- 大会形式: 1グループのホーム＆アウェイ総当たり → 上位4チームで決勝トーナメント（同点は再試合）
- 構成: Next.js（App Router） + Supabase（PostgreSQL） + Vercel（すべて無料枠）
- 現在: MVP 実装完了（仕様は [docs/要件定義書.md](docs/要件定義書.md)）

## 主要機能

| 機能 | 画面 |
| --- | --- |
| パスワード認証（共通パスワード・署名付き Cookie） | `/login` |
| 日程・結果ダッシュボード（直近結果/次回予定/順位表簡易/出場停止者/ランキング上位、全試合フィルター） | `/`（日程・結果） |
| 順位表（タイブレーク・直接対決・順位未確定表示） | `/standings`（順位表） |
| 個人成績（得点・アシストランキング） | `/players`（個人成績） |
| カード集計・出場停止（通算/ステージ内イエロー分離、自動停止判定・自動消化） | `/cards`（カード・出場停止） |
| チーム管理（CRUD） | `/teams`（チーム管理） |
| 試合入力（日程 CRUD・自動生成・スコア/選手イベント入力・決勝トーナメント生成・再試合作成） | `/matches`（試合入力） |

## ローカル起動手順

```bash
npm install
cp .env.example .env.local   # 値を設定（後述）
npm run dev                  # http://localhost:3000
```

その他のコマンド:

```bash
npm test          # ユニットテスト（vitest run）— 集計ロジックの本体
npx tsc --noEmit   # 型チェック
npm run lint       # eslint
npm run build      # 本番ビルド
```

## 環境変数一覧（`.env.local`）

`.env.example` をコピーして値を設定する。

| 変数名 | 説明 |
| --- | --- |
| `APP_PASSWORD` | 参加者用の共通パスワード |
| `AUTH_COOKIE_SECRET` | セッション Cookie 署名用の秘密鍵（`openssl rand -hex 32` などで生成） |
| `SUPABASE_URL` | Supabase プロジェクトの URL（Project Settings > API） |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase の service role キー（同上）。**クライアントに絶対に出さない** |

Supabase へのアクセスはすべてサーバー側（Route Handler / Server Component / Server Action）から service role キーで行うため、RLS は設定していない。保護は middleware（`src/proxy.ts`）でのパスワード認証に一本化している。

## Supabase 接続手順

1. [supabase.com](https://supabase.com) で無料プロジェクトを作成
2. Project Settings > API から `Project URL` と `service_role` キーを取得し、`.env.local` に設定
3. Supabase ダッシュボードの SQL Editor で [`supabase/schema.sql`](supabase/schema.sql) の内容を実行
   - `teams` / `matches` / `match_events` / `suspensions` / `app_settings` の5テーブルと、`updated_at` 自動更新トリガーが作成される
   - `app_settings` に初期値（`yellow_cards_for_suspension=3` など）が投入される

### Supabase Free の自動ポーズ対策

Supabase Free プランは **7日間 API アクセスが無いとプロジェクトが自動ポーズ**される。大会オフ期間はアクセスが途絶えがちなので要注意。

- 対策案A: Vercel Cron（Hobby プランは1日1回まで）で軽い ping 用 API を定期実行する
- 対策案B: オフ期間はポーズを許容し、次シーズン開始前に Supabase ダッシュボードから手動で再開する

MVP では対策を組み込んでおらず、運用時に上記いずれかを選択すること。

## Vercel デプロイ手順

- **本番URL**: https://fifa-dynamics-league.vercel.app
- Vercel プロジェクト（`soudev1/fifa-dynamics-league`）と GitHub リポジトリ（`yoshi-0102-tech/FIFA-Dynamics-League`）は連携済み。**`main` ブランチに push すると自動でビルド・本番反映される**
- 環境変数（`APP_PASSWORD` / `AUTH_COOKIE_SECRET` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`）は Vercel の Production / Preview / Development すべてに設定済み。変更する場合は `vercel env rm <NAME> <environment>` → `vercel env add <NAME> <environment>` で更新後、再デプロイ（push か `vercel --prod`）が必要

初回セットアップの手順（別プロジェクトへの展開時など）:

1. GitHub にリポジトリを push
2. [vercel.com](https://vercel.com) で該当リポジトリを Import（Hobby プラン・非商用利用）
3. Environment Variables に上記4つの環境変数を設定
4. Deploy
5. デプロイ後、実際にアクセスしてパスワード画面が出ること・ログイン後にチーム/試合データが正しく表示されることを確認する

Vercel Hobby プランは **非商用・個人利用限定**、関数実行10秒以内などの制限がある。身内大会用途では問題ないが、収益化する場合は Pro プランへの移行が必要。

## パスワード設定方法

`APP_PASSWORD`（Vercel の場合は Environment Variables）を好きな値に変更するだけ。変更後は既存のログインセッション（Cookie）は署名検証に使う `AUTH_COOKIE_SECRET` とは独立なので、`APP_PASSWORD` だけ変えても既存セッインは有効なまま残る点に注意（強制的に全員ログアウトさせたい場合は `AUTH_COOKIE_SECRET` も合わせて変更する）。

## 主要機能の使い方（運用フロー）

1. **チーム管理**でチームを登録（表示順・備考は任意）
2. **試合入力**の「日程自動生成」で、登録済み全チームの総当たり（ホーム＆アウェイ）を生成
   - 既存のグループリーグ日程を上書きするか追加するか選べる
3. 各試合の編集画面でスコア・ステータスを入力し、必要に応じて選手イベント（ゴール/アシスト/イエロー/レッド）を記録
   - イエロー3枚・レッド1枚で自動的に次の未実施試合が出場停止対象になる（**カード・出場停止**画面で確認可能）
   - グループリーグ全試合が終了すると、**試合入力**画面に「決勝トーナメント生成」ボタンが有効になる
4. 「決勝トーナメント生成」で準決勝2試合（1位vs4位・2位vs3位）を自動生成
5. 準決勝が同点の場合は「同点再試合待ち」ステータスにし、一覧の「再試合作成」で再戦を追加
6. 両準決勝の勝敗が決まると、決勝・3位決定戦が自動生成される
7. **日程・結果**（トップページ）で全体のダッシュボード、**順位表**・**個人成績**で詳細を確認

## 改善案リスト（今後の課題）

- オウンゴールの実装（DB は `event_type` 拡張で対応可能な設計済み）
- Supabase 自動ポーズ対策の自動化（Cron ping）
- 試合削除時のカスケード削除の UI 上の明示（現状は DB の `on delete cascade` に依存）
- フォームのバリデーションエラー時に入力値が保持されない（React の `useActionState` + 非制御コンポーネントの制約。実害は再入力の手間のみ）
- 決勝トーナメントの再生成（誤操作時のやり直し）機能
- E2E テスト（Playwright 等）の追加。現状はユニットテスト（集計ロジック）のみ
