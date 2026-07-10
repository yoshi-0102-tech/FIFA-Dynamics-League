"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMatch } from "./actions";

export default function DeleteMatchButton({
  matchId,
  redirectTo,
}: {
  matchId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("この試合を削除します。関連する選手イベント・出場停止記録も削除されます。よろしいですか？")) return;
    startTransition(async () => {
      try {
        await deleteMatch(matchId);
        if (redirectTo) router.push(redirectTo);
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
