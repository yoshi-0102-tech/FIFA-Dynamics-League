"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState } from "@/components/ui";
import type { Match, MatchEvent, Team } from "@/lib/types";
import MatchFilterTabs, { isMatchFilter, type MatchFilter } from "./MatchFilterTabs";
import { STAGE_LABELS, STATUS_LABELS, STATUS_TONES } from "./matches/stageLabels";

function formatDate(value: string | null): string {
  if (!value) return "未定";
  return new Date(value).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchResultsSection({
  matches,
  events,
  teams,
}: {
  matches: Match[];
  events: MatchEvent[];
  teams: Team[];
}) {
  const [filter, setFilter] = useState<MatchFilter>("all");
  const teamNameById = new Map(teams.map((team) => [team.id, team.name]));
  const eventsByMatchId = new Map<string, MatchEvent[]>();

  for (const event of events) {
    const matchEvents = eventsByMatchId.get(event.match_id) ?? [];
    matchEvents.push(event);
    eventsByMatchId.set(event.match_id, matchEvents);
  }

  useEffect(() => {
    function syncFilterFromUrl() {
      const value = new URLSearchParams(window.location.search).get("filter");
      setFilter(isMatchFilter(value) ? value : "all");
    }

    syncFilterFromUrl();
    window.addEventListener("popstate", syncFilterFromUrl);
    return () => window.removeEventListener("popstate", syncFilterFromUrl);
  }, []);

  function changeFilter(nextFilter: MatchFilter) {
    if (nextFilter === filter) return;

    setFilter(nextFilter);
    const url = new URL(window.location.href);
    if (nextFilter === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", nextFilter);
    }
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true;
    if (["group", "semifinal", "final", "third_place", "replay"].includes(filter)) {
      return match.stage === filter;
    }
    return match.status === filter;
  });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">全試合日程・結果</h2>
      <MatchFilterTabs current={filter} onChange={changeFilter} />

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
              {filteredMatches.map((match) => {
                const matchEvents = eventsByMatchId.get(match.id) ?? [];
                const goals = matchEvents.filter((event) => event.event_type === "goal");
                const yellows = matchEvents.filter((event) => event.event_type === "yellow_card");
                const reds = matchEvents.filter((event) => event.event_type === "red_card");

                return (
                  <tr key={match.id} className="border-t border-border transition-colors hover:bg-surface-muted/60">
                    <td className="px-3 py-3 whitespace-nowrap text-foreground/70">{formatDate(match.match_datetime)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-foreground/70">{STAGE_LABELS[match.stage]}</td>
                    <td className="px-3 py-3 font-medium">{teamNameById.get(match.home_team_id) ?? "?"}</td>
                    <td className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                      {match.home_score ?? "-"} - {match.away_score ?? "-"}
                    </td>
                    <td className="px-3 py-3 font-medium">{teamNameById.get(match.away_team_id) ?? "?"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge tone={STATUS_TONES[match.status]}>{STATUS_LABELS[match.status]}</Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-foreground/70">
                      {goals.map((goal) => goal.player_name).join(", ")}
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      {yellows.map((yellow) => `🟨${yellow.player_name}`).join(" ")}
                      {yellows.length && reds.length ? " " : ""}
                      {reds.map((red) => `🟥${red.player_name}`).join(" ")}
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
  );
}
