"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  AlertTriangle,
  Globe,
  CheckCircle2,
  Copy,
  Clock,
  Sliders,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { CopyButton } from "@/components/ui/CopyButton";
import Link from "next/link";

interface ProdCredential {
  credentialId: string;
  clientId: string;
  companyName: string;
  maskedKey: string;
  status: "ACTIVE" | "PENDING_ROTATION" | "SUSPENDED";
  allowedIps: string[];
  webhookSigningSecretMasked: string;
  rateLimitTier: string;
  lastUsedAt: string;
  createdAt: string;
  rotationDueDays: number;
}

export default function ProductionCredentialsPage() {
  const { clients, showToast } = usePortal();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState("ALL");
  const [rotationModalCred, setRotationModalCred] = useState<ProdCredential | null>(null);
  const [allowlistModalCred, setAllowlistModalCred] = useState<ProdCredential | null>(null);
  const [ipInputs, setIpInputs] = useState<string>("");

  const [prodCredentials, setProdCredentials] = useState<ProdCredential[]>([
    {
      credentialId: "cred_prod_live_001",
      clientId: "ABC001",
      companyName: "Acme Corp Ltd",
      maskedKey: "prod_live_948f21**********8392",
      status: "ACTIVE",
      allowedIps: ["198.51.100.4/32", "203.0.113.12/28"],
      webhookSigningSecretMasked: "whsec_live_99f2**********881b",
      rateLimitTier: "Tier 3 (1,200 req/min)",
      lastUsedAt: "Just now (42ms ago)",
      createdAt: "2026-09-01T10:00:00Z",
      rotationDueDays: 45,
    },
    {
      credentialId: "cred_prod_live_002",
      clientId: "FINTECH88",
      companyName: "Global FinTech Hub",
      maskedKey: "prod_live_38bf01**********7194",
      status: "PENDING_ROTATION",
      allowedIps: ["142.250.190.46/32"],
      webhookSigningSecretMasked: "whsec_live_a1b2**********99ff",
      rateLimitTier: "Tier 4 (2,500 req/min)",
      lastUsedAt: "3 mins ago",
      createdAt: "2026-08-15T08:30:00Z",
      rotationDueDays: 4,
    },
    {
      credentialId: "cred_prod_live_003",
      clientId: "SEC990",
      companyName: "SecureCorp Global",
      maskedKey: "prod_live_bb91a0**********0032",
      status: "ACTIVE",
      allowedIps: ["185.199.108.153/32", "185.199.109.153/32"],
      webhookSigningSecretMasked: "whsec_live_44aa**********33dc",
      rateLimitTier: "Tier 5 Dedicated (5,000 req/min)",
      lastUsedAt: "12 mins ago",
      createdAt: "2026-09-20T12:00:00Z",
      rotationDueDays: 68,
    },
  ]);

  const filtered = prodCredentials.filter((c) => {
    if (filterClient !== "ALL" && c.clientId !== filterClient) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!c.credentialId.toLowerCase().includes(q) && !c.companyName.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleExecuteRotation = (gracePeriodHours: number) => {
    if (!rotationModalCred) return;
    showToast(
      `Credential ${rotationModalCred.credentialId} rotated with a ${gracePeriodHours}h dual-key grace period.`
    );
    setProdCredentials((prev) =>
      prev.map((c) =>
        c.credentialId === rotationModalCred.credentialId
          ? {
              ...c,
              maskedKey: `prod_live_${Math.random().toString(36).substring(2, 8)}**********${Math.floor(1000 + Math.random() * 9000)}`,
              status: "ACTIVE",
              rotationDueDays: 90,
            }
          : c
      )
    );
    setRotationModalCred(null);
  };

  const handleSaveAllowlist = () => {
    if (!allowlistModalCred) return;
    const ips = ipInputs
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setProdCredentials((prev) =>
      prev.map((c) => (c.credentialId === allowlistModalCred.credentialId ? { ...c, allowedIps: ips } : c))
    );
    showToast(`IP Allowlist updated for ${allowlistModalCred.companyName}.`);
    setAllowlistModalCred(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Production Gateway Credentials Vault
            </h1>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Zero-Plaintext Policy
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Hardened mutual production credentials, CIDR IP allowlisting, webhook HMAC signatures, and zero-downtime rotation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Lock className="h-3.5 w-3.5" />
            Hardware KMS Sealed
          </div>
        </div>
      </div>

      {/* Security Architecture Callout */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              Architectural Separation: Production Gateway vs UAT Sandboxes
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Production credentials connect strictly to the Railway high-throughput production cluster (
              <code className="text-cyan-600 dark:text-cyan-400 font-mono">https://api.faceattend.com/v1</code>).
              Unlike UAT sandbox tokens, production credentials are not metered by quota countdowns; they are enforced by sliding-window token-bucket rate limits and IP geofencing.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by credential ID or tenant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="ALL">All Production Tenants</option>
              {clients.map((c) => (
                <option key={c.clientId} value={c.clientId}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Credentials Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Credential ID & Client</th>
                <th className="py-3 px-4">Masked Live Key</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">IP Allowlist (CIDR)</th>
                <th className="py-3 px-4">Webhook Signature</th>
                <th className="py-3 px-4">Rate Limit Tier</th>
                <th className="py-3 px-4">Rotation SLA</th>
                <th className="py-3 px-4 text-right">Vault Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filtered.map((cred) => (
                <tr
                  key={cred.credentialId}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">
                        {cred.credentialId}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {cred.companyName} ({cred.clientId})
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      <span>{cred.maskedKey}</span>
                      <CopyButton textToCopy={cred.maskedKey} />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      variant={
                        cred.status === "ACTIVE"
                          ? "success"
                          : cred.status === "PENDING_ROTATION"
                          ? "warning"
                          : "danger"
                      }
                      label={cred.status}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {cred.allowedIps.length} CIDR rules
                      </span>
                      <button
                        onClick={() => {
                          setAllowlistModalCred(cred);
                          setIpInputs(cred.allowedIps.join("\n"));
                        }}
                        className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {cred.webhookSigningSecretMasked}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {cred.rateLimitTier}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-semibold ${
                        cred.rotationDueDays <= 7
                          ? "text-rose-500"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      Due in {cred.rotationDueDays} days
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setRotationModalCred(cred)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Zero-Downtime Rotate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rotation Modal */}
      {rotationModalCred && (
        <Modal
          isOpen={true}
          onClose={() => setRotationModalCred(null)}
          title={`Zero-Downtime Key Rotation — ${rotationModalCred.companyName}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                To avoid breaking live production attendance traffic, our gateway keeps the old key valid in parallel for a specified grace window.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Parallel Dual-Key Grace Window
              </label>
              <select
                id="grace-select"
                defaultValue="24"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="12">12 Hours (Rapid Migration)</option>
                <option value="24">24 Hours (Recommended)</option>
                <option value="48">48 Hours (Multi-region rollouts)</option>
                <option value="0">0 Hours (Immediate Invalid - Emergency)</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <div>
                <strong>Tenant:</strong> {rotationModalCred.companyName} ({rotationModalCred.clientId})
              </div>
              <div>
                <strong>Current Key:</strong> {rotationModalCred.maskedKey}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRotationModalCred(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteRotation(24)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm"
              >
                Confirm Key Rotation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* IP Allowlist Modal */}
      {allowlistModalCred && (
        <Modal
          isOpen={true}
          onClose={() => setAllowlistModalCred(null)}
          title={`Edit CIDR IP Allowlist — ${allowlistModalCred.companyName}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Permitted IP Addresses or CIDR Blocks (One per line)
              </label>
              <textarea
                rows={4}
                value={ipInputs}
                onChange={(e) => setIpInputs(e.target.value)}
                placeholder="198.51.100.4/32&#10;203.0.113.0/24"
                className="w-full font-mono text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Requests originating outside these CIDR blocks receive HTTP 403 Forbidden at the Cloudflare Edge WAF.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAllowlistModalCred(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAllowlist}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
              >
                Save IP Allowlist
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
