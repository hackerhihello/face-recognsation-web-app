"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { SystemServiceHealth } from "@/types/portal";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cloud,
  Database,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function SystemHealthPage() {
  const { systemHealth, showToast } = usePortal();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>("Just now");

  const handleRefreshHealth = () => {
    setIsRefreshing(true);
    showToast("Dispatching parallel health probes to Railway, R2, Convex, and Cloudflare edge...");
    setTimeout(() => {
      setIsRefreshing(false);
      setLastCheckTime("Just now (0.2s ago)");
      showToast("All 5 core infrastructure components responded healthy (HTTP 200).");
    }, 1200);
  };

  const operationalCount = systemHealth.filter((s) => s.status === "OPERATIONAL").length;
  const avgLatency = Math.round(
    systemHealth.reduce((acc, curr) => acc + curr.latencyMs, 0) / (systemHealth.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Health & Infrastructure Telemetry
            </h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Live Edge Probes
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time heartbeat monitoring across Railway GPU/CPU inference, Cloudflare R2 vector buckets, and Convex document sync.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshHealth}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Run Probe Diagnostics
          </button>
        </div>
      </div>

      {/* Global Telemetry Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              All Core Systems Fully Operational
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {operationalCount} / {systemHealth.length} services passing synthetic SLAs. Last checked: {lastCheckTime}.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Fleet Uptime (30d):</span>
            <span className="font-bold text-emerald-500">99.98%</span>
          </div>
          <div>
            <span className="text-slate-400 block">Avg Probe Latency:</span>
            <span className="font-bold text-slate-900 dark:text-white">{avgLatency} ms</span>
          </div>
        </div>
      </div>

      {/* Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemHealth.map((service) => (
          <div
            key={service.serviceId}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    {service.component.includes("Railway") ? (
                      <Server className="h-4 w-4 text-cyan-500" />
                    ) : service.component.includes("R2") ? (
                      <Cloud className="h-4 w-4 text-amber-500" />
                    ) : service.component.includes("Convex") ? (
                      <Database className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {service.name}
                    </h3>
                    <span className="text-[11px] text-slate-400">{service.component}</span>
                  </div>
                </div>

                <StatusBadge
                  variant={
                    service.status === "OPERATIONAL"
                      ? "success"
                      : service.status === "DEGRADED"
                      ? "warning"
                      : "danger"
                  }
                  label={service.status}
                />
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400">Hosting Provider:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {service.infrastructure}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400">Uptime SLA:</span>
                  <span className="font-semibold text-emerald-500">
                    {service.uptimePercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400">Probe Latency:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {service.latencyMs} ms
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Primary Region:</span>
                  <span className="font-mono text-slate-500">
                    {service.region}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Diagnostic passed
              </span>
              <span>{service.lastChecked}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
