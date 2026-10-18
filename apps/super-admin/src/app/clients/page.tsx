"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Users,
  KeyRound,
  MoreVertical,
  Check,
} from "lucide-react";
import { usePortal } from "@/lib/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { ClientTenant, Environment, SubscriptionPlanTier, TenantStatus } from "@/types/portal";
import { formatDateTime } from "@/lib/utils";

export default function ClientsPage() {
  const { clients, addClient, updateClientStatus, selectedEnv } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<ClientTenant | null>(null);

  // New Client Form State
  const [formData, setFormData] = useState({
    companyName: "",
    contactEmail: "",
    contactPhone: "",
    subscriptionPlan: "PROFESSIONAL" as SubscriptionPlanTier,
    timeZone: "America/New_York",
    status: "ACTIVE" as TenantStatus,
    allowedEnvironments: ["UAT", "PROD"] as Environment[],
    officeLocationsCount: 1,
    enabledFeatures: {
      faceRegistration: true,
      faceVerification: true,
      attendance: true,
      gpsValidation: true,
      reports: true,
      notifications: true,
      payrollExport: false,
      strictLiveness: true,
    },
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.contactEmail.trim()) return;

    // Generate clean clientId, e.g. "CLI_392"
    const prefix = formData.companyName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "CLI");
    const num = Math.floor(100 + Math.random() * 900);
    const newClientId = `${prefix}${num}`;

    addClient({
      clientId: newClientId,
      companyName: formData.companyName.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim() || undefined,
      status: formData.status,
      subscriptionPlan: formData.subscriptionPlan,
      timeZone: formData.timeZone,
      allowedEnvironments: formData.allowedEnvironments,
      enabledFeatures: formData.enabledFeatures,
      officeLocationsCount: Number(formData.officeLocationsCount) || 1,
    });

    setIsCreateModalOpen(false);
    // Reset form
    setFormData({
      companyName: "",
      contactEmail: "",
      contactPhone: "",
      subscriptionPlan: "PROFESSIONAL",
      timeZone: "America/New_York",
      status: "ACTIVE",
      allowedEnvironments: ["UAT", "PROD"],
      officeLocationsCount: 1,
      enabledFeatures: {
        faceRegistration: true,
        faceVerification: true,
        attendance: true,
        gpsValidation: true,
        reports: true,
        notifications: true,
        payrollExport: false,
        strictLiveness: true,
      },
    });
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesEnv = selectedEnv === "ALL" || c.allowedEnvironments.includes(selectedEnv);
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEnv && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
              TENANT CONTROL PLANE
            </span>
            <span className="text-xs text-slate-400 font-mono">100% Logical Data Isolation</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Clients & Tenants</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage enterprise tenant lifecycle, permitted environments, subscription plans, and authorized office geofences.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Provision New Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Company Name, Client ID (e.g. ABC001), or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] pl-9 pr-4 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL">TRIAL</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] shadow-sm">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-mono text-slate-400">
              <th className="py-3 px-4">Client Tenant</th>
              <th className="py-3 px-4">Status & Plan</th>
              <th className="py-3 px-4">Environments</th>
              <th className="py-3 px-4">Staff & Admins</th>
              <th className="py-3 px-4">Time Zone</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredClients.map((client) => (
              <tr key={client.clientId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 font-mono shrink-0">
                      {client.clientId.substring(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{client.companyName}</span>
                        <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                          {client.clientId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{client.contactEmail}</div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-1 items-start">
                    <StatusBadge status={client.status} size="sm" />
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{client.subscriptionPlan}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-mono">
                  <div className="flex flex-wrap gap-1">
                    {client.allowedEnvironments.map((env) => (
                      <span
                        key={env}
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                          env === "PROD"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : env === "UAT"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            : "bg-sky-500/10 text-sky-600 border-sky-500/30"
                        }`}
                      >
                        {env}
                      </span>
                    ))}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="text-slate-800 dark:text-slate-200 font-medium">
                    {client.totalEmployees.toLocaleString()} Employees
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {client.totalMasterAdmins} Admins • {client.officeLocationsCount} Branches
                  </div>
                </td>

                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {client.timeZone}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedClientDetail(client)}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 text-[11px] font-semibold"
                    >
                      Config
                    </button>
                    {client.status === "ACTIVE" ? (
                      <button
                        onClick={() => updateClientStatus(client.clientId, "SUSPENDED")}
                        className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold"
                        title="Suspend Tenant"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateClientStatus(client.clientId, "ACTIVE")}
                        className="px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:bg-emerald-100 text-[11px] font-semibold"
                        title="Activate Tenant"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Client Detail Drawer / Modal */}
      {selectedClientDetail && (
        <Modal
          isOpen={!!selectedClientDetail}
          onClose={() => setSelectedClientDetail(null)}
          title={`${selectedClientDetail.companyName} (${selectedClientDetail.clientId})`}
          subtitle="Tenant Configuration, Feature Flags & Permitted Environments"
          maxWidth="xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
              <div>
                <span className="text-slate-400 text-[10px]">STATUS</span>
                <div className="mt-0.5"><StatusBadge status={selectedClientDetail.status} size="sm" /></div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">PLAN</span>
                <div className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">{selectedClientDetail.subscriptionPlan}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">EMPLOYEES</span>
                <div className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">{selectedClientDetail.totalEmployees}</div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">CREATED</span>
                <div className="mt-0.5 text-slate-400 text-[11px]">{formatDateTime(selectedClientDetail.createdAt).split(",")[0]}</div>
              </div>
            </div>

            {/* Feature Flags Breakdown */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                <span>Active Feature Entitlements:</span>
                <Link href="/feature-flags" className="text-cyan-500 font-mono text-[11px] hover:underline">
                  Open Feature Flag Matrix →
                </Link>
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedClientDetail.enabledFeatures).map(([flag, enabled]) => (
                  <div
                    key={flag}
                    className={`p-2.5 rounded-xl border flex items-center justify-between font-mono ${
                      enabled
                        ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400"
                    }`}
                  >
                    <span>{flag}</span>
                    <span className="font-bold">{enabled ? "ENABLED" : "DISABLED"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Link
                href={`/employees?client=${selectedClientDetail.clientId}`}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200"
              >
                View Employees
              </Link>
              <Link
                href={`/uat-tokens?client=${selectedClientDetail.clientId}`}
                className="px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
              >
                Inspect Tokens
              </Link>
              <Link
                href={`/request-investigation?client=${selectedClientDetail.clientId}`}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-semibold shadow"
              >
                Trace Client Requests
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {/* Provision Client Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Enterprise Tenant"
        subtitle="Registers client company and enforces isolated multi-tenant partition."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Legal Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Biometrics Global"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                placeholder="billing@acme.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Subscription Plan</label>
              <select
                value={formData.subscriptionPlan}
                onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value as SubscriptionPlanTier })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="STARTER">STARTER</option>
                <option value="PROFESSIONAL">PROFESSIONAL</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Time Zone</label>
              <select
                value={formData.timeZone}
                onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Permitted Environments</label>
            <div className="flex gap-4 font-mono">
              {(["DEV", "UAT", "PROD"] as Environment[]).map((env) => {
                const checked = formData.allowedEnvironments.includes(env);
                return (
                  <label key={env} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, allowedEnvironments: [...formData.allowedEnvironments, env] });
                        } else {
                          setFormData({ ...formData, allowedEnvironments: formData.allowedEnvironments.filter((x) => x !== env) });
                        }
                      }}
                      className="rounded border-slate-400"
                    />
                    <span>{env}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md hover:opacity-95"
            >
              Provision Client
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
