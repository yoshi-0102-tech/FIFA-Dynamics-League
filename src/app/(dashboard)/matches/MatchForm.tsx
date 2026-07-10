"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Match, Team } from "@/lib/types";
import { STAGE_LABELS, STATUS_LABELS } from "./stageLabels";
import type { FormState } from "./actions";

function toDatetimeLocal(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MatchForm({
  match,
  teams,
  action,
  submitLabel,
}: {
  match?: Match;
  teams: Team[];
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(action, { error: null });

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        ホームチーム
        <select
          name="home_team_id"
          defaultValue={match?.home_team_id}
          required
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        >
          <option value="" disabled>
            選択してください
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        アウェイチーム
        <select
          name="away_team_id"
          defaultValue={match?.away_team_id}
          required
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        >
          <option value="" disabled>
            選択してください
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          ホーム得点
          <input
            type="number"
            min={0}
            name="home_score"
            defaultValue={match?.home_score ?? ""}
            className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          アウェイ得点
          <input
            type="number"
            min={0}
            name="away_score"
            defaultValue={match?.away_score ?? ""}
            className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        試合日時（任意）
        <input
          type="datetime-local"
          name="match_datetime"
          defaultValue={toDatetimeLocal(match?.match_datetime ?? null)}
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        ステージ
        <select
          name="stage"
          defaultValue={match?.stage ?? "group"}
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        >
          {Object.entries(STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        ステータス
        <select
          name="status"
          defaultValue={match?.status ?? "scheduled"}
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        メモ（任意）
        <textarea
          name="note"
          defaultValue={match?.note ?? ""}
          rows={2}
          className="rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary"
        />
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
          href="/matches"
          className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-surface-muted"
        >
          キャンセル
        </Link>
      </div>
    </form>
  );
}
