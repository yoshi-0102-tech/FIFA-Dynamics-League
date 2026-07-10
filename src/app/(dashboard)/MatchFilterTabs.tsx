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
              ? "rounded-full bg-black px-3 py-1 text-white dark:bg-white dark:text-black"
              : "rounded-full border border-black/15 px-3 py-1 text-black/70 hover:bg-black/5 dark:border-white/20 dark:text-white/70 dark:hover:bg-white/10"
          }
        >
          {f.label}
        </Link>
      ))}
    </div>
  );
}
