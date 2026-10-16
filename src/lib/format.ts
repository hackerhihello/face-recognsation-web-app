const pad = (n: number) => String(n).padStart(2, "0");

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, opts);
}

export function formatMonth(yyyyMm: string, style: "short" | "long" = "short") {
  return formatDate(`${yyyyMm}-01`, { month: style, year: style === "long" ? "numeric" : "2-digit" });
}

/** "HH:mm:ss" → "9:05 AM" */
export function formatTime(hms?: string) {
  if (!hms) return "—";
  const [h, m] = hms.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(minutes?: number) {
  if (minutes === undefined) return "—";
  return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "An unexpected error occurred.";
}
