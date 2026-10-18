"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  Plus,
  Search,
  Building2,
  ShieldAlert,
  Lock,
  Mail,
  CheckCircle,
  XCircle,
  Shield,
  KeyRound,
} from "lucide-react";
import { usePortal } from "@/lib/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { MasterAdmin, MasterAdminStatus } from "@/types/portal";
import { formatDateTime } from "@/lib/utils";

export default function MasterAdminsPage() {
  const { masterAdmins, clients, addMasterAdmin, updateMasterAdminStatus } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Master Admin Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    clientId: clients[0]?.clientId || "",
    role: "PRIMARY_MASTER_ADMIN" as MasterAdmin["role"],
    twoFactorEnabled: true,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.clientId) return;

    const targetClient = clients.find((c) => c.clientId === formData.clientId);
    const num = Math.floor(100 + Math.random() * 900);
    const newMasterId = `MASTER${num}`;

    addMasterAdmin({
      masterId: newMasterId,
      clientId: formData.clientId,
      companyName: targetClient?.companyName || "Unknown Tenant",
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      status: "ACTIVE",
      twoFactorEnabled: formData.twoFactorEnabled,
    });

    setIsCreateModalOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      clientId: clients[0]?.clientId || "",
      role: "PRIMARY_MASTER_ADMIN",
      twoFactorEnabled: true,
    });
  };

  const filteredAdmins = masterAdmins.filter((m) => {
    const matchesClient = selectedClientFilter === "ALL" || m.clientId === selectedClientFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.masterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClient && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              TENANT STAKEHOLDERS
            </span>
            <span className="text-xs text-slate-400 font-mono">Bound to Owning Client</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">Master Admins</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage corporate tenant administrators. Enforces immutable tenant ownership; Master Admins cannot access foreign tenants.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 transition-opacity self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Create Master Admin</span>
        </button>
      </div>

      {/* Security Banner: Zero Cross-Tenant Parameter Tampering */}
      <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-xs text-cyan-800 dark:text-cyan-300 flex items-start gap-2.5">
        <Shield className="h-4 w-4 shrink-0 mt-0.5 text-cyan-600 dark:text-cyan-400" />
        <div>
          <span className="font-bold">Strict Tenant Ownership Guarantee:</span> Master Admins are bound to their owning <code className="bg-cyan-500/20 px-1 py-0.5 rounded font-mono">clientId</code>. All queries in the backend validate session JWT claims; client ID manipulation in request payloads is rejected with HTTP 403 Forbidden.
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, Email, Master ID (e.g. MASTER001), or Company..."
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
          <option value="ALL">All Owning Clients</option>
          {clients.map((c) => (
            <option key={c.clientId} value={c.clientId}>
              {c.companyName} ({c.clientId})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] shadow-sm">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-mono text-slate-400">
              <th className="py-3 px-4">Master Admin</th>
              <th className="py-3 px-4">Owning Client Tenant</th>
              <th className="py-3 px-4">Role & 2FA</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Activity</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredAdmins.map((admin) => (
              <tr key={admin.masterId} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                      MA
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{admin.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                          {admin.masterId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{admin.email}</div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <Link
                    href={`/clients`}
                    className="font-semibold text-slate-800 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1.5"
                  >
                    <span>{admin.companyName}</span>
                    <span className="font-mono text-[10px] text-cyan-600 bg-cyan-500/10 px-1 rounded">
                      {admin.clientId}
                    </span>
                  </Link>
                </td>

                <td className="py-3.5 px-4 font-mono">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {admin.role.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border ${
                        admin.twoFactorEnabled
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      }`}
                    >
                      {admin.twoFactorEnabled ? "2FA Active" : "2FA Off"}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <StatusBadge status={admin.status} size="sm" />
                </td>

                <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : "Never"}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {admin.status === "ACTIVE" ? (
                      <button
                        onClick={() => updateMasterAdminStatus(admin.masterId, "DISABLED")}
                        className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => updateMasterAdminStatus(admin.masterId, "ACTIVE")}
                        className="px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:bg-emerald-100 text-[11px] font-semibold"
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

      {/* Create Master Admin Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Master Admin"
        subtitle="Provision tenant administrator account with strict client binding."
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Owning Client Tenant *</label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.companyName} ({c.clientId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Email *</label>
            <input
              type="email"
              required
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Role / Authority</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as MasterAdmin["role"] })}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="PRIMARY_MASTER_ADMIN">PRIMARY MASTER ADMIN (Full Tenant Root)</option>
              <option value="REGIONAL_ADMIN">REGIONAL ADMIN (Branch Scope)</option>
              <option value="HR_OPERATIONS">HR OPERATIONS (Staff & Attendance Only)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1 font-mono">
            <input
              type="checkbox"
              id="twoFactor"
              checked={formData.twoFactorEnabled}
              onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
              className="rounded border-slate-400"
            />
            <label htmlFor="twoFactor" className="cursor-pointer text-slate-700 dark:text-slate-300">
              Enforce 2-Factor Authentication upon first login
            </label>
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
              Create Master Admin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
