"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ScanFace,
  CheckCircle2,
  Clock,
  Shield,
  Building2,
  Filter,
} from "lucide-react";
import { usePortal } from "@/lib/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export default function EmployeesPage() {
  const { employees, clients } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("ALL");
  const [biometricFilter, setBiometricFilter] = useState("ALL");

  const filteredEmployees = employees.filter((emp) => {
    const matchesClient = selectedClientFilter === "ALL" || emp.clientId === selectedClientFilter;
    const matchesBiometric =
      biometricFilter === "ALL"
        ? true
        : biometricFilter === "ENROLLED"
        ? !!emp.faceId
        : !emp.faceId;
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.faceId && emp.faceId.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesClient && matchesBiometric && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
              GLOBAL WORKFORCE DIRECTORY
            </span>
            <span className="text-xs text-slate-400 font-mono">Biometric References Only</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Employees Directory</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cross-tenant personnel registry with opaque facial embedding identifiers (Cloudflare R2) and quality fidelity scores.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <ScanFace className="h-4 w-4 text-cyan-500" />
          <span>
            Enrolled:{" "}
            <strong className="text-slate-900 dark:text-white">
              {employees.filter((e) => e.faceId).length} / {employees.length}
            </strong>
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Employee Name, ID (EMP0098), Face ID, or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] pl-9 pr-4 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedClientFilter}
          onChange={(e) => setSelectedClientFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Clients ({clients.length})</option>
          {clients.map((c) => (
            <option key={c.clientId} value={c.clientId}>
              {c.companyName} ({c.clientId})
            </option>
          ))}
        </select>

        <select
          value={biometricFilter}
          onChange={(e) => setBiometricFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">All Biometric States</option>
          <option value="ENROLLED">Enrolled (Has Face ID)</option>
          <option value="PENDING">Pending Face Capture</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] shadow-sm">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-mono text-slate-400">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Client Tenant</th>
              <th className="py-3 px-4">Department & Role</th>
              <th className="py-3 px-4">Biometric Reference (R2)</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Punch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredEmployees.map((emp) => (
              <tr key={`${emp.clientId}-${emp.employeeId}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                      {emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{emp.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                          {emp.employeeId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{emp.email}</div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{emp.companyName}</div>
                  <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400">{emp.clientId}</span>
                </td>

                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{emp.designation}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{emp.department}</div>
                </td>

                <td className="py-3.5 px-4 font-mono">
                  {emp.faceId ? (
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 text-cyan-700 dark:text-cyan-300 text-[10px]">
                        {emp.faceId}
                      </span>
                      {emp.faceQualityScore && (
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Score: {(emp.faceQualityScore * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-600 text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Not Enrolled
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <StatusBadge status={emp.status} size="sm" />
                </td>

                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {emp.lastPunchAt ? formatDateTime(emp.lastPunchAt) : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
