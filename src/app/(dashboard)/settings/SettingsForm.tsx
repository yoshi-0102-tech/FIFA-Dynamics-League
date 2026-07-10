"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsFormState } from "./actions";

export default function SettingsForm({
  tournamentName,
  yellowCardsForSuspension,
  groupStageQualifiers,
}: {
  tournamentName: string;
  yellowCardsForSuspension: string;
  groupStageQualifiers: string;
}) {
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(updateSettings, {
    error: null,
  });

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        大会名
        <input
          name="tournament_name"
          defaultValue={tournamentName}
          required
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        />
        <span className="text-xs text-foreground/50">ヘッダーなど画面上部の表示に使われます</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        出場停止になるイエロー枚数
        <input
          type="number"
          min={1}
          name="yellow_cards_for_suspension"
          defaultValue={yellowCardsForSuspension}
          required
          className="w-32 rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        />
        <span className="text-xs text-foreground/50">
          ステージ内（グループ／決勝トーナメント）のイエローがこの枚数の倍数に達するたび出場停止1回
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        決勝トーナメント進出チーム数
        <input
          type="number"
          min={2}
          step={2}
          name="group_stage_qualifiers"
          defaultValue={groupStageQualifiers}
          required
          className="w-32 rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        />
        <span className="text-xs text-foreground/50">
          グループリーグ上位何チームが決勝トーナメントに進出するか（偶数のみ）
        </span>
      </label>

      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && !state.error && (
        <p className="text-sm text-primary-dark dark:text-primary">保存しました</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        保存する
      </button>
    </form>
  );
}
