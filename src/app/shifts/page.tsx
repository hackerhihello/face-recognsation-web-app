"use client";

import React, { useState } from "react";
import { useClientPortal } from "@/lib/clientPortalStore";
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Users,
  Settings,
  Edit2,
  Calendar,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";

export default function ShiftsPage() {
  const { shifts, addShift, showToast } = useClientPortal();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [gracePeriod, setGracePeriod] = useState(15);
  const [halfDayThreshold, setHalfDayThreshold] = useState(240);

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast("Shift name is required.");
      return;
    }

    addShift({
      name,
      startTime,
      endTime,
      gracePeriodMinutes: Number(gracePeriod),
      halfDayThresholdMinutes: Number(halfDayThreshold),
    });

    setIsAddOpen(false);
    setName("");
    setStartTime("09:00");
    setEndTime("18:00");
    setGracePeriod(15);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Shifts & Work Schedules
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Policy Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure working hours, late arrival grace windows, half-day hour cutoffs, and assigned team members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Work Shift
          </button>
        </div>
      </div>

      {/* Shift Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div
            key={shift.shiftId}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {shift.name}
                </h3>
                <StatusBadge
                  variant={shift.status === "ACTIVE" ? "success" : "secondary"}
                  label={shift.status}
                />
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-500" /> Standard Timings:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {shift.startTime} – {shift.endTime}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400">Late Grace Window:</span>
                  <span className="font-semibold text-amber-500">
                    +{shift.gracePeriodMinutes} mins tolerance
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400">Half-Day Threshold:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {Math.floor(shift.halfDayThresholdMinutes / 60)} hours minimum
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-500" /> Assigned Workforce:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {shift.assignedEmployeesCount} staff
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono text-[11px]">{shift.shiftId}</span>
              <button
                onClick={() => showToast(`Shift ${shift.name} settings edited.`)}
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold text-[11px]"
              >
                Edit Policy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Shift Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Work Shift Schedule"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shift Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Night R&D Shift"
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time (HH:mm)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time (HH:mm)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Grace Tolerance (Minutes)
              </label>
              <input
                type="number"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                min={0}
                max={60}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Half-Day Minimum (Minutes)
              </label>
              <input
                type="number"
                value={halfDayThreshold}
                onChange={(e) => setHalfDayThreshold(Number(e.target.value))}
                min={60}
                max={480}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
            >
              Save Shift
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
