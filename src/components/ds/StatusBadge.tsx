import { AlertTriangle, CheckCircle2, Circle, Clock, MinusCircle, ScanFace, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AttendanceStatus, EmployeeStatus } from "@/services/types";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<Tone, string> = {
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/25",
  danger: "bg-danger-soft text-danger ring-danger/20",
  info: "bg-info-soft text-info ring-info/20",
  neutral: "bg-neutral-soft text-ink-secondary ring-line-strong/60",
};

/** Status is always conveyed by text + icon, never by color alone. */
export function StatusBadge({
  tone,
  label,
  icon: Icon = Circle,
  className,
}: {
  tone: Tone;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}

const EMPLOYEE: Record<EmployeeStatus, { tone: Tone; label: string; icon: typeof Circle }> = {
  ACTIVE: { tone: "success", label: "Active", icon: CheckCircle2 },
  PENDING_FACE_REGISTRATION: { tone: "warning", label: "Pending face", icon: Clock },
  TERMINATED: { tone: "neutral", label: "Inactive", icon: MinusCircle },
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return <StatusBadge {...EMPLOYEE[status]} />;
}

export function FaceStatusBadge({ registered }: { registered: boolean }) {
  return registered ? (
    <StatusBadge tone="info" label="Registered" icon={ScanFace} />
  ) : (
    <StatusBadge tone="warning" label="Not registered" icon={AlertTriangle} />
  );
}

const ATTENDANCE: Record<AttendanceStatus, { tone: Tone; label: string; icon: typeof Circle }> = {
  PRESENT: { tone: "success", label: "Present", icon: CheckCircle2 },
  LATE: { tone: "warning", label: "Late", icon: Clock },
  HALF_DAY: { tone: "info", label: "Half day", icon: Circle },
  ABSENT: { tone: "danger", label: "Absent", icon: XCircle },
  OVERTIME: { tone: "info", label: "Overtime", icon: Clock },
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return <StatusBadge {...ATTENDANCE[status]} />;
}
