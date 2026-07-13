"use client";

import { useActionState, useState } from "react";
import { EVENT_TYPE_LABELS } from "../stageLabels";
import type { EventFormState } from "./eventActions";

type TeamOption = { id: string; name: string };
type GoalEventOption = { id: string; player_name: string; team_id: string };
type TeamPlayerSuggestions = { matchPlayers: string[]; otherPlayers: string[] };

const fieldClass =
  "rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-primary";

function PlayerNameField({
  matchPlayers,
  otherPlayers,
}: {
  matchPlayers: string[];
  otherPlayers: string[];
}) {
  const hasSuggestions = matchPlayers.length > 0 || otherPlayers.length > 0;
  const [mode, setMode] = useState<"select" | "new">(hasSuggestions ? "select" : "new");

  if (mode === "select") {
    return (
      <div className="flex gap-2">
        <select name="player_name" required className={`${fieldClass} flex-1`}>
          {matchPlayers.length > 0 && (
            <optgroup label="この試合の選手">
              {matchPlayers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
          {otherPlayers.length > 0 && (
            <optgroup label="過去の記録から">
              {otherPlayers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <button
          type="button"
          onClick={() => setMode("new")}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-surface-muted"
        >
          ＋ 新規選手
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input name="player_name" required autoFocus placeholder="選手名を入力" className={`${fieldClass} flex-1`} />
      {hasSuggestions && (
        <button
          type="button"
          onClick={() => setMode("select")}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-surface-muted"
        >
          候補から選ぶ
        </button>
      )}
    </div>
  );
}

export default function EventForm({
  action,
  homeTeam,
  awayTeam,
  goalEvents,
  playersByTeam,
}: {
  action: (prevState: EventFormState, formData: FormData) => Promise<EventFormState>;
  homeTeam: TeamOption;
  awayTeam: TeamOption;
  goalEvents: GoalEventOption[];
  playersByTeam: Record<string, TeamPlayerSuggestions>;
}) {
  const [state, formAction, isPending] = useActionState<EventFormState, FormData>(action, {
    error: null,
  });
  const [teamId, setTeamId] = useState(homeTeam.id);

  const suggestions = playersByTeam[teamId] ?? { matchPlayers: [], otherPlayers: [] };
  const goalEventsForTeam = goalEvents.filter((g) => g.team_id === teamId);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm">
          種別
          <select name="event_type" defaultValue="goal" className={fieldClass}>
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
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className={fieldClass}
          >
            <option value={homeTeam.id}>{homeTeam.name}</option>
            <option value={awayTeam.id}>{awayTeam.name}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          分（任意）
          <input type="number" min={0} name="minute" className={`${fieldClass} w-20`} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        選手名
        <PlayerNameField
          key={teamId}
          matchPlayers={suggestions.matchPlayers}
          otherPlayers={suggestions.otherPlayers}
        />
      </label>
      {goalEventsForTeam.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          紐づくゴール（アシストの場合のみ・任意）
          <select key={teamId} name="related_goal_event_id" defaultValue="" className={fieldClass}>
            <option value="">なし</option>
            {goalEventsForTeam.map((g) => (
              <option key={g.id} value={g.id}>
                {g.player_name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        備考（任意）
        <input name="note" className={fieldClass} />
      </label>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-50"
      >
        追加する
      </button>
    </form>
  );
}
