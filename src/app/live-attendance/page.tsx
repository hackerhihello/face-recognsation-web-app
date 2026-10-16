"use client";

import React, { useState } from "react";
import { useClientPortal } from "@/lib/clientPortalStore";
import {
  Radio,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Search,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function LiveAttendancePage() {
  const { employees, attendanceRecords, locations, settings, showToast } = useClientPortal();

  const [filterDept, setFilterDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activePunches = attendanceRecords.filter((a) => !a.checkOutTime);

  const filteredPunches = activePunches.filter((p) => {
    if (filterDept !== "ALL" && p.departmentName !== filterDept) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.employeeName.toLowerCase().includes(q) && !p.employeeId.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleRefreshPulse = () => {
    setIsRefreshing(true);
    showToast("Syncing real-time WebSocket attendance stream...");
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Live presence ledger up to date.");
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Live Presence & Floor Telemetry
            </h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              Live Stream Active
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time on-premises staff roster. Live sessions update as biometric facial punches register at office kiosks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshPulse}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Currently On Premises</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {activePunches.length}
          </div>
          <span className="text-xs text-slate-400">Across {locations.length} geofenced offices</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled Workforce</span>
            <Building2 className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {employees.length}
          </div>
          <span className="text-xs text-slate-400">
            {employees.length > 0 ? Math.round((activePunches.length / employees.length) * 100) : 0}% building occupancy
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Office Working Hours</span>
            <Clock className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">
            {settings.officeStartTime} – {settings.officeEndTime}
          </div>
          <span className="text-xs text-slate-400">Timezone: {settings.timezone}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active staff by name or employee ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering & Cloud">Engineering & Cloud</option>
              <option value="Growth & Marketing">Growth & Marketing</option>
              <option value="AI Vision & Robotics">AI Vision & Robotics</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Presence Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPunches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
            No employees currently checked in matching search criteria.
          </div>
        ) : (
          filteredPunches.map((punch) => (
            <div
              key={punch.attendanceId}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3 hover:border-cyan-500/30 transition shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {punch.employeeName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {punch.employeeName}
                    </h3>
                    <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                      {punch.employeeId} • {punch.departmentName}
                    </span>
                  </div>
                </div>

                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Clock-In Time:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {punch.checkInTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Geofence Site:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {punch.locationName || "Office HQ"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Match Confidence:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {punch.verificationScore ? `${Math.round(punch.verificationScore * 100)}%` : "Verified"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
