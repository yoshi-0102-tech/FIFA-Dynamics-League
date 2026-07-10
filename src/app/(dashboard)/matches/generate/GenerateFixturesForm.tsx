"use client";

import { useTransition } from "react";
import Link from "next/link";
import { generateGroupFixtures } from "../actions";

export default function GenerateFixturesForm({
  teamCount,
  hasExistingMatches,
}: {
  teamCount: number;
  hasExistingMatches: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const disabled = teamCount < 2 || isPending;

  function handleGenerate(mode: "overwrite" | "append") {
    const message =
      mode === "overwrite"
        ? "既存のグループリーグ日程をすべて削除して、新しく生成し直します。よろしいですか？"
        : "既存のグループリーグ日程はそのままに、新しい日程を追加します（重複する可能性があります）。よろしいですか？";
    if (!confirm(message)) return;

    startTransition(async () => {
      try {
        await generateGroupFixtures(mode);
      } catch (e) {
        alert(e instanceof Error ? e.message : "生成に失敗しました");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {teamCount < 2 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          チームが2つ以上登録されている必要があります。先にチーム管理から登録してください。
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={() => handleGenerate("overwrite")}
          disabled={disabled}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {hasExistingMatches ? "上書きして生成" : "生成する"}
        </button>
        {hasExistingMatches && (
          <button
            onClick={() => handleGenerate("append")}
            disabled={disabled}
            className="rounded-md border border-black/15 px-4 py-2 text-sm disabled:opacity-50 dark:border-white/20"
          >
            追加生成
          </button>
        )}
        <Link
          href="/matches"
          className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
        >
          キャンセル
        </Link>
      </div>
    </div>
  );
}
