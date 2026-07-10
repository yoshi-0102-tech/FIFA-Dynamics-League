import Link from "next/link";

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

export default function MatchFilterTabs({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {FILTERS.map((f) => (
        <Link
          key={f.value}
          href={f.value === "all" ? "/" : `/?filter=${f.value}`}
          className={
            current === f.value
              ? "rounded-full bg-primary px-3 py-1 text-primary-foreground shadow-sm"
              : "rounded-full border border-border px-3 py-1 text-foreground/70 transition-colors hover:bg-surface-muted"
          }
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
