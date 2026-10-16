'use client';

import React, { useState } from 'react';
import { useClientPortal } from '@/lib/clientPortalStore';
import { Save, ShieldAlert, Clock, Eye, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const { settings, activeUser, updateSettings } = useClientPortal();
  const [startTime, setStartTime] = useState(settings?.officeStartTime || '09:00');
  const [endTime, setEndTime] = useState(settings?.officeEndTime || '18:00');
  const [gracePeriod, setGracePeriod] = useState(settings?.lateThresholdMinutes || 15);
  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Kolkata');
  const [autoCheckout, setAutoCheckout] = useState<boolean>(settings?.autoCheckoutAtMidnight ?? true);
  const [retentionDays, setRetentionDays] = useState(settings?.biometricRetentionDays || 90);
  const [isSaved, setIsSaved] = useState(false);

  const isMasterAdmin = activeUser.role === 'PRIMARY_MASTER_ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      officeStartTime: startTime,
      officeEndTime: endTime,
      lateThresholdMinutes: gracePeriod,
      timezone,
      autoCheckoutAtMidnight: autoCheckout,
      biometricRetentionDays: retentionDays,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tenant Settings & Attendance Rules</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure company-wide work policy, biometric liveness thresholds, and compliance retention for <span className="font-semibold text-slate-800">{settings.companyName}</span>.
          </p>
        </div>
      </div>

      {!isMasterAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-sm text-amber-800">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            You are viewing settings in read-only mode. Only administrators with <strong>PRIMARY_MASTER_ADMIN</strong> role can commit policy changes.
          </span>
        </div>
      )}

      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-sm text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings saved successfully. Changes are now active across all edge attendance terminals.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Work Policy */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Working Hours & Punctuality Policy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Office Start Time
              </label>
              <input
                type="time"
                disabled={!isMasterAdmin}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Shift kickoff</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Office End Time
              </label>
              <input
                type="time"
                disabled={!isMasterAdmin}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Shift completion</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Late Grace Period (Mins)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                disabled={!isMasterAdmin}
                value={gracePeriod}
                onChange={(e) => setGracePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Buffer before flag</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Company Time Zone
              </label>
              <select
                disabled={!isMasterAdmin}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC (GMT +0:00)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1">Audit time sync</p>
            </div>
          </div>
        </div>

        {/* Biometrics & Liveness */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Eye className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900">Biometric Verification Engine (Railway API)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">ArcFace Match Threshold</span>
                  <p className="text-xs text-slate-400">Cosine similarity required for verification</p>
                </div>
                <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                  0.68 (Recommended)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">Anti-Spoofing & Liveness</span>
                  <p className="text-xs text-slate-400">Replay, print-attack, and screen detection</p>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Active (Edge & Server)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">Automatic Nightly Check-out</span>
                  <p className="text-xs text-slate-400">Auto-close open shifts at 23:59:59</p>
                </div>
                <input
                  type="checkbox"
                  disabled={!isMasterAdmin}
                  checked={autoCheckout}
                  onChange={(e) => setAutoCheckout(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-slate-800">Audit Log Retention Horizon</span>
                  <p className="text-xs text-slate-400">Immutable days before purge</p>
                </div>
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {retentionDays} Days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isMasterAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Company Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
