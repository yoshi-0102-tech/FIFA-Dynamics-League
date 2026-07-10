"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTeam } from "./actions";

export default function DeleteTeamButton({
  teamId,
  teamName,
  redirectTo,
}: {
  teamId: string;
  teamName: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`「${teamName}」を削除します。よろしいですか？`)) return;
    startTransition(async () => {
      try {
        await deleteTeam(teamId);
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
