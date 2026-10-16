import { cn } from "@/lib/cn";
import { Skeleton } from "./States";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "text-primary bg-primary-soft",
  loading,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <span className={cn("rounded-lg p-1.5", accent)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-7 w-16" />
          <Skeleton className="mt-2 h-3 w-24" />
        </>
      ) : (
        <>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
        </>
      )}
    </div>
  );
}
