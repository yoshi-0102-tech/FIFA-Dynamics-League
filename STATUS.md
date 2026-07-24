# STATUS — fifa-dynamics-league

- 段階: 運用中
- 一言: MVPを本番運用中。読み取りキャッシュ・静的ルート化・Vercel東京リージョン固定により画面遷移を高速化。本番URL: https://fifa-dynamics-league.vercel.app
- 更新日: 2026-07-24

## 作業ログ

- 2026-07-24: ページ移動の遅延対策として、Supabase読み取りの5分共有キャッシュ、更新後の即時無効化、全`force-dynamic`撤廃、トップ画面フィルターのクライアント化、Vercel Functionの東京（`hnd1`）固定を実装。DBスキーマ・既存データは変更なし。
- 2026-07-24: リポジトリ全体を静的レビューし、認証・出場停止・トーナメント進行・DB整合性に関する指摘を `docs/code-review-2026-07-24.md` に記録。
- 2026-07-10: `output/pdf/fifa-dynamics-league-invoice-sample-extol.pdf` に、架空通貨エクストル（EXTOL）建てのサンプル請求書を作成。宛先は「尾西 宥紀 様」、請求額は5,000,000 EXTOL（ネタ換算で約500円）、備考は通貨単位の記載のみに設定。
- 2026-07-11: 選手イベント入力で2人目以降もプルダウンで選択可能に（`matches/[id]/EventForm.tsx`）
- 2026-07-13: 選手イベント入力の選手名候補を所属チームで絞り込むよう修正

## 実装済み（要件定義書 §8 対応）

- **ステップ1 認証**: 共通パスワード → 署名付き httpOnly Cookie（`src/lib/auth.ts`）+ 全ページ/APIを保護する `src/proxy.ts`（Next.js 16 の proxy=旧middleware）。/login・/api/login・/api/logout
- **ステップ2 スキーマ/型**: `supabase/schema.sql`（teams/matches/match_events/suspensions/app_settings、制約・トリガー込み）+ `src/lib/types.ts`（Database 型）。サーバー専用 Supabase クライアント `src/lib/supabase/server.ts`（service role）
- **ステップ3 チーム管理 CRUD**: `src/app/(dashboard)/teams/`
- **ステップ4 試合日程管理 CRUD + 日程自動生成**: `src/app/(dashboard)/matches/`（一覧・追加・編集・削除）+ 総当たり生成の純粋関数 `src/lib/fixtures.ts`（テスト込み）+ 生成UI `matches/generate/`（上書き/追加＋確認ダイアログ）
- **ステップ5 試合結果入力 + 選手イベント入力**: `matches/[id]/` にスコア・ステータス編集と選手イベント（ゴール/アシスト/イエロー/レッド）フォームを統合。選手名は過去入力からサジェスト（`<datalist>`）。ゴール数⇔スコア不一致・アシスト数>ゴール数は警告表示（非ブロッキング）
- **ステップ6 順位表集計**: `src/lib/standings.ts`（勝点→得失差→直接対決（当該チーム間の勝点→得失差）→総得点数→「順位未確定(provisional)」。2026-07-10 に順位決定基準を仕様変更）+ テスト + `/standings` 画面
- **ステップ7 日程結果一覧 + トップページダッシュボード**: `(dashboard)/page.tsx` を実データ化。直近結果/次回予定/順位表簡易/出場停止中/得点・アシストランキング上位 + フィルター付き全試合一覧（得点者・カード表示込み）
- **ステップ8 得点・アシストランキング**: `src/lib/rankings.ts`（選手名＋チームの組で集計、同数同順位）+ テスト + `/players` 画面
- **ステップ9 カード集計 + 出場停止自動管理**（本アプリの肝）: `src/lib/cards.ts`
  - 通算イエロー（career）とステージ内イエロー（group/tournamentの2バケット、トーナメント進出でリセット）を分離集計
  - ステージ内イエローが3の倍数に達するたび出場停止1回（`shouldGenerateSuspension`）、レッドは即1回
  - 出場停止対象は「チームの次の未実施試合」を動的解決（`resolveNextUnplayedMatchId`）。**重要な設計ポイント**: 停止発生元の試合自身は解決候補から除外する（`excludeMatchId`）。除外しないと、カード発生試合がまだ`scheduled`のうちは停止対象がその試合自身に解決されてしまい、消化タイミングを誤る不具合があった（実装中に発見・修正・テスト済み）
  - `matches/[id]/eventActions.ts`（イベント登録時に停止レコード自動生成）+ `matches/actions.ts`（試合が「終了」になったタイミングで該当停止を自動消化）+ `/cards` 画面
- **ステップ10 決勝トーナメント生成 + 再試合フロー**: `src/lib/tournament.ts`（準決勝ペアリング1v4/2v3、勝敗判定、再試合チェーンの解決）+ テスト + `matches/tournamentActions.ts`（グループ全終了後に準決勝生成、準決勝2試合の決着後に決勝/3位決定戦を自動生成、同点試合からワンクリックで再試合作成）。決勝トーナメントで同点のまま「終了」にはできないバリデーション追加
- **ステップ11 運用ドキュメント**: [README.md](README.md) にローカル起動・環境変数・Supabase接続・Vercelデプロイ・パスワード設定・使い方・改善案リストを整理
- **画面遷移高速化**: `src/lib/data.ts`で主要5テーブルを5分間共有キャッシュし、Server Action成功後に`src/lib/data-cache.ts`から即時無効化。主要一覧画面を静的ルート化し、`vercel.json`でVercel Functionを東京リージョンへ固定

## テスト・検証状況

- `npm test`（vitest）: 5ファイル・42ケース全通過（fixtures / standings / rankings / cards / tournament）
- `npx tsc --noEmit` / `npm run build`: クリーン
- 動作確認: ローカル Docker（Postgres + PostgREST）で実データベース相手に全機能を E2E 確認済み（チーム/試合CRUD、日程自動生成、結果・イベント入力、カード3枚→出場停止→次試合終了で自動消化、決勝トーナメント生成→準決勝同点→再試合→決勝/3位決定戦自動生成、ダッシュボードのフィルター等）
- **本番デプロイ確認済み**: ユーザーが実 Supabase プロジェクトを作成・`schema.sql` 実行 → `.env.local` に実値設定 → 接続テスト（読み取り/書き込み/削除）成功 → GitHub push（初回コミット）→ Vercel プロジェクト作成・環境変数設定（Production/Preview/Development全て）→ 本番デプロイ → curl でログイン・Cookie発行・Supabase読み取りまで確認 → GitHub連携（push時自動デプロイ）設定・動作確認済み
- 本番URL: https://fifa-dynamics-league.vercel.app／GitHub: https://github.com/yoshi-0102-tech/FIFA-Dynamics-League

## 次の一手（ユーザー作業・運用開始前）

1. Supabase Free の7日間自動ポーズ対策（Cron ping か手動再開運用）を決定（README「改善案リスト」参照）
2. 参加者にパスワード（`APP_PASSWORD`）と本番URLを共有
3. チーム登録 → 日程自動生成 → 大会運用開始

## 注意事項（重要）

- **今回のセッション中、同じリポジトリを別の Claude Code セッションが並行して編集していた形跡を確認**（`/standings` 関連ファイルが自分の作業と無関係に出現、`.env.local`・本ファイルの内容が想定と異なるタイミングで変化）。複数セッションを同時に同一リポジトリで走らせると、ファイルの競合・上書きが起きうるため、以後は1セッションに絞ることを推奨
- ~~上記の並行セッションが残した過去の STATUS.md に「Supabase 実値が設定済み」との記載があったが、実際には実 Supabase プロジェクトへの接続はまだ未設定~~ → **解消済み（2026-07-10）**: その後ユーザーが実 Supabase プロジェクトを作成・接続し、本番デプロイまで確認済み（「テスト・検証状況」参照）。この注意書きは経緯の記録として残す

## メモ・ブロッカー

- Supabase Free の7日自動ポーズ対策は運用開始前に決定（現状ブロッカーではない）
- Chrome プレビューツールでのブラウザ操作は、開発サーバの自動ポート割り当てや稀な再起動により時々つまずいた（アプリ側の不具合ではなく検証環境側の揺れ）。最終的には全機能を実データで検証済み
