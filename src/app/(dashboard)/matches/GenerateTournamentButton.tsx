"use client";

import { useTransition } from "react";
import { generateTournament } from "./tournamentActions";

export default function GenerateTournamentButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("グループリーグの順位に基づき、準決勝2試合を生成します。よろしいですか？")) return;
    startTransition(async () => {
      try {
        await generateTournament();
      } catch (e) {
        alert(e instanceof Error ? e.message : "生成に失敗しました");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-muted disabled:opacity-50"
    >
      決勝トーナメント生成
    </button>
  );
}
