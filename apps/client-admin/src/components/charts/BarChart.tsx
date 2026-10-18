"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";

export interface BarSeries {
  key: string;
  label: string;
  /** CSS color for the mark. Text never uses series colors. */
  color: string;
}

export interface BarDatum {
  label: string;
  /** Long form for tooltips and table, e.g. "Mon, 12 Oct". */
  fullLabel: string;
  values: Record<string, number>;
}

/**
 * Measures the element as soon as it mounts (no waiting for the first
 * ResizeObserver frame), then tracks resizes.
 */
function useWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const ref = useCallback((el: T | null) => {
    if (!el) return;
    setWidth(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rect path with only the top two corners rounded (data end), flat at the baseline. */
function topRoundedRect(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

function niceMax(v: number) {
  if (v <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/**
 * Stacked (or single-series) vertical bar chart with legend, hover/focus
 * tooltip and a table view. Values are formatted with `format`.
 */
export function BarChart({
  title,
  series,
  data,
  height = 240,
  yMax,
  format = (v) => String(v),
  showTotal = series.length > 1,
}: {
  title: string;
  series: BarSeries[];
  data: BarDatum[];
  height?: number;
  yMax?: number;
  format?: (v: number) => string;
  showTotal?: boolean;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [view, setView] = useState<"chart" | "table">("chart");

  const totals = data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] ?? 0), 0));
  const max = yMax ?? niceMax(Math.max(0, ...totals));
  const pad = { top: 8, right: 8, bottom: 26, left: 40 };
  const plotW = Math.max(0, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.max(6, Math.min(36, slot * 0.6));
  const y = (v: number) => pad.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const GAP = 2;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {series.length > 1 ? (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Legend">
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                {s.label}
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <div className="inline-flex rounded-lg border border-line p-0.5 text-xs" role="group" aria-label={`${title} view`}>
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium capitalize",
                view === v ? "bg-surface-sunken text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th scope="col" className="py-2 pr-4 font-semibold">Period</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="py-2 pr-4 text-right font-semibold">{s.label}</th>
                ))}
                {showTotal && <th scope="col" className="py-2 text-right font-semibold">Total</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((d, i) => (
                <tr key={d.fullLabel}>
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-secondary">{d.fullLabel}</th>
                  {series.map((s) => (
                    <td key={s.key} className="py-2 pr-4 text-right tabular-nums text-ink">{format(d.values[s.key] ?? 0)}</td>
                  ))}
                  {showTotal && <td className="py-2 text-right tabular-nums text-ink">{format(totals[i])}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={ref} className="relative w-full min-w-0" style={{ height }} onMouseLeave={() => setActive(null)}>
          {width > 0 && (
            <svg className="absolute left-0 top-0" width={width} height={height} role="img" aria-label={`${title}. Use Tab to step through bars, or switch to table view.`}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
                  <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-ink-muted)">
                    {format(Math.round(t * 10) / 10)}
                  </text>
                </g>
              ))}
              {data.map((d, i) => {
                const cx = pad.left + slot * i + slot / 2;
                const x = cx - barW / 2;
                let acc = 0;
                const visible = series.filter((s) => (d.values[s.key] ?? 0) > 0);
                const topKey = visible[visible.length - 1]?.key;
                const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56)));
                return (
                  <g
                    key={d.fullLabel}
                    tabIndex={0}
                    role="graphics-symbol"
                    aria-label={`${d.fullLabel}: ${series.map((s) => `${s.label} ${format(d.values[s.key] ?? 0)}`).join(", ")}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="outline-none"
                  >
                    {/* Hit target spans the whole slot, larger than the mark. */}
                    <rect x={pad.left + slot * i} y={pad.top} width={slot} height={plotH} fill={active === i ? "var(--color-surface-sunken)" : "transparent"} />
                    {visible.map((s) => {
                      const v = d.values[s.key] ?? 0;
                      const y0 = y(acc);
                      acc += v;
                      const y1 = y(acc);
                      const h = Math.max(0, y0 - y1 - (s.key === topKey ? 0 : GAP));
                      return s.key === topKey ? (
                        <path key={s.key} d={topRoundedRect(x, y1, barW, Math.max(0, y0 - y1), 4)} fill={s.color} />
                      ) : (
                        <rect key={s.key} x={x} y={y1 + GAP} width={barW} height={h} fill={s.color} />
                      );
                    })}
                    {i % labelEvery === 0 && (
                      <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--color-ink-muted)">
                        {d.label}
                      </text>
                    )}
                  </g>
                );
              })}
              <line x1={pad.left} x2={width - pad.right} y1={y(0)} y2={y(0)} stroke="var(--color-line-strong)" strokeWidth={1} />
            </svg>
          )}
          {active !== null && data[active] && (
            <div
              role="presentation"
              className="pointer-events-none absolute top-0 z-10 min-w-36 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-pop"
              style={{
                left: Math.min(Math.max(0, pad.left + slot * active + slot / 2 - 72), Math.max(0, width - 150)),
              }}
            >
              <p className="mb-1 font-medium text-ink-secondary">{data[active].fullLabel}</p>
              {series.map((s) => (
                <p key={s.key} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="h-0.5 w-3 rounded" style={{ background: s.color }} aria-hidden />
                    {s.label}
                  </span>
                  <span className="font-semibold tabular-nums text-ink">{format(data[active].values[s.key] ?? 0)}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
