"use client";

import { useActionState } from "react";
import { EVENT_TYPE_LABELS } from "../stageLabels";
import type { EventFormState } from "./eventActions";

type TeamOption = { id: string; name: string };
type GoalEventOption = { id: string; player_name: string; team_id: string };

export default function EventForm({
  action,
  homeTeam,
  awayTeam,
  goalEvents,
  playerSuggestions,
}: {
  action: (prevState: EventFormState, formData: FormData) => Promise<EventFormState>;
  homeTeam: TeamOption;
  awayTeam: TeamOption;
  goalEvents: GoalEventOption[];
  playerSuggestions: string[];
}) {
  const [state, formAction, isPending] = useActionState<EventFormState, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          種別
          <select
            name="event_type"
            defaultValue="goal"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
          >
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          所属チーム
          <select
            name="team_id"
            defaultValue={homeTeam.id}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
          >
            <option value={homeTeam.id}>{homeTeam.name}</option>
            <option value={awayTeam.id}>{awayTeam.name}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          分（任意）
          <input
            type="number"
            min={0}
            name="minute"
            className="w-20 rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        選手名
        <input
          name="player_name"
          list="player-name-suggestions"
          required
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
        <datalist id="player-name-suggestions">
          {playerSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>
      {goalEvents.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          紐づくゴール（アシストの場合のみ・任意）
          <select
            name="related_goal_event_id"
            defaultValue=""
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
          >
            <option value="">なし</option>
            {goalEvents.map((g) => (
              <option key={g.id} value={g.id}>
                {g.player_name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        備考（任意）
        <input
          name="note"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/40"
        />
      </label>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        追加する
      </button>
    </form>
  );
}
