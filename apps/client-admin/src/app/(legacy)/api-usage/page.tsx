'use client';

import React from 'react';
import { useClientPortal } from '@/lib/clientPortalStore';
import { Activity, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';

export default function ApiUsagePage() {
  const { settings, apiUsage } = useClientPortal();

  const totalRequests = apiUsage.length;
  const successful = apiUsage.filter((u) => u.status === 'SUCCESS').length;
  const failed = apiUsage.filter((u) => u.status === 'FAILED').length;
  const avgLatency = totalRequests > 0
    ? (apiUsage.reduce((acc, u) => acc + u.responseTimeMs, 0) / totalRequests).toFixed(0)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Telemetry & Request History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time biometric audit stream and Railway Face API request logs for tenant <span className="font-semibold text-slate-800">{settings.clientId}</span>.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Invocations</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalRequests}</div>
          <p className="text-xs text-slate-400 mt-1">Today's API transactions</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Success Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalRequests > 0 ? ((successful / totalRequests) * 100).toFixed(1) : 100}%
          </div>
          <p className="text-xs text-slate-400 mt-1">{successful} successful calls</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Latency</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{avgLatency} ms</div>
          <p className="text-xs text-slate-400 mt-1">Edge inference speed</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Failed Checks</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{failed}</div>
          <p className="text-xs text-slate-400 mt-1">Non-200 HTTP responses</p>
        </div>
      </div>

      {/* Request Stream Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Live Request Ledger</h2>
          <span className="text-xs text-slate-400">Strictly tenant-isolated (Railway API)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Endpoint</th>
                <th className="px-6 py-3">Environment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Latency</th>
                <th className="px-6 py-3">Request ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiUsage.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No API telemetry records found for this client.
                  </td>
                </tr>
              ) : (
                apiUsage.map((req) => (
                  <tr key={req.requestId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">
                      {req.endpoint}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-blue-50 text-blue-700">
                        {req.environment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono ${
                          req.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {req.responseTimeMs} ms
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span>{req.requestId}</span>
                        <CopyButton text={req.requestId} />
                      </div>
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
