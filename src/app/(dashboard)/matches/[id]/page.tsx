import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MatchForm from "../MatchForm";
import { updateMatch } from "../actions";
import DeleteMatchButton from "../DeleteMatchButton";
import { createMatchEvent } from "./eventActions";
import EventForm from "./EventForm";
import DeleteEventButton from "./DeleteEventButton";
import { EVENT_TYPE_LABELS } from "../stageLabels";
import { PageHeader, Card, EmptyState } from "@/components/ui";

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
    supabase.from("match_events").select("player_name, team_id"),
  ]);

  if (!match) notFound();

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const homeTeam = { id: match.home_team_id, name: teamNameById.get(match.home_team_id) ?? "?" };
  const awayTeam = { id: match.away_team_id, name: teamNameById.get(match.away_team_id) ?? "?" };

  const matchEvents = events ?? [];
  const goalEvents = matchEvents
    .filter((e) => e.event_type === "goal")
    .map((e) => ({ id: e.id, player_name: e.player_name, team_id: e.team_id }));

  function playersForTeam(teamId: string) {
    const matchPlayers = Array.from(
      new Set(matchEvents.filter((e) => e.team_id === teamId).map((e) => e.player_name)),
    ).sort();
    const otherPlayers = Array.from(
      new Set((allEvents ?? []).filter((e) => e.team_id === teamId).map((e) => e.player_name)),
    )
      .filter((name) => !matchPlayers.includes(name))
      .sort();
    return { matchPlayers, otherPlayers };
  }

  const playersByTeam = {
    [homeTeam.id]: playersForTeam(homeTeam.id),
    [awayTeam.id]: playersForTeam(awayTeam.id),
  };

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
        <PageHeader
          title="試合編集"
          description={`${homeTeam.name} vs ${awayTeam.name}`}
          actions={<DeleteMatchButton matchId={match.id} redirectTo="/matches" />}
        />
        <Card className="max-w-md p-5">
          <MatchForm match={match} teams={teams ?? []} action={updateMatchWithId} submitLabel="保存する" />
        </Card>
      </div>

      <div className="flex max-w-2xl flex-col gap-4">
        <h2 className="text-xl font-bold">選手イベント</h2>

        {warnings.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            {warnings.map((w) => (
              <p key={w}>⚠ {w}</p>
            ))}
          </div>
        )}

        <Card className="overflow-x-auto">
          {matchEvents.length ? (
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 font-medium text-foreground/60">種別</th>
                  <th className="px-4 py-3 font-medium text-foreground/60">選手</th>
                  <th className="px-4 py-3 font-medium text-foreground/60">チーム</th>
                  <th className="px-4 py-3 font-medium text-foreground/60">分</th>
                  <th className="px-4 py-3 font-medium text-foreground/60"></th>
                </tr>
              </thead>
              <tbody>
                {matchEvents.map((event) => (
                  <tr key={event.id} className="border-t border-border transition-colors hover:bg-surface-muted/60">
                    <td className="px-4 py-3">{EVENT_TYPE_LABELS[event.event_type]}</td>
                    <td className="px-4 py-3 font-medium">{event.player_name}</td>
                    <td className="px-4 py-3 text-foreground/70">{teamNameById.get(event.team_id) ?? "?"}</td>
                    <td className="px-4 py-3 text-foreground/70">{event.minute ?? ""}</td>
                    <td className="px-4 py-3 text-right">
                      <DeleteEventButton matchId={id} eventId={event.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState>イベントはまだありません</EmptyState>
          )}
        </Card>

        <Card className="p-5">
          <EventForm
            action={createMatchEventWithId}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            goalEvents={goalEvents}
            playersByTeam={playersByTeam}
          />
        </Card>
      </div>
    </div>
  );
}
