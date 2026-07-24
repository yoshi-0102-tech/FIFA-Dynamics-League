import "server-only";

import packageJson from "../../package.json";

export const APP_VERSION = packageJson.version;

export const UPDATE_HISTORY = [
  {
    version: APP_VERSION,
    date: "2026-07-24",
    title: "初回公開版",
    description: "大会運用に必要な機能を揃え、日常的に使える状態として公開しました。",
    changes: [
      "チーム、試合日程、結果、選手イベントの管理",
      "順位表、得点・アシストランキングの自動集計",
      "カード累積と出場停止の管理",
      "決勝トーナメントと同点再試合フロー",
      "スマートフォン向けUIと使い方ガイド",
      "共有キャッシュと東京リージョン配置によるページ移動の高速化",
    ],
  },
] as const;

export const APP_UPDATED_AT = UPDATE_HISTORY[0].date;

export function getBuildId(): string {
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
}
