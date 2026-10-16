"use client";

import React, { useState } from "react";
import { useClientPortal } from "@/lib/clientPortalStore";
import { ClientAttendanceRecord } from "@/types/clientPortal";
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  MapPin,
  ShieldCheck,
  Edit2,
  Download,
  AlertTriangle,
  History,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

export default function AttendanceRecordsPage() {
  const {
    attendanceRecords,
    departments,
    activeUser,
    correctAttendanceRecord,
    exportAttendanceCsv,
    showToast,
  } = useClientPortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Correction Modal State
  const [correctingRecord, setCorrectingRecord] = useState<ClientAttendanceRecord | null>(null);
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");

  const filteredRecords = attendanceRecords.filter((rec) => {
    if (filterDept !== "ALL" && rec.departmentName !== filterDept) return false;
    if (filterStatus !== "ALL" && rec.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.employeeName.toLowerCase().includes(q);
      const matchId = rec.employeeId.toLowerCase().includes(q);
      const matchReq = rec.requestId.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchReq) return false;
    }
    return true;
  });

  const canCorrect = activeUser.role === "PRIMARY_MASTER_ADMIN" || activeUser.role === "HR_ADMIN";

  const handleOpenCorrection = (rec: ClientAttendanceRecord) => {
    if (!canCorrect) {
      showToast("Access Denied: Managers cannot alter compliance punch records.");
      return;
    }
    setCorrectingRecord(rec);
    setNewCheckIn(rec.checkInTime);
    setNewCheckOut(rec.checkOutTime || "18:00:00");
    setCorrectionReason("");
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      showToast("A clear compliance reason is required to correct punch records.");
      return;
    }
    if (correctingRecord) {
      correctAttendanceRecord(
        correctingRecord.attendanceId,
        newCheckIn,
        newCheckOut,
        correctionReason.trim()
      );
      setCorrectingRecord(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Attendance Records & Timecards
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Audit Controlled
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete daily punch records, active work durations, geofence radius checks, and manual audit corrections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAttendanceCsv()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by employee name, employee ID, or Request ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">PRESENT</option>
              <option value="LATE">LATE</option>
              <option value="HALF_DAY">HALF_DAY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Active Duration</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Geofence Location</th>
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No attendance records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.attendanceId}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {record.employeeName}
                        </span>
                        <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400">
                          {record.employeeId} • {record.departmentName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {record.attendanceDate}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {record.checkInTime}
                      {record.isLate && (
                        <span className="ml-1 text-[10px] text-amber-500 font-bold">(Late)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {record.checkOutTime || "Open Session"}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {record.activeMinutes
                        ? `${Math.floor(record.activeMinutes / 60)}h ${record.activeMinutes % 60}m`
                        : "In Progress"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        variant={record.status === "PRESENT" ? "success" : "warning"}
                        label={record.status}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {record.locationName || "Verified"} ({record.distanceMeters || 15}m)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {record.requestId}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canCorrect && (
                        <button
                          onClick={() => handleOpenCorrection(record)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                          title="Manual Attendance Correction"
                        >
                          <Edit2 className="h-3 w-3 text-cyan-500" />
                          Correct
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Correction Modal */}
      {correctingRecord && (
        <Modal
          isOpen={true}
          onClose={() => setCorrectingRecord(null)}
          title={`Manual Attendance Correction — ${correctingRecord.employeeName}`}
        >
          <form onSubmit={handleSaveCorrection} className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                All punch corrections are permanently saved to the immutable client Audit Log, referencing administrator <strong>{activeUser.email}</strong>.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Date:</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  {correctingRecord.attendanceDate}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Original Check-In:</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  {correctingRecord.checkInTime}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjusted Check-In (HH:mm:ss)
                </label>
                <input
                  type="text"
                  value={newCheckIn}
                  onChange={(e) => setNewCheckIn(e.target.value)}
                  required
                  placeholder="09:00:00"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adjusted Check-Out (HH:mm:ss)
                </label>
                <input
                  type="text"
                  value={newCheckOut}
                  onChange={(e) => setNewCheckOut(e.target.value)}
                  placeholder="18:00:00"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mandatory Reason for Correction
              </label>
              <textarea
                rows={3}
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                required
                placeholder="e.g. Employee biometric terminal was offline due to network switch outage at main entrance."
                className="w-full text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCorrectingRecord(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
              >
                Save Correction & Audit Trail
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
