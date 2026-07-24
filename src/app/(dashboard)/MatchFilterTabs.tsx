"use client";

const FILTERS = [
  { value: "all", label: "全試合" },
  { value: "group", label: "グループリーグ" },
  { value: "semifinal", label: "準決勝" },
  { value: "final", label: "決勝" },
  { value: "third_place", label: "3位決定戦" },
  { value: "replay", label: "再試合" },
  { value: "scheduled", label: "未実施" },
  { value: "completed", label: "終了" },
] as const;

export type MatchFilter = (typeof FILTERS)[number]["value"];

export function isMatchFilter(value: string | null): value is MatchFilter {
  return FILTERS.some((filter) => filter.value === value);
}

export default function MatchFilterTabs({
  current,
  onChange,
}: {
  current: MatchFilter;
  onChange: (filter: MatchFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {FILTERS.map((f) => (
        <button
          type="button"
          key={f.value}
          onClick={() => onChange(f.value)}
          aria-pressed={current === f.value}
          className={
            current === f.value
              ? "rounded-full bg-primary px-3 py-1 text-primary-foreground shadow-sm"
              : "rounded-full border border-border px-3 py-1 text-foreground/70 transition-colors hover:bg-surface-muted"
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
