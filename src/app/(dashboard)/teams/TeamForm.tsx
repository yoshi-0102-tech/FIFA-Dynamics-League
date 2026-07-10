"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Team } from "@/lib/types";
import type { FormState } from "./actions";

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
        <input
          name="name"
          defaultValue={team?.name}
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        表示順
        <input
          type="number"
          name="display_order"
          defaultValue={team?.display_order ?? 0}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        備考（任意）
        <textarea
          name="note"
          defaultValue={team?.note ?? ""}
          rows={3}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
      </label>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {submitLabel}
        </button>
        <Link
          href="/teams"
          className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
