'use client';

import React, { useState } from 'react';
import { useClientPortal } from '@/lib/clientPortalStore';
import { FileSpreadsheet, Download, Calendar, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ClientAttendanceRecord } from '@/types/clientPortal';

export default function ReportsPage() {
  const { settings, attendanceRecords, departments, exportAttendanceCsv } = useClientPortal();
  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [reportType, setReportType] = useState<'attendance' | 'punctuality' | 'overtime'>('attendance');

  const filteredAttendance: ClientAttendanceRecord[] = attendanceRecords.filter((rec) => {
    const matchDept = selectedDept === 'ALL' || rec.departmentName === selectedDept;
    const matchMonth = rec.attendanceDate.startsWith(selectedMonth);
    return matchDept && matchMonth;
  });

  const totalRecords = filteredAttendance.length;
  const presentCount = filteredAttendance.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const lateCount = filteredAttendance.filter((r) => r.isLate).length;
  const avgWorkHours = totalRecords > 0 
    ? (filteredAttendance.reduce((sum, r) => sum + (r.activeMinutes || 0), 0) / totalRecords / 60).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Compliance Exports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export payroll-ready attendance reports, punctuality summaries, and audit logs for <span className="font-semibold text-slate-800">{settings.companyName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportAttendanceCsv()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Monthly CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Filtered Records</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalRecords}</div>
          <p className="text-xs text-slate-400 mt-1">Punches for selected period</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Present Count</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{presentCount}</div>
          <p className="text-xs text-slate-400 mt-1">Valid verifications recorded</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{lateCount}</div>
          <p className="text-xs text-slate-400 mt-1">Grace period exceeded</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Daily Hours</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{avgWorkHours} hrs</div>
          <p className="text-xs text-slate-400 mt-1">Average shift duration</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.departmentId} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setReportType('attendance')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                reportType === 'attendance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Master Roll
            </button>
            <button
              onClick={() => setReportType('punctuality')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                reportType === 'punctuality' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Punctuality
            </button>
            <button
              onClick={() => setReportType('overtime')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                reportType === 'overtime' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Overtime
            </button>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {reportType === 'attendance' && 'Detailed Attendance Ledger'}
            {reportType === 'punctuality' && 'Punctuality & Grace Period Analysis'}
            {reportType === 'overtime' && 'Overtime & Duration Breakdown'}
          </h2>
          <span className="text-xs text-slate-400">
            Showing {filteredAttendance.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Work Hours</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Confidence / Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No attendance records found for this period and filter.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((rec) => (
                  <tr key={rec.attendanceId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{rec.employeeName}</div>
                      <div className="text-xs text-slate-400">{rec.employeeId} · {rec.departmentName}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{rec.attendanceDate}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-900">
                      {rec.checkInTime || '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-900">
                      {rec.checkOutTime || '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {rec.activeMinutes ? `${Math.floor(rec.activeMinutes / 60)}h ${rec.activeMinutes % 60}m` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {rec.verificationScore ? (
                        <span className="font-mono text-emerald-600 font-semibold">
                          {(rec.verificationScore * 100).toFixed(1)}% (ArcFace)
                        </span>
                      ) : (
                        <span className="text-slate-400">Manual / N/A</span>
                      )}
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
