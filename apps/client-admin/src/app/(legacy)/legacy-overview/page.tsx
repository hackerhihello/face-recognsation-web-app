"use client";

import React, { useState } from "react";
import { useClientPortal } from "@/lib/clientPortalStore";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  CalendarCheck,
  TrendingUp,
  MapPin,
  Camera,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Radio,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function ClientDashboardOverview() {
  const {
    settings,
    activeClientId,
    employees,
    attendanceRecords,
    locations,
    featureFlags,
  } = useClientPortal();

  // Real calculations scoped to active tenant
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "ACTIVE").length;
  const pendingFaceReg = employees.filter((e) => e.status === "PENDING_FACE_REGISTRATION").length;

  const presentToday = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const lateArrivals = attendanceRecords.filter((a) => a.isLate).length;
  const currentlyCheckedIn = attendanceRecords.filter((a) => !a.checkOutTime).length;
  const missingCheckOuts = attendanceRecords.filter((a) => !a.checkOutTime && a.isLate).length;
  const absentToday = Math.max(0, activeEmployees - presentToday);
  const attendanceRate = activeEmployees > 0 ? Math.round((presentToday / activeEmployees) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-indigo-950/40 border border-cyan-500/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {settings.companyName} Workforce Hub
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">
              {activeClientId}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric attendance telemetry, office geofence monitoring, and employee punch activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/face-registration"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            <Camera className="h-4 w-4" />
            Enroll Biometrics
          </Link>
          <Link
            href="/live-attendance"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <Radio className="h-4 w-4" />
            Live Presence
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled Staff</span>
            <Users className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalEmployees}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs">
            <span className="text-emerald-500 font-semibold">{activeEmployees} active</span>
            <span className="text-amber-500">{pendingFaceReg} pending face</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Present Today</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {presentToday}
          </div>
          <span className="text-xs text-slate-400">
            {attendanceRate}% attendance rate ({absentToday} absent)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Currently On Premises</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {currentlyCheckedIn}
          </div>
          <span className="text-xs text-slate-400">Active checked-in sessions</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Late Arrivals</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {lateArrivals}
          </div>
          <span className="text-xs text-amber-500">
            {missingCheckOuts > 0 ? `${missingCheckOuts} missing check-outs` : "Grace window applied"}
          </span>
        </div>
      </div>

      {/* Main Grid: Live Feed & Attendance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Activity Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Today's Biometric Attendance Activity
              </h2>
              <p className="text-xs text-slate-400">
                Punches validated by ArcFace 512-d neural match & GPS geofencing.
              </p>
            </div>
            <Link
              href="/attendance"
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              View Full History <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] font-semibold uppercase">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Check-In</th>
                  <th className="py-2.5 px-3">Check-Out</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Geofence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No punches logged yet today.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record.attendanceId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {record.employeeName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {record.employeeId}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {record.departmentName}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-900 dark:text-white">
                        {record.checkInTime}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {record.checkOutTime || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge
                          variant={record.status === "PRESENT" ? "success" : "warning"}
                          label={record.status}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {record.locationName || "Verified"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tenant Configuration & Office Branches */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Active Office Geofences
              </h2>
              <p className="text-xs text-slate-400">
                Attendance punches must originate within these GPS perimeters.
              </p>
            </div>

            <div className="space-y-2.5">
              {locations.map((loc) => (
                <div
                  key={loc.locationId}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                      {loc.name}
                    </span>
                    <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-500/20">
                      {loc.allowedRadiusMeters}m radius
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {loc.address}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Working Shift Hours:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {settings.officeStartTime} - {settings.officeEndTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Late Tolerance Grace:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {settings.lateThresholdMinutes} mins
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Timezone:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {settings.timezone}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/locations"
            className="w-full py-2 px-3 text-center text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            Manage Office Perimeters
          </Link>
        </div>
      </div>
    </div>
  );
}
