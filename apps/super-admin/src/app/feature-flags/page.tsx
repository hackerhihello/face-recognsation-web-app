"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { ClientTenant } from "@/types/portal";
import {
  ToggleLeft,
  ShieldCheck,
  Search,
  Sliders,
  AlertTriangle,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  Building2,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

export default function FeatureFlagsPage() {
  const { clients, updateClientFeatureFlag, showToast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("ALL");
  const [globalLivenessEnforced, setGlobalLivenessEnforced] = useState(false);

  const featureDefinitions: Array<{
    key: keyof ClientTenant["enabledFeatures"];
    label: string;
    description: string;
    isHighImpact?: boolean;
  }> = [
    {
      key: "faceRegistration",
      label: "Face Registration",
      description: "Allows enrolling new employee faces into Cloudflare R2 vector store (/v1/face/register)",
    },
    {
      key: "faceVerification",
      label: "Biometric Verification",
      description: "Enables Railway AI 1:1 and 1:N face matching engine (/v1/face/verify)",
      isHighImpact: true,
    },
    {
      key: "attendance",
      label: "Attendance Engine",
      description: "Processes check-in / check-out punch ledger and shifts (/v1/attendance/*)",
    },
    {
      key: "gpsValidation",
      label: "GPS & Geofencing",
      description: "Enforces haversine radius checks against enrolled office location coordinates",
    },
    {
      key: "strictLiveness",
      label: "Strict Liveness Detection",
      description: "Passive blink and anti-spoofing depth analysis to prevent photo attacks",
      isHighImpact: true,
    },
    {
      key: "reports",
      label: "Export & Reporting",
      description: "Allows generating PDF/Excel biometric audit attendance digests",
    },
    {
      key: "notifications",
      label: "Instant Notifications",
      description: "Dispatches SMS/Email/Slack alerts on irregular punch or spoofing events",
    },
    {
      key: "payrollExport",
      label: "Payroll Sync API",
      description: "Enables automated hourly wage and attendance sync into ERP systems",
    },
  ];

  const filteredClients = clients.filter((c) => {
    if (selectedClient !== "ALL" && c.clientId !== selectedClient) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.companyName.toLowerCase().includes(q) && !c.clientId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleToggleGlobalLiveness = () => {
    const next = !globalLivenessEnforced;
    setGlobalLivenessEnforced(next);
    showToast(`Global Strict Liveness enforcement set to ${next ? "ACTIVE" : "OPTIONAL"}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tenant Feature Flags & Entitlements
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Zero-Downtime Rollout
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic capability toggling per tenant. Every modification triggers backend schema re-validation and audit log entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleGlobalLiveness}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition ${
              globalLivenessEnforced
                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Platform Strict Liveness: {globalLivenessEnforced ? "FORCED ON" : "TENANT-CONTROLLED"}
          </button>
        </div>
      </div>

      {/* Feature Catalog Legend */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Available Modular Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {featureDefinitions.map((f) => (
            <div
              key={f.key}
              className="p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {f.label}
                </span>
                {f.isHighImpact && (
                  <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 font-medium">
                    Core
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, client ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Clients ({clients.length})</option>
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feature Flags Client Matrix */}
      <div className="space-y-4">
        {filteredClients.map((client) => (
          <div
            key={client.clientId}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4"
          >
            {/* Client Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {client.companyName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      {client.companyName}
                    </h3>
                    <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      {client.clientId}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Plan Tier: <strong className="text-slate-300">{client.subscriptionPlan}</strong> • {client.totalEmployees} Enrolled Employees
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge
                  variant={client.status === "ACTIVE" ? "success" : "secondary"}
                  label={client.status}
                />
              </div>
            </div>

            {/* Matrix Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {featureDefinitions.map((f) => {
                const isEnabled = client.enabledFeatures[f.key];

                return (
                  <div
                    key={f.key}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                      isEnabled
                        ? "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80"
                        : "bg-slate-50/30 dark:bg-slate-950/30 border-slate-100 dark:border-slate-900 opacity-60"
                    }`}
                  >
                    <div className="pr-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                        {f.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isEnabled ? "ACTIVE" : "DISABLED"}
                      </span>
                    </div>

                    <button
                      onClick={() => updateClientFeatureFlag(client.clientId, f.key, !isEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                      title={`Toggle ${f.label}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
