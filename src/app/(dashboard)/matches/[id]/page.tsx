import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MatchForm from "../MatchForm";
import { updateMatch } from "../actions";
import DeleteMatchButton from "../DeleteMatchButton";
import { createMatchEvent } from "./eventActions";
import EventForm from "./EventForm";
import DeleteEventButton from "./DeleteEventButton";
import { EVENT_TYPE_LABELS } from "../stageLabels";

export const dynamic = "force-dynamic";

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const [{ data: match }, { data: teams }, { data: events }, { data: allEvents }] = await Promise.all([
    supabase.from("matches").select("*").eq("id", id).single(),
    supabase.from("teams").select("*").order("display_order", { ascending: true }),
    supabase
      .from("match_events")
      .select("*")
      .eq("match_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("match_events").select("player_name"),
  ]);

  if (!match) notFound();

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const homeTeam = { id: match.home_team_id, name: teamNameById.get(match.home_team_id) ?? "?" };
  const awayTeam = { id: match.away_team_id, name: teamNameById.get(match.away_team_id) ?? "?" };

  const matchEvents = events ?? [];
  const goalEvents = matchEvents
    .filter((e) => e.event_type === "goal")
    .map((e) => ({ id: e.id, player_name: e.player_name, team_id: e.team_id }));

  const playerSuggestions = Array.from(new Set((allEvents ?? []).map((e) => e.player_name))).sort();

  const homeGoalCount = matchEvents.filter((e) => e.event_type === "goal" && e.team_id === match.home_team_id).length;
  const awayGoalCount = matchEvents.filter((e) => e.event_type === "goal" && e.team_id === match.away_team_id).length;
  const assistCount = matchEvents.filter((e) => e.event_type === "assist").length;
  const goalCount = matchEvents.filter((e) => e.event_type === "goal").length;

  const warnings: string[] = [];
  if (match.home_score !== null && homeGoalCount !== match.home_score) {
    warnings.push(
      `ホームのゴールイベント数（${homeGoalCount}）とスコア（${match.home_score}）が一致していません`,
    );
  }
  if (match.away_score !== null && awayGoalCount !== match.away_score) {
    warnings.push(
      `アウェイのゴールイベント数（${awayGoalCount}）とスコア（${match.away_score}）が一致していません`,
    );
  }
  if (assistCount > goalCount) {
    warnings.push(`アシスト数（${assistCount}）がゴール数（${goalCount}）を超えています`);
  }

  const updateMatchWithId = updateMatch.bind(null, id);
  const createMatchEventWithId = createMatchEvent.bind(null, id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">試合編集</h1>
          <DeleteMatchButton matchId={match.id} redirectTo="/matches" />
        </div>
        <MatchForm match={match} teams={teams ?? []} action={updateMatchWithId} submitLabel="保存する" />
      </div>

      <div className="flex max-w-2xl flex-col gap-4">
        <h2 className="text-xl font-bold">選手イベント</h2>

        {warnings.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            {warnings.map((w) => (
              <p key={w}>⚠ {w}</p>
            ))}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-3 py-2 font-medium">種別</th>
                <th className="px-3 py-2 font-medium">選手</th>
                <th className="px-3 py-2 font-medium">チーム</th>
                <th className="px-3 py-2 font-medium">分</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {matchEvents.length ? (
                matchEvents.map((event) => (
                  <tr key={event.id} className="border-t border-black/10 dark:border-white/10">
                    <td className="px-3 py-2">{EVENT_TYPE_LABELS[event.event_type]}</td>
                    <td className="px-3 py-2">{event.player_name}</td>
                    <td className="px-3 py-2">{teamNameById.get(event.team_id) ?? "?"}</td>
                    <td className="px-3 py-2">{event.minute ?? ""}</td>
                    <td className="px-3 py-2 text-right">
                      <DeleteEventButton matchId={id} eventId={event.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-black/50 dark:text-white/50">
                    イベントはまだありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <EventForm
          action={createMatchEventWithId}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          goalEvents={goalEvents}
          playerSuggestions={playerSuggestions}
        />
      </div>
    </div>
  );
}
