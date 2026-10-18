"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { AuditLogEntry } from "@/types/portal";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Layers,
  Code,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

export default function AuditLogsPage() {
  const { auditLogs, clients, selectedEnv, setSelectedEnv } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterOutcome, setFilterOutcome] = useState("ALL");
  const [inspectingEntry, setInspectingEntry] = useState<AuditLogEntry | null>(null);

  // Filter audit logs
  const filtered = auditLogs.filter((entry) => {
    if (selectedEnv !== "ALL" && entry.environment !== selectedEnv) return false;
    if (filterAction !== "ALL" && !entry.action.includes(filterAction)) return false;
    if (filterOutcome !== "ALL" && entry.outcome !== filterOutcome) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchActor = entry.actorEmail.toLowerCase().includes(q);
      const matchAction = entry.action.toLowerCase().includes(q);
      const matchTarget = entry.targetResource.toLowerCase().includes(q);
      const matchReq = entry.requestId.toLowerCase().includes(q);
      const matchClient = entry.companyName?.toLowerCase().includes(q) || entry.clientId?.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchTarget && !matchReq && !matchClient) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Immutable Audit Logs
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Convex WORM Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Write-Once-Read-Many administrative audit trail for compliance, forensic investigation, and credential events.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time append-only stream active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by actor email, action, resource, Request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Action filter */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CLIENT">Client Actions</option>
              <option value="MASTER">Master Admin Actions</option>
              <option value="TOKEN">Token & Credential Actions</option>
              <option value="FEATURE">Feature Flag Actions</option>
              <option value="ENDPOINT">API Endpoint Actions</option>
            </select>

            {/* Outcome filter */}
            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED</option>
              <option value="FAILED">FAILED</option>
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

      {/* Audit Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Client / Tenant</th>
                <th className="py-3 px-4">Env</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.auditId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-medium text-slate-900 dark:text-white block">
                          {log.actorEmail}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.actorRole}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {log.targetResource}
                    </td>
                    <td className="py-3 px-4">
                      {log.companyName ? (
                        <div>
                          <span className="text-slate-800 dark:text-slate-200 block">
                            {log.companyName}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                            {log.clientId}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        variant={
                          log.environment === "PROD"
                            ? "success"
                            : log.environment === "UAT"
                            ? "warning"
                            : "info"
                        }
                        label={log.environment}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        variant={
                          log.outcome === "SUCCESS"
                            ? "success"
                            : log.outcome === "DENIED"
                            ? "warning"
                            : "danger"
                        }
                        label={log.outcome}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <Link
                        href={`/request-investigation?req=${log.requestId}`}
                        className="text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        {log.requestId}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectingEntry(log)}
                        className="p-1.5 rounded text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="View Full Metadata"
                      >
                        <Code className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Inspection Modal */}
      {inspectingEntry && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingEntry(null)}
          title={`Audit Ledger Entry — ${inspectingEntry.auditId}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Actor:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {inspectingEntry.actorEmail} ({inspectingEntry.actorRole})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Action Type:</span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                  {inspectingEntry.action}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Resource:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {inspectingEntry.targetResource}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Correlated Request ID:</span>
                <Link
                  href={`/request-investigation?req=${inspectingEntry.requestId}`}
                  className="font-mono text-cyan-500 hover:underline inline-flex items-center gap-1"
                >
                  {inspectingEntry.requestId} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Convex Raw Document Metadata
              </label>
              <pre className="p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
                {JSON.stringify(
                  {
                    auditId: inspectingEntry.auditId,
                    timestamp: inspectingEntry.timestamp,
                    actor: inspectingEntry.actorEmail,
                    action: inspectingEntry.action,
                    outcome: inspectingEntry.outcome,
                    metadata: inspectingEntry.metadata || {},
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingEntry(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
