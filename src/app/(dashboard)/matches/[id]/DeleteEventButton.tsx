"use client";

import { useTransition } from "react";
import { deleteMatchEvent } from "./eventActions";

export default function DeleteEventButton({ matchId, eventId }: { matchId: string; eventId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("このイベントを削除します。よろしいですか？")) return;
    startTransition(async () => {
      try {
        await deleteMatchEvent(matchId, eventId);
      } catch (e) {
        alert(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 disabled:opacity-50 dark:text-red-400"
    >
      削除
    </button>
  );
}
