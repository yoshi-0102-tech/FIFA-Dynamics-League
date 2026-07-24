# コードレビュー結果（2026-07-24）

## 対象・前提

- 対象: 現在のリポジトリ全体
- 基準: `docs/要件定義書.md`
- 方法: 静的レビュー
- 未実施: テスト、型チェック、ビルドの再実行

## Findings

### 1. [P0] Supabase Data APIから共通パスワード認証を迂回できる可能性がある

`supabase/schema.sql:3`でRLSを無効化し、`anon` / `authenticated`権限を剥奪していない。既存Supabaseプロジェクトのデフォルト権限では、`public`テーブルがData API経由で読み書き可能になる。

プロジェクトURLとpublishable/anon keyが分かれば、Next.jsの認証を通らず全データを操作できる可能性がある。`supabase/schema.sql:10-106`

本番DBの権限確認を最優先にし、全テーブルでRLSを有効化してポリシーを作らない構成、または`anon` / `authenticated`から権限を剥奪する必要がある。service roleはRLSを迂回できる。

参考:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api

### 2. [P1] カードイベントを削除しても出場停止が残る

`deleteMatchEvent()`は`match_events`だけを削除している。3枚目のイエローやレッドを削除しても生成済みの`suspensions`が残り、再登録すると停止が重複する。`src/app/(dashboard)/matches/[id]/eventActions.ts:102-105`

### 3. [P1] 試合編集によって別チームの出場停止を誤消化できる

試合更新前に`serveSuspensionsForCompletedMatch()`を実行するため、ホーム / アウェイを変更しながら「終了」にすると、更新前のチームを基準に停止が消化される。停止更新時のSupabaseエラーも確認していない。`src/app/(dashboard)/matches/actions.ts:82-90`, `src/app/(dashboard)/matches/actions.ts:101-120`

### 4. [P1] 終了済み試合を未実施へ戻しても停止消化が取り消されない

`completed`から`scheduled` / `postponed`へ戻した場合や、停止対象試合を削除した場合に、`is_served=true`が残る。削除時はFKにより試合IDだけNULLになる。`src/app/(dashboard)/matches/actions.ts:82-90`, `supabase/schema.sql:86-88`

### 5. [P1] 準決勝結果を修正しても決勝カードが更新されない

決勝が既に存在すると`reflectTournamentProgress()`が即終了する。決勝生成後に準決勝のスコアを修正・取消・削除しても、古い勝者のままになる。`src/app/(dashboard)/matches/tournamentActions.ts:103-141`

### 6. [P1] 順位未確定でもトーナメントを生成できる

`computeStandings()`の`fullyResolved`を確認せず、仮表示順から進出チームを選んでいる。進出境界で完全同順位になると、`display_order`によって一方だけが進出する。`src/app/(dashboard)/matches/tournamentActions.ts:49-60`

### 7. [P1] 進出枠設定とトーナメント生成処理が一致していない

設定は2以上の偶数を許可するが、生成処理は1位対4位・2位対3位で固定されている。2チーム設定ではエラー、6チーム以上では5位以下が無視される。`src/app/(dashboard)/settings/actions.ts:20-28`, `src/lib/tournament.ts:9-17`

### 8. [P1] カード登録と出場停止生成が非原子的

イベントINSERT後に別リクエストでカード枚数を数え、停止をINSERTしている。途中失敗では停止が欠落し、同時登録では重複または未生成になり得る。一意制約もない。`src/app/(dashboard)/matches/[id]/eventActions.ts:26-39`, `src/app/(dashboard)/matches/[id]/eventActions.ts:70-98`

### 9. [P1] 日程の上書き生成で既存結果を不可逆に失う可能性がある

既存グループ戦のDELETEと新日程のINSERTがトランザクション化されていない。INSERT失敗時には旧日程だけでなく、カスケードされたイベント・停止も失われる。確認文にも関連データ削除が明示されていない。`src/app/(dashboard)/matches/actions.ts:143-157`

### 10. [P2] 同じ試合から複数の再試合を作成できる

既存の子再試合を検査せず、DBにも一意制約がない。チェーンが分岐すると`.find()`で最初に見つかった試合だけを採用するため、決勝進出者がDB返却順に左右される。`src/app/(dashboard)/matches/tournamentActions.ts:72-94`, `src/lib/tournament.ts:49-60`

### 11. [P2] 選手イベントの所属先と関連ゴールをサーバー側で検証していない

試合に参加していないチームのカードやゴール、別試合のゴールに紐づくアシストをFormData改変で登録できる。試合の参加チームやステージを後から変更した場合も既存イベント・停止が再検証されない。`src/app/(dashboard)/matches/[id]/eventActions.ts:15-34`

### 12. [P2] ログインAPIに試行回数制限がない

`/api/login`は公開され、失敗回数・IP制限・バックオフがない。共有パスワードが短い場合、辞書攻撃で全編集権限を取得される。`src/proxy.ts:4-10`, `src/app/api/login/route.ts:11-15`

### 13. [P2] カード画面の「現在ステージ」判定が早すぎる

非グループ試合が1件でも存在するとトーナメント区分へ切り替わる。グループ進行中に準決勝を手動登録すると、ステージ内イエローが突然0枚表示になる。`src/app/(dashboard)/cards/page.tsx:25-27`

### 14. [P3] ログイン後のリダイレクト先を検証していない

`/login?redirect=https://evil.example`のような外部URLをそのまま`router.replace()`へ渡している。フィッシング誘導に利用できる。`src/app/login/LoginForm.tsx:31-32`

## テスト上の不足

純粋関数の既存42ケースではServer ActionとDBの整合性を検出できない。また、3チーム以上の直接対決テストは実際には全体勝点だけで順位が決まっており、ミニリーグを検証できていない。`src/lib/standings.test.ts:126-154`

## 推奨する対応順

1. 本番SupabaseのRLS・権限を確認して認証迂回を閉じる
2. カードイベントと出場停止の生成・削除・消化を一貫して再計算できるようにする
3. 順位未確定時のトーナメント生成を拒否する
4. 準決勝修正時に決勝・3位決定戦を再同期する
5. 再試合の一意性と日程上書きの原子性をDBで保証する
6. Server Action / Supabase連携の統合テストを追加する

## 追記: 画面遷移高速化

2026-07-24に、レビューとは別にページ移動の性能改善を実装した。

- 主要5テーブルの読み取りを5分間共有キャッシュ
- Server Actionによる登録・編集・削除後はキャッシュを即時無効化
- ダッシュボード配下の`force-dynamic`を撤廃
- トップ画面の試合フィルターをクライアント内処理へ変更
- Vercel FunctionをSupabaseと同じ東京リージョン（`hnd1`）へ固定

DBスキーマおよび既存レコードは変更していない。本レビューのセキュリティ・データ整合性に関するFindingsは、別途対応が必要。
