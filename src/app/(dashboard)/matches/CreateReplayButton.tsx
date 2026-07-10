"use client";

import { useTransition } from "react";
import { createReplay } from "./tournamentActions";

export default function CreateReplayButton({ matchId }: { matchId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("この試合の再試合を作成します。よろしいですか？")) return;
    startTransition(async () => {
      try {
        await createReplay(matchId);
      } catch (e) {
        alert(e instanceof Error ? e.message : "作成に失敗しました");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-blue-600 disabled:opacity-50 dark:text-blue-400"
    >
      再試合作成
    </button>
  );
}
