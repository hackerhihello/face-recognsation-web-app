"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { ErrorLogEntry } from "@/types/portal";
import {
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  Flame,
  Clock,
  ShieldAlert,
  Layers,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default function ErrorLogsPage() {
  const { errorLogs, clients, selectedEnv, setSelectedEnv, showToast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterErrorCode, setFilterErrorCode] = useState("ALL");

  const filtered = errorLogs.filter((err) => {
    if (selectedEnv !== "ALL" && err.environment !== selectedEnv) return false;
    if (filterSeverity !== "ALL" && err.severity !== filterSeverity) return false;
    if (filterErrorCode !== "ALL" && err.errorCode !== filterErrorCode) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchReq = err.requestId.toLowerCase().includes(q);
      const matchClient = err.companyName.toLowerCase().includes(q);
      const matchCode = err.errorCode.toLowerCase().includes(q);
      const matchMsg = err.safeMessage.toLowerCase().includes(q);
      const matchEp = err.endpoint.toLowerCase().includes(q);
      if (!matchReq && !matchClient && !matchCode && !matchMsg && !matchEp) {
        return false;
      }
    }
    return true;
  });

  const criticalCount = errorLogs.filter((e) => e.severity === "CRITICAL").length;
  const highCount = errorLogs.filter((e) => e.severity === "HIGH").length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "MEDIUM":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Live Error Logs & Exception Triage
            </h1>
            <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              Correlated Tracing
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time exception feed. All errors contain sanitized safe messages and correlation keys to the Request Investigation Center.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/request-investigation"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            Launch Investigation Center
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Critical Incidents (24h)</span>
            <Flame className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {criticalCount}
          </div>
          <span className="text-xs text-rose-500">Requires immediate SRE attention</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">High Severity</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {highCount}
          </div>
          <span className="text-xs text-slate-400">Timeouts & Geofence violations</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Top Exception Reason</span>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-2 truncate">
            FACE_API_TIMEOUT
          </div>
          <span className="text-xs text-slate-400">Railway ONNX worker latency spike</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mean Triage Duration</span>
            <Clock className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            4.2 <span className="text-xs font-normal text-slate-400">mins</span>
          </div>
          <span className="text-xs text-emerald-500">Target SLA: &lt; 15 mins</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by error code, safe message, endpoint, Request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <select
              value={filterErrorCode}
              onChange={(e) => setFilterErrorCode(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Error Codes</option>
              <option value="FACE_API_TIMEOUT">FACE_API_TIMEOUT</option>
              <option value="LOCATION_OUTSIDE_RADIUS">LOCATION_OUTSIDE_RADIUS</option>
              <option value="TOKEN_EXHAUSTED">TOKEN_EXHAUSTED</option>
              <option value="FACE_NOT_MATCHED">FACE_NOT_MATCHED</option>
              <option value="FEATURE_DISABLED">FEATURE_DISABLED</option>
            </select>

            {/* Env toggle pills */}
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700">
              {(["ALL", "PROD", "UAT", "DEV"] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setSelectedEnv(env)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    selectedEnv === env
                      ? "bg-cyan-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Logs Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Error Code</th>
                <th className="py-3 px-4">Safe Error Message</th>
                <th className="py-3 px-4">HTTP Status</th>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Investigation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No exceptions match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((err) => (
                  <tr
                    key={err.errorId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(
                          err.severity
                        )}`}
                      >
                        {err.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                      {err.errorCode}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {err.safeMessage}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          err.httpStatus >= 500
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {err.httpStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {err.endpoint}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-900 dark:text-white font-medium block">
                        {err.companyName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {err.clientId}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {err.durationMs}ms
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/request-investigation?req=${err.requestId}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 transition"
                      >
                        Investigate {err.requestId}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
