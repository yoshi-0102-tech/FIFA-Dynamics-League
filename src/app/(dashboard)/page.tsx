import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeStandings } from "@/lib/standings";
import { computePlayerRankings } from "@/lib/rankings";
import { computeCardSummary, type StageBucket } from "@/lib/cards";
import type { EventType, Match, MatchStatus, Stage } from "@/lib/types";
import { STAGE_LABELS, STATUS_LABELS, STATUS_TONES } from "./matches/stageLabels";
import MatchFilterTabs from "./MatchFilterTabs";
import { PageHeader, Card, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const STAGE_VALUES: Stage[] = ["group", "semifinal", "final", "third_place", "replay"];
const STATUS_VALUES: MatchStatus[] = ["scheduled", "completed", "draw_replay_needed", "postponed"];

function formatDate(value: string | null): string {
  if (!value) return "未定";
  return new Date(value).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SummaryCard({
  icon,
  title,
  link,
  children,
}: {
  icon: string;
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground/80">
          <span>{icon}</span>
          {title}
        </h2>
        {link && (
          <Link href={link.href} className="text-xs text-primary-dark hover:underline dark:text-primary">
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;

  const supabase = createSupabaseServerClient();
  const [
    { data: teams },
    { data: matches, error: matchesError },
    { data: events },
    { data: suspensions },
  ] = await Promise.all([
    supabase.from("teams").select("id, name, display_order").order("display_order", { ascending: true }),
    supabase
      .from("matches")
      .select("*")
      .order("match_datetime", { ascending: true, nullsFirst: false }),
    supabase.from("match_events").select("player_name, team_id, event_type, match_id"),
    supabase.from("suspensions").select("id, player_name, team_id, reason, is_served, source_match_id"),
  ]);

  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const allMatches = matches ?? [];
  const allEvents = events ?? [];

  const groupCompletedMatches = allMatches
    .filter((m) => m.stage === "group" && m.status === "completed" && m.home_score !== null && m.away_score !== null)
    .map((m) => ({
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: m.home_score as number,
      away_score: m.away_score as number,
    }));
  const { rows: standingsRows, fullyResolved } = computeStandings(teams ?? [], groupCompletedMatches);

  const goalRankings = computePlayerRankings(allEvents, "goal").slice(0, 5);
  const assistRankings = computePlayerRankings(allEvents, "assist").slice(0, 5);

  const matchStageById = new Map(allMatches.map((m) => [m.id, m.stage as Stage]));
  const currentBucket: StageBucket = allMatches.some((m) => m.stage !== "group") ? "tournament" : "group";
  const cardRows = computeCardSummary(allEvents, matchStageById, suspensions ?? [], currentBucket, allMatches);
  const suspendedRows = cardRows.filter((r) => r.is_suspended);

  const recentResults = allMatches
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.match_datetime ?? 0).getTime() - new Date(a.match_datetime ?? 0).getTime())
    .slice(0, 3);
  const upcomingMatches = allMatches
    .filter((m) => m.status === "scheduled")
    .slice(0, 3);

  const filteredMatches = allMatches.filter((m) => {
    if (filter === "all") return true;
    if ((STAGE_VALUES as string[]).includes(filter)) return m.stage === filter;
    if ((STATUS_VALUES as string[]).includes(filter)) return m.status === filter;
    return true;
  });

  function eventsFor(matchId: string, type: EventType) {
    return allEvents.filter((e) => e.match_id === matchId && e.event_type === type);
  }

  function matchLabel(match: Match) {
    return `${teamNameById.get(match.home_team_id) ?? "?"} vs ${teamNameById.get(match.away_team_id) ?? "?"}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="日程・結果" description="大会全体のダッシュボードです" />

      {matchesError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          読み込みに失敗しました: {matchesError.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard icon="🏁" title="直近の結果">
          {recentResults.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {recentResults.map((m) => (
                <li key={m.id} className="flex flex-col">
                  <span className="text-xs text-foreground/50">{formatDate(m.match_datetime)}</span>
                  <span>
                    {matchLabel(m)} <span className="font-semibold">{m.home_score}-{m.away_score}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/50">まだ結果がありません</p>
          )}
        </SummaryCard>

        <SummaryCard icon="📅" title="次回の試合予定">
          {upcomingMatches.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {upcomingMatches.map((m) => (
                <li key={m.id} className="flex flex-col">
                  <span className="text-xs text-foreground/50">{formatDate(m.match_datetime)}</span>
                  <span>{matchLabel(m)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/50">予定されている試合がありません</p>
          )}
        </SummaryCard>

        <SummaryCard icon="🏆" title="順位表" link={{ href: "/standings", label: "全順位を見る" }}>
          {standingsRows.length ? (
            <>
              <ol className="flex flex-col gap-1.5 text-sm">
                {standingsRows.slice(0, 4).map((row) => (
                  <li key={row.team_id} className="flex items-center justify-between">
                    <span>
                      {row.rank}
                      {row.provisional && "*"}. {row.team_name}
                    </span>
                    <span className="font-semibold text-primary-dark dark:text-primary">{row.points}pt</span>
                  </li>
                ))}
              </ol>
              {!fullyResolved && (
                <p className="text-xs text-amber-600 dark:text-amber-400">※ 完全には順位を決定できません</p>
              )}
            </>
          ) : (
            <p className="text-sm text-foreground/50">まだ試合結果がありません</p>
          )}
        </SummaryCard>

        <SummaryCard icon="🚫" title="出場停止中" link={{ href: "/cards", label: "詳細を見る" }}>
          {suspendedRows.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {suspendedRows.map((row) => (
                <li key={`${row.player_name}-${row.team_id}`}>
                  {row.player_name}（{teamNameById.get(row.team_id) ?? "?"}）
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/50">現在出場停止中の選手はいません</p>
          )}
        </SummaryCard>

        <SummaryCard icon="⚽" title="得点ランキング上位" link={{ href: "/players", label: "全成績を見る" }}>
          {goalRankings.length ? (
            <ol className="flex flex-col gap-1.5 text-sm">
              {goalRankings.map((row) => (
                <li key={`${row.player_name}-${row.team_id}`} className="flex items-center justify-between">
                  <span>
                    {row.rank}. {row.player_name}（{teamNameById.get(row.team_id) ?? "?"}）
                  </span>
                  <span className="font-semibold">{row.count}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-foreground/50">記録がまだありません</p>
          )}
        </SummaryCard>

        <SummaryCard icon="🎯" title="アシストランキング上位">
          {assistRankings.length ? (
            <ol className="flex flex-col gap-1.5 text-sm">
              {assistRankings.map((row) => (
                <li key={`${row.player_name}-${row.team_id}`} className="flex items-center justify-between">
                  <span>
                    {row.rank}. {row.player_name}（{teamNameById.get(row.team_id) ?? "?"}）
                  </span>
                  <span className="font-semibold">{row.count}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-foreground/50">記録がまだありません</p>
          )}
        </SummaryCard>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">全試合日程・結果</h2>
        <MatchFilterTabs current={filter} />

        <Card className="overflow-x-auto">
          {filteredMatches.length ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-3 font-medium text-foreground/60">日時</th>
                  <th className="px-3 py-3 font-medium text-foreground/60">ステージ</th>
                  <th className="px-3 py-3 font-medium text-foreground/60">ホーム</th>
                  <th className="px-3 py-3 font-medium text-foreground/60">スコア</th>
                  <th className="px-3 py-3 font-medium text-foreground/60">アウェイ</th>
                  <th className="px-3 py-3 font-medium text-foreground/60">状態</th>
                  <th className="px-3 py-3 font-medium text-foreground/60">得点者</th>
                  <th className="px-3 py-3 font-medium text-foreground/60">カード</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m) => {
                  const goals = eventsFor(m.id, "goal");
                  const yellows = eventsFor(m.id, "yellow_card");
                  const reds = eventsFor(m.id, "red_card");
                  return (
                    <tr key={m.id} className="border-t border-border transition-colors hover:bg-surface-muted/60">
                      <td className="px-3 py-3 whitespace-nowrap text-foreground/70">{formatDate(m.match_datetime)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-foreground/70">{STAGE_LABELS[m.stage]}</td>
                      <td className="px-3 py-3 font-medium">{teamNameById.get(m.home_team_id) ?? "?"}</td>
                      <td className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                        {m.home_score ?? "-"} - {m.away_score ?? "-"}
                      </td>
                      <td className="px-3 py-3 font-medium">{teamNameById.get(m.away_team_id) ?? "?"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <Badge tone={STATUS_TONES[m.status]}>{STATUS_LABELS[m.status]}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-foreground/70">
                        {goals.length ? goals.map((g) => g.player_name).join(", ") : ""}
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        {yellows.map((y) => `🟨${y.player_name}`).join(" ")}
                        {yellows.length && reds.length ? " " : ""}
                        {reds.map((r) => `🟥${r.player_name}`).join(" ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState>該当する試合がありません</EmptyState>
          )}
        </Card>
      </section>
    </div>
  );
}
