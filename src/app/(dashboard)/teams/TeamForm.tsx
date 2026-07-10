"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Team } from "@/lib/types";
import type { FormState } from "./actions";

const inputClass =
  "rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary";

export default function TeamForm({
  team,
  action,
  submitLabel,
}: {
  team?: Team;
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        チーム名
        <input name="name" defaultValue={team?.name} required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        表示順
        <input
          type="number"
          name="display_order"
          defaultValue={team?.display_order ?? 0}
          className={`${inputClass} w-32`}
        />
        <span className="text-xs text-foreground/50">
          一覧や選択肢の並び順です。小さい数字ほど先に表示されます（未入力・同じ値でも問題ありません）
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        備考（任意）
        <textarea name="note" defaultValue={team?.note ?? ""} rows={3} className={inputClass} />
      </label>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <Link
          href="/teams"
          className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-muted"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
