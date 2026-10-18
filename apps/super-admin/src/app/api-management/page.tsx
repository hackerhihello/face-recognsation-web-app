"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { ApiEndpointConfig, Environment } from "@/types/portal";
import {
  ServerCog,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Clock,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Sliders,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

export default function ApiManagementPage() {
  const { apiEndpoints, toggleEndpointStatus, selectedEnv, setSelectedEnv, showToast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [configuringEndpoint, setConfiguringEndpoint] = useState<ApiEndpointConfig | null>(null);
  const [newRateLimit, setNewRateLimit] = useState<number>(300);

  // Filter endpoints
  const filteredEndpoints = apiEndpoints.filter((ep) => {
    if (selectedEnv !== "ALL" && ep.environment !== selectedEnv) return false;
    if (filterMethod !== "ALL" && ep.method !== filterMethod) return false;
    if (filterStatus === "ENABLED" && !ep.isEnabled) return false;
    if (filterStatus === "DISABLED" && ep.isEnabled) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ep.name.toLowerCase().includes(q);
      const matchPath = ep.endpoint.toLowerCase().includes(q);
      const matchScope = ep.requiredScope.toLowerCase().includes(q);
      if (!matchName && !matchPath && !matchScope) return false;
    }
    return true;
  });

  const enabledCount = apiEndpoints.filter((e) => e.isEnabled).length;
  const disabledCount = apiEndpoints.filter((e) => !e.isEnabled).length;
  const avgLatency = Math.round(
    apiEndpoints.reduce((acc, curr) => acc + curr.p95LatencyMs, 0) / (apiEndpoints.length || 1)
  );

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "POST":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "PATCH":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "DELETE":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const handleSaveRateLimit = () => {
    if (configuringEndpoint) {
      showToast(`Rate limit for ${configuringEndpoint.endpoint} updated to ${newRateLimit} req/min.`);
      setConfiguringEndpoint(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              API Gateway Management
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Railway Engine + Workers WAF
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enforce scopes, toggle route availability, tune token bucket rate limits, and monitor live P95 latency SLAs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/request-investigation"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            Trace Requests
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Catalog Routes</span>
            <ServerCog className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {apiEndpoints.length}
          </div>
          <span className="text-xs text-slate-400">Deployed across 3 clusters</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active / Enabled</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {enabledCount}
          </div>
          <span className="text-xs text-slate-400">{disabledCount} disabled in gateway</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average P95 Latency</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {avgLatency} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <span className="text-xs text-emerald-500">Within 350ms SLA target</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">WAF Rate Limit Protection</span>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Enforced
          </div>
          <span className="text-xs text-slate-400">Sliding window per client token</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by endpoint, scope (e.g. /v1/face/verify, face:verify)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Method filter */}
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All HTTP Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ENABLED">Enabled Only</option>
              <option value="DISABLED">Disabled Only</option>
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

      {/* Endpoints Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Method & Route</th>
                <th className="py-3 px-4">Operation Name</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Required Scope</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">P95 SLA</th>
                <th className="py-3 px-4">Err %</th>
                <th className="py-3 px-4 text-center">Gateway Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No API endpoints match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((ep) => (
                  <tr
                    key={ep.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getMethodBadge(
                            ep.method
                          )}`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {ep.endpoint}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {ep.name}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        variant={
                          ep.environment === "PROD"
                            ? "success"
                            : ep.environment === "UAT"
                            ? "warning"
                            : "info"
                        }
                        label={ep.environment}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {ep.requiredScope}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">{ep.rateLimitPerMin}</span>{" "}
                      <span className="text-[10px] text-slate-400">req/min</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          ep.p95LatencyMs > 400
                            ? "text-amber-500"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {ep.p95LatencyMs} ms
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          ep.errorRatePercent > 2
                            ? "text-rose-500"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {ep.errorRatePercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleEndpointStatus(ep.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          ep.isEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        title={ep.isEnabled ? "Click to disable route" : "Click to enable route"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            ep.isEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setConfiguringEndpoint(ep);
                          setNewRateLimit(ep.rateLimitPerMin);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                      >
                        <Sliders className="h-3 w-3 text-cyan-500" />
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Limit Modal */}
      {configuringEndpoint && (
        <Modal
          isOpen={true}
          onClose={() => setConfiguringEndpoint(null)}
          title={`Configure SLA & Rate Limit — ${configuringEndpoint.endpoint}`}
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-400">Endpoint:</span>{" "}
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {configuringEndpoint.method} {configuringEndpoint.endpoint}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Required Scope:</span>{" "}
                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                  {configuringEndpoint.requiredScope}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Target Environment:</span>{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {configuringEndpoint.environment}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sliding Window Rate Limit (Requests per minute per tenant)
              </label>
              <input
                type="number"
                value={newRateLimit}
                onChange={(e) => setNewRateLimit(Number(e.target.value))}
                min={10}
                max={5000}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Enforced by Cloudflare Workers KV token bucket before reaching Railway backend.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Changes take effect across edge PoPs within 30 seconds. Rate limit adjustments will be recorded in the Super Admin immutable Audit Log.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfiguringEndpoint(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRateLimit}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
              >
                Apply Rate Limit
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
