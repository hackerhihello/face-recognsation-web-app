"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import {
  Settings,
  Shield,
  Lock,
  KeyRound,
  Bell,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  Save,
  Globe,
  Radio,
} from "lucide-react";

export default function SecuritySettingsPage() {
  const { showToast } = usePortal();

  // Settings State
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [adminIpAllowlist, setAdminIpAllowlist] = useState("103.21.244.0/22\n142.250.190.0/24");
  const [biometricRetentionDays, setBiometricRetentionDays] = useState("90");
  const [gdprPurgeActive, setGdprPurgeActive] = useState(true);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("https://hooks.slack.com/services/T00/B00/XXXXXX");
  const [pagerdutyKey, setPagerdutyKey] = useState("pd_live_sec_alert_key_9918");

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Super Admin security policies and alert configurations successfully updated.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Security Governance & Platform Settings
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Super Admin Policy
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global authentication hardening, biometric compliance policies, and incident notification webhooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Shield className="h-3.5 w-3.5" />
            ISO 27001 & SOC 2 Compliant
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Authentication & Access Control */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="h-4 w-4 text-cyan-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Super Admin Control Plane Authentication
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Mandatory Hardware 2FA / WebAuthn
                </span>
                <span className="text-[11px] text-slate-400">
                  Enforces FIDO2 / YubiKey or TOTP authenticator for all Super Admin sign-ins.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMfaEnforced(!mfaEnforced)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  mfaEnforced ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    mfaEnforced ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Super Admin Session Inactivity Timeout
              </label>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="15">15 Minutes (High Security)</option>
                <option value="30">30 Minutes (Standard)</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Super Admin IP Allowlist (CIDR format, one per line)
            </label>
            <textarea
              rows={3}
              value={adminIpAllowlist}
              onChange={(e) => setAdminIpAllowlist(e.target.value)}
              className="w-full font-mono text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Only traffic originating from these IPs can access the Super Admin control plane.
            </p>
          </div>
        </div>

        {/* Section 2: Biometric Compliance & R2 Lifecycle */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Biometric Data Compliance & Cloudflare R2 Retention
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Terminated Employee Vector Purge Horizon
              </label>
              <select
                value={biometricRetentionDays}
                onChange={(e) => setBiometricRetentionDays(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="30">30 Days (Strict BIPA)</option>
                <option value="90">90 Days (GDPR Recommended)</option>
                <option value="180">180 Days</option>
                <option value="365">365 Days (1 Year)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Permanently deletes the Cloudflare R2 embedding vector when employee status is marked TERMINATED.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                  Automated GDPR "Right to be Forgotten" Purge
                </span>
                <span className="text-[11px] text-slate-400">
                  Applies cryptographic shredding to vector weights upon employee termination.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGdprPurgeActive(!gdprPurgeActive)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  gdprPurgeActive ? "bg-cyan-500" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    gdprPurgeActive ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Incident Alerting Webhooks */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Bell className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Incident Response & Operational Webhooks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Slack Operations Channel Webhook URL
              </label>
              <input
                type="text"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Dispatches alerts for critical API timeouts (HTTP 504) and high quota exhaustion.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PagerDuty SRE Routing Key
              </label>
              <input
                type="password"
                value={pagerdutyKey}
                onChange={(e) => setPagerdutyKey(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Triggers on-call engineer paging if Railway ONNX face inference error rate exceeds 3%.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            <Save className="h-4 w-4" />
            Save Security Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
