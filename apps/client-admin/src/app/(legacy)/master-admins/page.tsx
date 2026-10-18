"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Building2,
  Mail,
  Shield,
  KeyRound,
} from "lucide-react";
import { useClientPortal } from "@/lib/clientPortalStore";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { ClientAdminRole, ClientUser } from "@/types/clientPortal";

export default function MasterAdminsPage() {
  const { allUsers, availableClients, addUser, updateUserStatus, showToast } = useClientPortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientFilter, setSelectedClientFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Master Admin Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    clientId: availableClients[0]?.clientId || "KARITECH_TEST",
    role: "PRIMARY_MASTER_ADMIN" as ClientAdminRole,
    twoFactorEnabled: true,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.clientId) {
      showToast("Please fill in all required fields.");
      return;
    }

    addUser(formData.name.trim(), formData.email.trim(), formData.role);
    showToast(`Master Admin ${formData.name.trim()} successfully provisioned.`);

    setIsCreateModalOpen(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      clientId: availableClients[0]?.clientId || "KARITECH_TEST",
      role: "PRIMARY_MASTER_ADMIN",
      twoFactorEnabled: true,
    });
  };

  // Filter to master admins and administrators
  const masterAdmins: ClientUser[] = allUsers.filter(
    (u: ClientUser) => u.role === "PRIMARY_MASTER_ADMIN" || u.role === "HR_ADMIN"
  );

  const filteredAdmins: ClientUser[] = masterAdmins.filter((m: ClientUser) => {
    const matchesClient = selectedClientFilter === "ALL" || m.clientId === selectedClientFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.clientId.toLowerCase().includes(searchQuery.toLowerCase());
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Provision Master Admin
        </button>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Tenant-Scoped Ownership Rules</h3>
            <p className="text-xs text-blue-700 dark:text-blue-400/90 mt-1">
              • <strong className="font-semibold">PRIMARY_MASTER_ADMIN:</strong> Root administrative authority over tenant settings, Face API enrollment quotas, and biometric retention policies.
              <br />
              • <strong className="font-semibold">HR_ADMIN:</strong> Manages workforce directories, attendance corrections, and biometric audits.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, master ID, or tenant..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={selectedClientFilter}
          onChange={(e) => setSelectedClientFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] text-slate-700 dark:text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Client Organizations</option>
          {availableClients.map((c) => (
            <option key={c.clientId} value={c.clientId}>
              {c.companyName} ({c.clientId})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1322] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold">Master ID</th>
                <th className="py-3 px-4 font-semibold">Owning Client</th>
                <th className="py-3 px-4 font-semibold">Name & Email</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">2FA Security</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Created At</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No master administrators found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin: ClientUser) => {
                  const clientInfo = availableClients.find((c) => c.clientId === admin.clientId);
                  const isMaster = admin.role === "PRIMARY_MASTER_ADMIN";

                  return (
                    <tr
                      key={admin.userId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {admin.userId}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-200">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{clientInfo?.companyName || admin.clientId}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{admin.clientId}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{admin.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isMaster
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {admin.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <KeyRound className="h-3 w-3" />
                          Enforced
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={admin.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {admin.createdAt?.split("T")[0] || "2026-10-18"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            updateUserStatus(
                              admin.userId,
                              admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                            );
                            showToast(`Updated status for ${admin.name}`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                            admin.status === "ACTIVE"
                              ? "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
                              : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
                          }`}
                        >
                          {admin.status === "ACTIVE" ? "Disable" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision Master Administrator"
      >
        <p className="text-xs text-slate-500 mb-4">
          Create a primary administrative stakeholder bound to an enterprise tenant client.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Client Tenant Organization *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              required
            >
              {availableClients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.companyName} ({c.clientId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Administrator Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Rahul Kalaburagi"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Official Corporate Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@organization.com"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role Authority *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as ClientAdminRole })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="PRIMARY_MASTER_ADMIN">PRIMARY_MASTER_ADMIN (Root Authority)</option>
              <option value="HR_ADMIN">HR_ADMIN (Operations & Attendance)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="twoFactor"
              checked={formData.twoFactorEnabled}
              onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="twoFactor" className="text-xs text-slate-600 dark:text-slate-400">
              Enforce Hardware / TOTP Two-Factor Authentication (Recommended)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-sm"
            >
              Provision Administrator
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
