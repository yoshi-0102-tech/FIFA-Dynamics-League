# fifa-dynamics-league — AI エージェント向けガイド

FIFA（ゲーム）の身内大会「FIFA Dynamics League」の試合日程・結果・順位表・個人成績・カード/出場停止を管理する Web アプリ。ワールドカップ結果ページ風の見やすさで、共通パスワードを知る参加者だけが閲覧・編集できる。

- **状態**: 🌱 要件確定（**コードはまだ無い**）
- **種別**: Web（Next.js App Router + Supabase + Vercel）
- **リポジトリ**: 個人アカウント `yoshi-0102-tech`（push は必ず `git@github-personal:...` 経由。→ [ワークスペースREADME](../../README.md)）

## 技術スタック（決定済み）

- Next.js（App Router）/ React / TypeScript / Tailwind CSS
- DB: Supabase PostgreSQL（無料枠）/ ホスティング: Vercel（Hobby）
- 認証: 共通パスワード（環境変数）→ 署名付き httpOnly Cookie を middleware で検証
- **Supabase アクセスはサーバー側のみ**（service role キー）。クライアントに Supabase キーを出さない＝RLS 設計を省略する構成

## コマンド

```bash
npm install            # 依存インストール
npm run dev            # 開発サーバ（http://localhost:3000）
npm test               # ユニットテスト（vitest run）— 集計ロジックの本体
npx tsc --noEmit       # 型チェック
npm run lint           # eslint
npm run build          # 本番ビルド
```

- 環境変数は `.env.local`（`.env.example` をコピーして値を設定）。`APP_PASSWORD` / `AUTH_COOKIE_SECRET` / `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- DB スキーマは `supabase/schema.sql` を Supabase SQL Editor で実行

## 規約・方針

- **集計ロジック（順位表・タイブレーク・カード/出場停止判定）は純粋関数として `lib/` に分離し、ユニットテストを書く**。ここがアプリの品質の本体
- 集計結果は DB に保存せず都度計算（小規模前提。matches/match_events から導出）
- UI は日本語・スマホ優先。編集・削除には確認ダイアログ

## Git / コミット規約

- Conventional Commits（日本語要約）: `feat: 順位表集計を追加` など
- push 先は必ず `git@github-personal:yoshi-0102-tech/fifa-dynamics-league.git`
- コミットしない: `.env*`（パスワード・Supabase キー）、`node_modules/`、`.next/`

## エージェントへの依頼ルール（Do / Don't）

- ✅ 仕様は [docs/要件定義書.md](docs/要件定義書.md) を正とする。実装前に必ず読む
- ✅ 実装は要件定義書 §8 の MVP 実装順に沿って「動く状態」を保って進める（縦割り）
- ✅ 実装開始時に Vercel / Supabase の無料枠を公式ページで再確認する（要件定義書 §7.3 は 2026-07 時点）
- ⛔ 本格的なユーザー登録・ログイン、リアルタイム同期などの重い機能を足さない（無料枠と小規模利用が前提）
- ⛔ パスワードや Supabase キーをコード・クライアントに埋め込まない（環境変数のみ）

## 地雷・非自明な前提

- **トーナメント同点は PK でなく再試合**。同点試合は勝者未確定＝次ラウンドへ反映しない。再試合（`replay_of_match_id`）で勝敗がついて初めて反映する
- **カード管理が最重要仕様**: ①通算イエロー総数と「現在ステージ内」カウントは別物 ②トーナメント進出時にステージ内イエローはリセット（通算は残す）③レッドの未消化停止はトーナメントに引き継ぐ ④停止判定はステージ内イエローが3の倍数に達するたびに発生（詳細は要件定義書 §5.3）
- 未消化の出場停止対象試合は「チームの次の未実施試合」を**表示時に動的解決**し、消化時に確定保存（日程変更で対象が変わるため）
- 順位のタイブレークは 勝点→得失差→**同順位チーム間の直接対決（当該チーム間の勝点→得失差）**→総得点数（2026-07-10 改訂）。それでも並んだら「完全には順位決定できません」表示が必須
- **Supabase Free は7日間ノーアクセスで自動ポーズ**する。大会オフ期間に止まるので運用対策が要る（要件定義書 §7.3）
- Vercel Hobby は**非商用限定**。このアプリを収益化するなら Pro 移行が必要

## 進捗管理

- 作業を終える前に、このディレクトリの `STATUS.md`（段階・一言・実装済み・次の一手・更新日）を最新化すること
- ワークスペースルートの `docs/status.md` は STATUS.md から自動生成されるダッシュボードなので直接編集しない

## 関連ドキュメント

- 要件定義書: [docs/要件定義書.md](docs/要件定義書.md)
