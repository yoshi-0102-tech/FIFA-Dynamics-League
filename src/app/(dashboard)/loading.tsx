export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-40 rounded bg-surface-muted" />
        <div className="h-4 w-64 rounded bg-surface-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-24 rounded-xl bg-surface-muted" />
        <div className="h-24 rounded-xl bg-surface-muted" />
      </div>
      <div className="h-64 rounded-xl bg-surface-muted" />
    </div>
  );
}
