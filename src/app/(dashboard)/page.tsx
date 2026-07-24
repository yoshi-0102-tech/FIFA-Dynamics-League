import Link from "next/link";
import { getMatches, getMatchEvents, getSuspensions, getTeams } from "@/lib/data";
import { computeStandings } from "@/lib/standings";
import { computePlayerRankings } from "@/lib/rankings";
import { computeCardSummary, type StageBucket } from "@/lib/cards";
import type { Match, Stage } from "@/lib/types";
import MatchResultsSection from "./MatchResultsSection";
import { PageHeader, Card } from "@/components/ui";

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

export default async function HomePage() {
  const [teams, allMatches, allEvents, suspensions] = await Promise.all([
    getTeams(),
    getMatches(),
    getMatchEvents(),
    getSuspensions(),
  ]);

  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

  const groupCompletedMatches = allMatches
    .filter((m) => m.stage === "group" && m.status === "completed" && m.home_score !== null && m.away_score !== null)
    .map((m) => ({
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: m.home_score as number,
      away_score: m.away_score as number,
    }));
  const { rows: standingsRows, fullyResolved } = computeStandings(teams, groupCompletedMatches);

  const goalRankings = computePlayerRankings(allEvents, "goal").slice(0, 5);
  const assistRankings = computePlayerRankings(allEvents, "assist").slice(0, 5);

  const matchStageById = new Map(allMatches.map((m) => [m.id, m.stage as Stage]));
  const currentBucket: StageBucket = allMatches.some((m) => m.stage !== "group") ? "tournament" : "group";
  const cardRows = computeCardSummary(allEvents, matchStageById, suspensions, currentBucket, allMatches);
  const suspendedRows = cardRows.filter((r) => r.is_suspended);

  const recentResults = allMatches
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.match_datetime ?? 0).getTime() - new Date(a.match_datetime ?? 0).getTime())
    .slice(0, 3);
  const upcomingMatches = allMatches
    .filter((m) => m.status === "scheduled")
    .slice(0, 3);

  function matchLabel(match: Match) {
    return `${teamNameById.get(match.home_team_id) ?? "?"} vs ${teamNameById.get(match.away_team_id) ?? "?"}`;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="日程・結果" description="大会全体のダッシュボードです" />

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

      <MatchResultsSection matches={allMatches} events={allEvents} teams={teams} />
    </div>
  );
}
