import { AlertCircle, FlaskConical, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4", className)} aria-hidden />;
}

export function EmptyState({
  title,
  message,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-surface-sunken p-3">
        <Icon className="h-5 w-5 text-ink-muted" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-danger-soft p-3">
        <AlertCircle className="h-5 w-5 text-danger" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-ink">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Shown on every screen backed by the sample adapter. */
export function SampleDataBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-card border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Sample data — UI preview only.</span> These figures are generated for layout
        review and are not live attendance. Changes are kept in this browser tab and are lost on reload.
      </p>
    </div>
  );
}
