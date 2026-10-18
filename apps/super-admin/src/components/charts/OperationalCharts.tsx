"use client";

import React from "react";

export function UsageTrendChart() {
  // 14-day simulated data
  const days = [
    { label: "Sep 26", prod: 4200, uat: 1200, dev: 350 },
    { label: "Sep 27", prod: 4500, uat: 1400, dev: 400 },
    { label: "Sep 28", prod: 3100, uat: 800, dev: 200 },
    { label: "Sep 29", prod: 2900, uat: 600, dev: 150 },
    { label: "Sep 30", prod: 5100, uat: 1900, dev: 500 },
    { label: "Oct 01", prod: 5600, uat: 2100, dev: 620 },
    { label: "Oct 02", prod: 5800, uat: 2200, dev: 580 },
    { label: "Oct 03", prod: 6100, uat: 2450, dev: 700 },
    { label: "Oct 04", prod: 6400, uat: 2800, dev: 820 },
    { label: "Oct 05", prod: 4100, uat: 1100, dev: 300 },
    { label: "Oct 06", prod: 6850, uat: 3200, dev: 910 },
    { label: "Oct 07", prod: 7200, uat: 3400, dev: 980 },
    { label: "Oct 08", prod: 7600, uat: 3650, dev: 1050 },
    { label: "Oct 09", prod: 8100, uat: 3900, dev: 1120 },
  ];

  const maxVal = 14000;
  const chartHeight = 180;
  const chartWidth = 520;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">API Request Volume by Environment</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">14-day aggregated throughput</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500"></span> PROD
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500"></span> UAT
          </span>
          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-500"></span> DEV
          </span>
        </div>
      </div>

      <div className="h-52 w-full flex items-end gap-2 pt-6 pb-2">
        {days.map((d, idx) => {
          const total = d.prod + d.uat + d.dev;
          const totalH = (total / maxVal) * chartHeight;
          const prodH = (d.prod / total) * totalH;
          const uatH = (d.uat / total) * totalH;
          const devH = (d.dev / total) * totalH;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap">
                <span>{d.label}: {total.toLocaleString()} reqs</span>
                <span className="text-[9px] text-slate-400">P:{d.prod} | U:{d.uat} | D:{d.dev}</span>
              </div>

              {/* Stacked bar */}
              <div className="w-full max-w-[24px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all group-hover:brightness-110">
                <div style={{ height: `${devH}px` }} className="bg-sky-500 w-full" />
                <div style={{ height: `${uatH}px` }} className="bg-amber-500 w-full" />
                <div style={{ height: `${prodH}px` }} className="bg-emerald-500 w-full" />
              </div>

              <span className="text-[9px] font-mono text-slate-400 mt-2 rotate-45 sm:rotate-0 origin-left sm:origin-center">
                {d.label.split(" ")[1]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ErrorTaxonomyChart() {
  const errors = [
    { code: "FACE_NOT_MATCHED", count: 184, percent: 46, color: "bg-rose-500" },
    { code: "LOCATION_OUTSIDE_RADIUS", count: 112, percent: 28, color: "bg-amber-500" },
    { code: "TOKEN_EXHAUSTED", count: 48, percent: 12, color: "bg-purple-500" },
    { code: "FEATURE_DISABLED", count: 32, percent: 8, color: "bg-blue-500" },
    { code: "FACE_API_TIMEOUT", count: 24, percent: 6, color: "bg-slate-500" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Error Code Taxonomy</h3>
          <span className="text-xs font-mono text-rose-500 font-bold">400 Total Failures</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Past 7 days categorized by error code</p>

        {/* Stacked progress bar */}
        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden mb-5">
          {errors.map((err) => (
            <div
              key={err.code}
              style={{ width: `${err.percent}%` }}
              className={`${err.color} h-full transition-all`}
              title={`${err.code}: ${err.count}`}
            />
          ))}
        </div>

        {/* Breakdown list */}
        <div className="space-y-2.5">
          {errors.map((err) => (
            <div key={err.code} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-sm ${err.color}`}></span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{err.code}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-500 dark:text-slate-400">{err.count}</span>
                <span className="font-semibold text-slate-900 dark:text-white w-8 text-right">{err.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between">
        <span>Failure Rate: 0.72%</span>
        <span>Target SLA: &lt; 1.00%</span>
      </div>
    </div>
  );
}

export function LatencyPercentilesChart() {
  const percentiles = [
    { label: "P50 (Median)", value: 142, max: 400, target: 160 },
    { label: "P90", value: 178, max: 400, target: 220 },
    { label: "P95 (SLA Threshold)", value: 215, max: 400, target: 280 },
    { label: "P99 (Max Latency)", value: 312, max: 400, target: 450 },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Biometric Latency Percentiles</h3>
        <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
          SLA Compliant
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        Railway Python ArcFace Inference & Cloudflare R2 Embeddings Latency
      </p>

      <div className="space-y-4">
        {percentiles.map((p) => {
          const percent = (p.value / p.max) * 100;
          const targetPercent = (p.target / p.max) * 100;

          return (
            <div key={p.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-600 dark:text-slate-400">{p.label}</span>
                <span className="font-bold text-slate-900 dark:text-white">{p.value}ms</span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${percent}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                />
                <div
                  style={{ left: `${targetPercent}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                  title={`Target limit: ${p.target}ms`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-mono text-slate-400">
        <span>Average: 154ms</span>
        <span>Red bar: Max Target SLA</span>
      </div>
    </div>
  );
}
