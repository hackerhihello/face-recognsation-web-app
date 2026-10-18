"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { ApiTokenRecord } from "@/types/portal";
import {
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Coins,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { CopyButton } from "@/components/ui/CopyButton";
import Link from "next/link";

export default function UatTokensPage() {
  const { clients, masterAdmins, tokens, provisionToken, rotateToken, revokeToken, showToast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Provisioning Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.clientId || "");
  const [selectedMasterId, setSelectedMasterId] = useState(masterAdmins[0]?.masterId || "");
  const [allocatedQuota, setAllocatedQuota] = useState(10000);
  const [expiryDays, setExpiryDays] = useState(30);

  // Secret Reveal Modal (revealed strictly once)
  const [revealedSecretData, setRevealedSecretData] = useState<{
    tokenId: string;
    rawSecret: string;
    maskedToken: string;
    clientName: string;
  } | null>(null);

  // Filter UAT tokens (we also allow viewing all tokens or filtering specifically by UAT)
  const uatTokens = tokens.filter((t) => t.tokenType === "UAT_SANDBOX" || t.environment === "UAT");

  const filteredTokens = uatTokens.filter((token) => {
    if (filterClient !== "ALL" && token.clientId !== filterClient) return false;
    if (filterStatus !== "ALL" && token.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = token.tokenId.toLowerCase().includes(q);
      const matchClient = token.companyName.toLowerCase().includes(q);
      const matchMasked = token.maskedToken.toLowerCase().includes(q);
      if (!matchId && !matchClient && !matchMasked) return false;
    }
    return true;
  });

  const totalAllocated = uatTokens.reduce((acc, t) => acc + t.allocatedQuota, 0);
  const totalConsumed = uatTokens.reduce((acc, t) => acc + t.consumedQuota, 0);
  const totalRemaining = totalAllocated - totalConsumed;

  const handleIssueToken = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.clientId === selectedClientId);
    if (!client) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const tokenId = `tok_uat_${Math.random().toString(36).substring(2, 9)}`;

    const { rawSecret } = provisionToken({
      tokenId,
      clientId: client.clientId,
      companyName: client.companyName,
      masterId: selectedMasterId,
      environment: "UAT",
      tokenType: "UAT_SANDBOX",
      maskedToken: "", // populated by store
      allocatedQuota,
      expiresAt: expiresAt.toISOString(),
    });

    setIsProvisionOpen(false);

    // Show secret once
    setRevealedSecretData({
      tokenId,
      rawSecret,
      maskedToken: `uat_${rawSecret.substring(4, 12)}**********${rawSecret.substring(rawSecret.length - 4)}`,
      clientName: client.companyName,
    });
  };

  const handleRotateSecret = (tokenId: string) => {
    if (confirm(`Are you sure you want to rotate secret for ${tokenId}? Any existing integration using the previous secret will immediately receive HTTP 401 Unauthorized.`)) {
      const res = rotateToken(tokenId);
      if (res) {
        const token = tokens.find((t) => t.tokenId === tokenId);
        setRevealedSecretData({
          tokenId,
          rawSecret: res.rawSecret,
          maskedToken: res.newMasked,
          clientName: token?.companyName || "Client",
        });
      }
    }
  };

  const handleRevokeToken = (tokenId: string) => {
    if (confirm(`Revoke token ${tokenId}? This cannot be undone and will permanently disable all requests using this credential.`)) {
      revokeToken(tokenId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              UAT Token Management
            </h1>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Metered Quota Sandbox
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provision developer sandboxes, allocate test verification quotas, rotate cryptographic secrets, and prevent quota exhaustion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Issue New UAT Token
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Allocated Quota</span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalAllocated.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400">Across {uatTokens.length} sandbox credentials</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Quota Consumed</span>
            <Clock className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {totalConsumed.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400">
            {totalAllocated > 0 ? Math.round((totalConsumed / totalAllocated) * 100) : 0}% aggregate utilization
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Remaining Quota</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {totalRemaining.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-500">Available for partner verification testing</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active UAT Sandboxes</span>
            <KeyRound className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {uatTokens.filter((t) => t.status === "ACTIVE").length}
          </div>
          <span className="text-xs text-slate-400">
            {uatTokens.filter((t) => t.status === "REVOKED").length} revoked
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by token ID, client name, masked token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Clients</option>
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.companyName}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="REVOKED">REVOKED</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>
        </div>
      </div>

      {/* UAT Tokens Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Token ID & Tenant</th>
                <th className="py-3 px-4">Masked Credential Reference</th>
                <th className="py-3 px-4">Master Admin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Allocated</th>
                <th className="py-3 px-4">Consumed</th>
                <th className="py-3 px-4">Remaining</th>
                <th className="py-3 px-4 w-36">Quota Gauge</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No UAT tokens found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => {
                  const percentUsed = token.allocatedQuota > 0 ? Math.round((token.consumedQuota / token.allocatedQuota) * 100) : 0;
                  const isDepleted = token.remainingQuota <= 0;

                  return (
                    <tr
                      key={token.tokenId}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-mono font-semibold text-slate-900 dark:text-white">
                            {token.tokenId}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {token.companyName} ({token.clientId})
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          <span>{token.maskedToken}</span>
                          <CopyButton textToCopy={token.maskedToken} />
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {token.masterId}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          variant={
                            token.status === "ACTIVE"
                              ? isDepleted
                                ? "danger"
                                : "success"
                              : "secondary"
                          }
                          label={isDepleted && token.status === "ACTIVE" ? "EXHAUSTED" : token.status}
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {token.allocatedQuota.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {token.consumedQuota.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        <span
                          className={
                            token.remainingQuota < 1000
                              ? "text-rose-500"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {token.remainingQuota.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-slate-400">{percentUsed}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                percentUsed >= 90
                                  ? "bg-rose-500"
                                  : percentUsed >= 70
                                  ? "bg-amber-500"
                                  : "bg-cyan-500"
                              }`}
                              style={{ width: `${Math.min(percentUsed, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(token.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/request-investigation?token=${token.tokenId}`}
                            className="p-1 rounded text-slate-400 hover:text-cyan-500 transition"
                            title="Investigate requests using this token"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          {token.status === "ACTIVE" && (
                            <>
                              <button
                                onClick={() => handleRotateSecret(token.tokenId)}
                                className="p-1 rounded text-slate-400 hover:text-amber-500 transition"
                                title="Rotate Secret (Generates new secret)"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRevokeToken(token.tokenId)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                                title="Revoke Token"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
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
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        title="Issue New UAT Sandbox Token"
      >
        <form onSubmit={handleIssueToken} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Client / Tenant
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                const matchingMaster = masterAdmins.find((m) => m.clientId === e.target.value);
                if (matchingMaster) setSelectedMasterId(matchingMaster.masterId);
              }}
              required
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.companyName} ({c.clientId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Owning Master Admin
            </label>
            <select
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {masterAdmins
                .filter((m) => m.clientId === selectedClientId)
                .map((m) => (
                  <option key={m.masterId} value={m.masterId}>
                    {m.name} ({m.masterId})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Allocated Quota (Requests)
              </label>
              <input
                type="number"
                value={allocatedQuota}
                onChange={(e) => setAllocatedQuota(Number(e.target.value))}
                min={500}
                max={100000}
                step={500}
                required
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expiration Horizon
              </label>
              <select
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              The raw cryptographic API key will be displayed <strong>once</strong> upon issuance. We store only salted SHA-256 hashes in Convex.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsProvisionOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
            >
              Provision Token
            </button>
          </div>
        </form>
      </Modal>

      {/* Secret Reveal Modal */}
      {revealedSecretData && (
        <Modal
          isOpen={true}
          onClose={() => setRevealedSecretData(null)}
          title="Important: Save Your API Secret Key"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                Please copy this raw secret key now. <strong>You will not be able to see it again!</strong> It is not stored in plain text anywhere in the platform.
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Raw Authorization Header Bearer Secret:
              </label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 break-all select-all">
                <code>{revealedSecretData.rawSecret}</code>
                <CopyButton textToCopy={revealedSecretData.rawSecret} />
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>
                <strong>Token ID:</strong> {revealedSecretData.tokenId}
              </div>
              <div>
                <strong>Tenant:</strong> {revealedSecretData.clientName}
              </div>
              <div>
                <strong>Masked Reference:</strong> {revealedSecretData.maskedToken}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRevealedSecretData(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition"
              >
                I Have Safely Saved the Key
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
