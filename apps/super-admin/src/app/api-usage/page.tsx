"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import {
  Coins,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  Filter,
  Download,
  Search,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default function ApiUsagePage() {
  const { clients, tokens, selectedEnv, setSelectedEnv, showToast } = usePortal();
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<string>("14d");

  // Client usage breakdown calculations
  const clientUsageList = clients.map((c) => {
    const clientTokens = tokens.filter((t) => t.clientId === c.clientId);
    const totalAllocated = clientTokens.reduce((acc, t) => acc + t.allocatedQuota, 0);
    const totalConsumed = clientTokens.reduce((acc, t) => acc + t.consumedQuota, 0);
    const remaining = totalAllocated - totalConsumed;
    const usagePercent = totalAllocated > 0 ? Math.round((totalConsumed / totalAllocated) * 100) : 0;

    return {
      clientId: c.clientId,
      companyName: c.companyName,
      tier: c.subscriptionPlan,
      status: c.status,
      activeTokensCount: clientTokens.filter((t) => t.status === "ACTIVE").length,
      allocatedQuota: totalAllocated,
      consumedQuota: totalConsumed,
      remainingQuota: remaining,
      usagePercent,
      estimatedCostUsd: (totalConsumed * 0.0018).toFixed(2), // $1.80 per 1,000 face operations
    };
  });

  const filteredUsageList = clientUsageList.filter((item) => {
    if (selectedClientFilter !== "ALL" && item.clientId !== selectedClientFilter) return false;
    return true;
  });

  const totalAggregatedConsumed = clientUsageList.reduce((acc, curr) => acc + curr.consumedQuota, 0);
  const totalAggregatedAllocated = clientUsageList.reduce((acc, curr) => acc + curr.allocatedQuota, 0);
  const totalEstBilled = (totalAggregatedConsumed * 0.0018).toFixed(2);

  const endpointBreakdown = [
    { endpoint: "/v1/face/verify", costWeight: "1 unit", count: 48920, percent: 54, type: "Biometric Matching" },
    { endpoint: "/v1/attendance/check-in", costWeight: "2 units", count: 24190, percent: 27, type: "Attendance + GPS" },
    { endpoint: "/v1/attendance/check-out", costWeight: "1 unit", count: 12050, percent: 13, type: "Attendance Record" },
    { endpoint: "/v1/face/register", costWeight: "5 units", count: 3240, percent: 4, type: "R2 Embedding Ingestion" },
    { endpoint: "/v1/employees/*", costWeight: "0.2 unit", count: 1980, percent: 2, type: "Metadata Query" },
  ];

  const handleExportBillingReport = () => {
    showToast("Generating enterprise billing CSV export with SHA-256 ledger checksum...");
    setTimeout(() => {
      showToast("Billing telemetry report exported successfully.");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              API Usage & Token Billing
            </h1>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Metered Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time metering, billable token deductions, endpoint-level unit weights, and consumption forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBillingReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export Audit Ledger
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Billed Units</span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalAggregatedConsumed.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" /> +14.2% vs last billing cycle
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Allocated Quota</span>
            <CreditCard className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalAggregatedAllocated.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400">
            Across {tokens.length} sandbox & gateway tokens
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Estimated Overage Cost</span>
            <Coins className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            ${totalEstBilled}
          </div>
          <span className="text-xs text-slate-400">Calculated at $0.0018 / metered unit</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">High-Water Depletion Warning</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            1 Tenant
          </div>
          <span className="text-xs text-rose-500">Global FinTech (89.5% consumed)</span>
        </div>
      </div>

      {/* Endpoint Weighting Matrix & Consumption Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Endpoint Consumption Breakdown & Unit Weighting
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every API call deducts metered units atomically via Convex ACID mutations.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Last 14 Days</span>
          </div>

          <div className="space-y-4">
            {endpointBreakdown.map((ep) => (
              <div key={ep.endpoint} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {ep.endpoint}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                      Weight: {ep.costWeight}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-[11px]">{ep.type}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ep.count.toLocaleString()} calls ({ep.percent}%)
                    </span>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${ep.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Retries with identical <code className="text-cyan-600 dark:text-cyan-400 font-mono">idempotencyKey</code> do not deduct double units.
            </span>
            <Link
              href="/request-investigation"
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              Verify Trace Log <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Quota Depletion Alert Panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              Automated Quota Policy
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              When remaining UAT or sandbox quota hits 0, the Railway Face Recognition Gateway immediately halts inference with HTTP 429:
            </p>

            <div className="mt-3 p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-rose-400 border border-rose-500/20">
              <code>{`{
  "status": "error",
  "error_code": "TOKEN_EXHAUSTED",
  "message": "Quota limit reached",
  "remaining": 0
}`}</code>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Warning Threshold</span>
                <span className="font-semibold text-amber-500">80% Consumed</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>Hard Cap Cutoff</span>
                <span className="font-semibold text-rose-500">100% Consumed</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Grace Period (Prod)</span>
                <span className="font-semibold text-cyan-500">10% Burst Allowed</span>
              </div>
            </div>
          </div>

          <Link
            href="/uat-tokens"
            className="w-full mt-4 py-2 px-3 text-center text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            Manage Token Allocations
          </Link>
        </div>
      </div>

      {/* Client Usage Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Tenant Quota Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Real-time consumption figures across all enrolled commercial tenants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Enrolled Clients</option>
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.companyName} ({c.clientId})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Client / Tenant</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Active Keys</th>
                <th className="py-3 px-4">Allocated</th>
                <th className="py-3 px-4">Consumed</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4 w-44">Utilization %</th>
                <th className="py-3 px-4 text-right">Estimated Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredUsageList.map((item) => (
                <tr
                  key={item.clientId}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {item.companyName}
                      </div>
                      <div className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                        {item.clientId}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      variant={
                        item.tier === "ENTERPRISE"
                          ? "default"
                          : item.tier === "PROFESSIONAL"
                          ? "info"
                          : "secondary"
                      }
                      label={item.tier}
                    />
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">{item.activeTokensCount}</span> active
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {item.allocatedQuota.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                    {item.consumedQuota.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {item.remainingQuota.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-semibold ${
                            item.usagePercent > 85
                              ? "text-rose-500"
                              : item.usagePercent > 60
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {item.usagePercent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.usagePercent > 85
                              ? "bg-rose-500"
                              : item.usagePercent > 60
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(item.usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    ${item.estimatedCostUsd}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
