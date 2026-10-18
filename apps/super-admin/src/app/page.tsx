"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  UserCheck,
  ScanFace,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Search,
} from "lucide-react";
import { usePortal } from "@/lib/store";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { UsageTrendChart, ErrorTaxonomyChart, LatencyPercentilesChart } from "@/components/charts/OperationalCharts";
import { SystemTopologyDiagram } from "@/components/architecture/SystemTopologyDiagram";

export default function OverviewDashboardPage() {
  const { clients, masterAdmins, employees, tokens, requestTraces, errorLogs, selectedEnv, setSelectedEnv } = usePortal();

  const [dateRange, setDateRange] = useState("7d");
  const [selectedClientFilter, setSelectedClientFilter] = useState("ALL");

  // Filter clients based on environment if not ALL
  const filteredClients = selectedEnv === "ALL"
    ? clients
    : clients.filter((c) => c.allowedEnvironments.includes(selectedEnv));

  const totalClients = filteredClients.length;
  const activeClients = filteredClients.filter((c) => c.status === "ACTIVE").length;

  const totalMasterAdmins = masterAdmins.filter(
    (m) => selectedClientFilter === "ALL" || m.clientId === selectedClientFilter
  ).length;

  const totalEmployees = employees.filter(
    (e) => selectedClientFilter === "ALL" || e.clientId === selectedClientFilter
  ).length;

  const faceRegistrations = employees.filter((e) => e.faceId).length;

  // Token aggregates
  const uatTokens = tokens.filter((t) => t.environment === "UAT");
  const totalUatConsumed = uatTokens.reduce((acc, t) => acc + t.consumedQuota, 0);
  const totalUatRemaining = uatTokens.reduce((acc, t) => acc + t.remainingQuota, 0);

  const prodTokens = tokens.filter((t) => t.environment === "PROD");
  const totalProdVolume = prodTokens.reduce((acc, t) => acc + t.consumedQuota, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Strip */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-[#0b1322] dark:via-[#070d18] dark:to-[#0b1322] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
              OPERATIONAL COCKPIT
            </span>
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE FLEET VERIFIED
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Super Admin Mission Control
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Real-time biometric attendance telemetry, multi-tenant fleet isolation, forensic request tracing, and quota governance across DEV, UAT, and PROD clusters.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Client Filter */}
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Clients ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.clientId} value={c.clientId}>
                {c.companyName} ({c.clientId})
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">This Quarter</option>
          </select>

          {/* Quick Investigation Button */}
          <Link
            href="/request-investigation"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Trace Request</span>
          </Link>
        </div>
      </div>

      {/* Row 1: Core Fleet & Tenancy Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clients / Tenants"
          value={totalClients}
          subtitle={`${activeClients} Active • ${totalClients - activeClients} Suspended / Trial`}
          change="+12% MoM"
          icon={Building2}
          color="cyan"
          badge="LIVE"
        />
        <MetricCard
          title="Master Administrators"
          value={totalMasterAdmins}
          subtitle="Strictly 1:1 tenant-scoped accounts"
          change="+4 this mo"
          icon={UserCheck}
          color="blue"
          badge="LIVE"
        />
        <MetricCard
          title="Total Employees"
          value={totalEmployees.toLocaleString()}
          subtitle={`${faceRegistrations} Biometrics Enrolled (${Math.round((faceRegistrations / (totalEmployees || 1)) * 100)}%)`}
          change="+185 staff"
          icon={Users}
          color="purple"
          badge="LIVE"
        />
        <MetricCard
          title="Face Registrations"
          value={faceRegistrations}
          subtitle="512-d encrypted vectors in Cloudflare R2"
          change="98.2% avg fidelity"
          icon={ScanFace}
          color="emerald"
          badge="VERIFIED"
        />
      </div>

      {/* Row 2: Biometric & API Request Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="API Success Rate"
          value="99.28%"
          subtitle="400 failed / 55,420 total invocations"
          change="+0.14%"
          icon={CheckCircle2}
          color="emerald"
          badge="LIVE"
        />
        <MetricCard
          title="Avg P95 Face Latency"
          value="182ms"
          subtitle="Railway ArcFace + R2 read duration"
          change="-22ms speedup"
          icon={Clock}
          color="cyan"
          badge="VERIFIED"
        />
        <MetricCard
          title="UAT Tokens Consumed"
          value={totalUatConsumed.toLocaleString()}
          subtitle={`${totalUatRemaining.toLocaleString()} Remaining in sandbox pool`}
          change="Metered"
          icon={Coins}
          color="amber"
          badge="METERED"
        />
        <MetricCard
          title="Production Volume"
          value={`${totalProdVolume.toLocaleString()} req`}
          subtitle="Zero cross-tenant parameter leakage"
          change="Active prod tier"
          icon={ShieldCheck}
          color="emerald"
          badge="LIVE"
        />
      </div>

      {/* Charts Section: Traffic Trends & Latency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <UsageTrendChart />
        </div>
        <div className="lg:col-span-1">
          <ErrorTaxonomyChart />
        </div>
      </div>

      {/* Second Analytics Row: Latency Percentiles + Recent Critical Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <LatencyPercentilesChart />
        </div>

        {/* Live Critical Incident / Error Feed */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Forensic Incidents</h3>
              </div>
              <Link
                href="/error-logs"
                className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View All Error Logs</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time exception feed linked directly to unique Request IDs for forensic investigation.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-mono text-slate-400">
                    <th className="pb-2">Request ID</th>
                    <th className="pb-2">Client / Error Code</th>
                    <th className="pb-2">API Endpoint</th>
                    <th className="pb-2">Env</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {errorLogs.slice(0, 4).map((err) => (
                    <tr key={err.errorId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                        {err.requestId}
                      </td>
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{err.companyName}</div>
                        <span className="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          {err.errorCode}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {err.endpoint}
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={err.environment} size="sm" />
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/request-investigation?q=${err.requestId}`}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:border-cyan-500"
                        >
                          Investigate
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Zero Unresolved P0 Criticals</span>
            <span>Edge Auto-Recover: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* System Architecture Flowchart (Mermaid) */}
      <SystemTopologyDiagram title="End-to-End Biometric Verification & Tracing Architecture" />
    </div>
  );
}
