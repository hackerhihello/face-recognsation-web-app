"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  badge?: "LIVE" | "VERIFIED" | "METERED" | "DEMO";
  color?: "cyan" | "emerald" | "amber" | "rose" | "purple" | "blue";
}

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  badge = "LIVE",
  color = "cyan",
}: MetricCardProps) {
  const colorMap = {
    cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30",
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold border ${colorMap[color]}`}>
                {badge}
              </span>
            )}
            <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {value}
          </span>
          {change && (
            <span
              className={`text-xs font-semibold ${
                isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
          {subtitle}
        </div>
      )}
    </div>
  );
}
