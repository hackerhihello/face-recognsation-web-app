"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  SearchCode,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  UserCheck,
  Users,
  ScanFace,
  Server,
  Coins,
  KeyRound,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FileText,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { usePortal } from "@/lib/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyButton } from "@/components/ui/CopyButton";
import { RequestTraceRecord, TimelineEvent } from "@/types/portal";
import { formatDateTime } from "@/lib/utils";

function RequestInvestigationContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || searchParams.get("client") || "";

  const { requestTraces, searchRequest, tokens, auditLogs, errorLogs } = usePortal();

  const [searchId, setSearchId] = useState(queryParam || "REQ-20261006-000001");
  const [activeTrace, setActiveTrace] = useState<RequestTraceRecord | null>(null);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
  const [filterEnv, setFilterEnv] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    if (queryParam) {
      setSearchId(queryParam);
      const res = searchRequest(queryParam);
      if (res) {
        setActiveTrace(res);
      } else {
        // Look for match by client ID
        const match = Object.values(requestTraces).find(
          (t) => t.clientId.toLowerCase() === queryParam.toLowerCase()
        );
        if (match) setActiveTrace(match);
      }
    } else {
      setActiveTrace(requestTraces["REQ-20261006-000001"] || null);
    }
  }, [queryParam, requestTraces]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = searchRequest(searchId.trim());
    if (found) {
      setActiveTrace(found);
    } else {
      // Look for match by employeeId, faceId, or tokenId
      const trimmed = searchId.trim().toLowerCase();
      const match = Object.values(requestTraces).find(
        (t) =>
          t.requestId.toLowerCase() === trimmed ||
          t.clientId.toLowerCase() === trimmed ||
          (t.employeeId && t.employeeId.toLowerCase() === trimmed) ||
          (t.faceId && t.faceId.toLowerCase() === trimmed) ||
          t.tokenId.toLowerCase() === trimmed
      );
      setActiveTrace(match || null);
    }
  };

  const selectPreset = (id: string) => {
    setSearchId(id);
    const trace = requestTraces[id];
    if (trace) setActiveTrace(trace);
  };

  // Associated token
  const associatedToken = activeTrace
    ? tokens.find((t) => t.tokenId === activeTrace.tokenId)
    : null;

  // Associated audit records
  const relatedAudits = activeTrace
    ? auditLogs.filter((a) => a.requestId === activeTrace.requestId || a.clientId === activeTrace.clientId)
    : [];

  // Associated errors
  const relatedErrors = activeTrace
    ? errorLogs.filter((e) => e.requestId === activeTrace.requestId)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Forensic Search Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-[#0b1322] dark:via-[#070d18] dark:to-[#0b1322] p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <SearchCode className="h-3.5 w-3.5" />
                GLOBAL FORENSIC TRACER
              </span>
              <span className="text-xs text-slate-400 font-mono">Correlated Across Mobile, R2, Convex & Railway</span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              Request Investigation Center
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
              Reconstruct the end-to-end execution lifecycle of any operational punch, face verification, or API call. Enter a Request ID below to inspect telemetry, timeline events, and diagnostic root cause.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            <div>Zero Raw Biometric Matrix Exposure</div>
            <div className="text-cyan-500 font-bold mt-0.5">SHA-256 Masked Credentials Only</div>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-cyan-500" />
            <input
              type="text"
              placeholder="Enter Request ID (e.g. REQ-20261006-000001), Client ID, Employee ID, or Token ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-3 font-mono text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95 transition-opacity"
          >
            Trace Request
          </button>
        </form>

        {/* Presets */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono text-[11px] text-slate-400">Sample Presets:</span>
          {Object.keys(requestTraces).map((id) => {
            const tr = requestTraces[id];
            return (
              <button
                key={id}
                onClick={() => selectPreset(id)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs border transition-all ${
                  activeTrace?.requestId === id
                    ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-cyan-500"
                }`}
              >
                {id} ({tr.status} {tr.errorCode ? `• ${tr.errorCode}` : ""})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Investigation Panel */}
      {activeTrace ? (
        <div className="space-y-6">
          {/* Section 1: Request Summary Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {activeTrace.requestId}
                  </span>
                  <CopyButton text={activeTrace.requestId} />
                  <StatusBadge status={activeTrace.status} />
                  <StatusBadge status={activeTrace.environment} />
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    HTTP {activeTrace.httpStatus}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Timestamp: <span className="text-slate-800 dark:text-slate-200">{formatDateTime(activeTrace.timestamp)}</span> •
                  Response Duration: <strong className="text-cyan-600 dark:text-cyan-400">{activeTrace.responseTimeMs}ms</strong>
                  {activeTrace.correlationId && (
                    <span> • Trace ID: <span className="text-slate-400">{activeTrace.correlationId}</span></span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                className="flex items-center gap-1.5 self-start rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span>{isTimelineExpanded ? "Collapse Timeline" : "Expand Timeline"}</span>
                {isTimelineExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {/* Error Banner if Failed */}
            {activeTrace.errorCode && (
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold sm:text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Failure Diagnostic: {activeTrace.errorCode}</span>
                </div>
                <p className="mt-1.5 font-mono text-rose-900 dark:text-rose-200 leading-relaxed">
                  {activeTrace.errorMessage}
                </p>
                {activeTrace.failureStage && (
                  <div className="mt-2 text-[11px] font-mono text-rose-700 dark:text-rose-300">
                    Failed Stage: <strong>{activeTrace.failureStage}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Identity Grid: Client, Master Admin, Employee, Face ID, API */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs font-mono">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-400 text-[10px] block">CLIENT / TENANT</span>
                <p className="mt-1 font-bold text-slate-900 dark:text-white truncate">{activeTrace.companyName}</p>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400">{activeTrace.clientId}</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-400 text-[10px] block">MASTER ADMIN</span>
                <p className="mt-1 font-bold text-slate-900 dark:text-white truncate">
                  {activeTrace.masterAdminName || "Tenant Root"}
                </p>
                <span className="text-[11px] text-slate-400">{activeTrace.masterId}</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-400 text-[10px] block">EMPLOYEE</span>
                <p className="mt-1 font-bold text-slate-900 dark:text-white truncate">
                  {activeTrace.employeeName || "N/A (Anonymous/Kiosk)"}
                </p>
                <span className="text-[11px] text-slate-400">{activeTrace.employeeId || "—"}</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-400 text-[10px] block">FACE ID (R2 OPAQUE)</span>
                <p className="mt-1 text-slate-800 dark:text-slate-200 truncate font-bold">
                  {activeTrace.faceId || "None (Pre-Inference)"}
                </p>
                <span className="text-[10px] text-slate-400">Vault: Cloudflare R2</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-400 text-[10px] block">API INVOKED</span>
                <p className="mt-1 font-bold text-slate-900 dark:text-white truncate">{activeTrace.apiName}</p>
                <span className="text-[10px] text-slate-400">{activeTrace.method} {activeTrace.endpoint}</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3">
                <span className="text-slate-400 text-[10px] block">TOKEN QUOTA</span>
                <p className="mt-1 font-bold text-slate-900 dark:text-white">
                  {activeTrace.tokensConsumed} Units Consumed
                </p>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {activeTrace.remainingTokensAfter.toLocaleString()} Remaining
                </span>
              </div>
            </div>

            {/* Idempotency & Feature Flags Active */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-mono text-[11px]">Enabled APIs at Request:</span>
                {activeTrace.enabledApisAtRequest.map((api) => (
                  <span
                    key={api}
                    className="rounded bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                  >
                    ✓ {api}
                  </span>
                ))}
              </div>

              {activeTrace.idempotencyKey && (
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-emerald-500 font-bold">Idempotency-Key:</span>
                  <span>{activeTrace.idempotencyKey}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Credential & Token Accounting Details */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 sm:p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-500" />
              <span>Credential & Token Metering Governance</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Cryptographic separation between User Session JWTs and Metered API Quota Tokens.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Token Quota Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">API Metering Token</span>
                  <StatusBadge status={associatedToken?.status || "ACTIVE"} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Token ID:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{activeTrace.tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Token Masked Secret:</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{associatedToken?.maskedToken || "uat_xxxxxxxxxx1234"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Environment Scope:</span>
                  <span className="font-bold">{activeTrace.environment} Sandbox / Gateway</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Single Call Charge:</span>
                  <span className="text-amber-500 font-bold">{activeTrace.tokensConsumed} Unit(s)</span>
                </div>
              </div>

              {/* JWT vs Quota Token Concept Card */}
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-cyan-800 dark:text-cyan-300 pb-2 border-b border-cyan-500/20">
                  <HelpCircle className="h-4 w-4" />
                  <span>Architecture Notice: Session JWT vs. Quota Tokens</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  <strong>Bearer JWTs</strong> are ephemeral identity proofs generated upon face-login, containing claims (<code className="font-mono text-[10px]">clientId, masterId, employeeId, role</code>) signed by the platform RSA private key.
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                  <strong>Quota Tokens (<code className="font-mono text-[10px]">x-api-key</code>)</strong> meter billable transactions. Once the allocated balance reaches 0, the API Gateway immediately rejects punches with HTTP 429 (<code className="font-mono text-[10px]">TOKEN_EXHAUSTED</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Request Timeline Sequence */}
          {isTimelineExpanded && activeTrace.timeline && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <span>Recorded Execution Timeline ({activeTrace.responseTimeMs}ms Total Duration)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Microsecond trace reconstructing edge routing, token verification, geofencing, and ArcFace biometric inference.
              </p>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {activeTrace.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-[27px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#0b1322] ${
                        event.status === "ok"
                          ? "bg-emerald-500"
                          : event.status === "fail"
                          ? "bg-rose-500"
                          : event.status === "warn"
                          ? "bg-amber-500"
                          : "bg-cyan-500"
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400">
                        {event.time}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {event.stage}
                      </span>
                      {event.durationMs && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                          +{event.durationMs}ms
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-300 leading-relaxed">
                      {event.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Error Diagnostics & Root Cause Analysis */}
          {activeTrace.errorCode && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 sm:p-6 shadow-sm">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>Forensic Diagnostics & Recommended Remediation</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Recommended engineering and operational steps to resolve the failure.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
                    Diagnostic Checklist for {activeTrace.errorCode}:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc pl-5">
                    {activeTrace.recommendedDiagnostics?.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400 text-[10px]">RETRY ELIGIBILITY</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {activeTrace.errorCode === "FACE_API_TIMEOUT" ? "Eligible with Backoff" : "Manual Remediation Required"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <span className="text-slate-400 text-[10px]">AUDIT LOG REFERENCE</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                      Event Logged to audit_logs & error_logs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Correlated Audit & Error Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Correlated Error Entries */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Associated Error Logs</span>
                <span className="font-mono text-rose-500 font-bold">{relatedErrors.length} entries</span>
              </h4>
              {relatedErrors.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-mono">No error logs generated for this successful request.</div>
              ) : (
                <div className="space-y-2">
                  {relatedErrors.map((err) => (
                    <div key={err.errorId} className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs font-mono">
                      <div className="flex justify-between font-bold text-rose-600">
                        <span>{err.errorCode}</span>
                        <span>{err.errorId}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">{err.safeMessage}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Correlated Audit Entries */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Associated Audit Logs</span>
                <span className="font-mono text-cyan-500 font-bold">{relatedAudits.length} entries</span>
              </h4>
              {relatedAudits.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-mono">No audit events found.</div>
              ) : (
                <div className="space-y-2">
                  {relatedAudits.map((aud) => (
                    <div key={aud.auditId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-mono">
                      <div className="flex justify-between text-slate-800 dark:text-slate-200 font-bold">
                        <span>{aud.action}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(aud.timestamp).split(",")[0]}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                        <span>Target: {aud.targetResource}</span>
                        <StatusBadge status={aud.outcome} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Not Found State */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-12 text-center">
          <SearchCode className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Request Record Matched</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            No trace log matched query &quot;<span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{searchId}</span>&quot;. Ensure the Request ID follows the standard W3C convention <code className="font-mono">REQ-YYYYMMDD-XXXXXX</code>.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => selectPreset("REQ-20261006-000001")}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300 hover:border-cyan-500"
            >
              Reset to REQ-20261006-000001
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequestInvestigationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-slate-400">Loading Request Forensic Center...</div>}>
      <RequestInvestigationContent />
    </Suspense>
  );
}
