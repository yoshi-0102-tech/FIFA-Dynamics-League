import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-xl border border-border bg-surface shadow-sm shadow-black/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-foreground/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "accent";

const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-foreground/70",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  success: "bg-primary/10 text-primary-dark dark:text-primary",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400",
  accent: "bg-accent/15 text-accent-foreground dark:text-accent",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${BADGE_TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border py-10 text-center text-sm text-foreground/50">
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}
