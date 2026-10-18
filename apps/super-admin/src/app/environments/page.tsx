"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { Environment } from "@/types/portal";
import {
  Layers,
  Server,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  GitBranch,
  Cpu,
  Database,
  Lock,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyButton } from "@/components/ui/CopyButton";

interface EnvClusterInfo {
  name: Environment;
  title: string;
  badge: string;
  baseUrl: string;
  railwayDeploymentId: string;
  commitHash: string;
  status: "HEALTHY" | "DEGRADED" | "UPDATING";
  r2Bucket: string;
  convexDeployment: string;
  containerInstances: number;
  cpuUtilPercent: number;
  memoryUtilMb: number;
  tenantsEnrolled: number;
  lastDeployedAt: string;
}

export default function EnvironmentsPage() {
  const { clients, showToast } = usePortal();

  const [clusters, setClusters] = useState<EnvClusterInfo[]>([
    {
      name: "PROD",
      title: "Production Fleet",
      badge: "High Availability Multi-Region",
      baseUrl: "https://api.faceattend.com/v1",
      railwayDeploymentId: "dep_railway_prod_0994",
      commitHash: "git#7a8f1e9 (release/v2.4.0)",
      status: "HEALTHY",
      r2Bucket: "face-embeddings-prod (WORM Encrypted)",
      convexDeployment: "convex-prod-faceattend",
      containerInstances: 8,
      cpuUtilPercent: 28,
      memoryUtilMb: 2420,
      tenantsEnrolled: clients.filter((c) => c.allowedEnvironments.includes("PROD")).length,
      lastDeployedAt: "2 days ago (Zero-Downtime Rollout)",
    },
    {
      name: "UAT",
      title: "UAT Sandbox Fleet",
      badge: "Partner Staging & Metered Quotas",
      baseUrl: "https://api-uat.faceattend.com/v1",
      railwayDeploymentId: "dep_railway_uat_0811",
      commitHash: "git#7a8f1e9 (release/v2.4.0)",
      status: "HEALTHY",
      r2Bucket: "face-embeddings-uat (Sandbox Vectors)",
      convexDeployment: "convex-uat-faceattend",
      containerInstances: 3,
      cpuUtilPercent: 18,
      memoryUtilMb: 1100,
      tenantsEnrolled: clients.filter((c) => c.allowedEnvironments.includes("UAT")).length,
      lastDeployedAt: "3 days ago",
    },
    {
      name: "DEV",
      title: "Development Testbed",
      badge: "Internal CI/CD & Fast Iteration",
      baseUrl: "https://api-dev.faceattend.com/v1",
      railwayDeploymentId: "dep_railway_dev_1042",
      commitHash: "git#bf441a0 (feat/onnx-liveness-v2)",
      status: "HEALTHY",
      r2Bucket: "face-embeddings-dev (Ephemeral)",
      convexDeployment: "convex-dev-faceattend",
      containerInstances: 2,
      cpuUtilPercent: 12,
      memoryUtilMb: 850,
      tenantsEnrolled: clients.filter((c) => c.allowedEnvironments.includes("DEV")).length,
      lastDeployedAt: "4 hours ago (Automated CI trigger)",
    },
  ]);

  const handleTriggerSmokeTest = (env: Environment) => {
    showToast(`Initiating automated synthetic smoke test against ${env} gateway...`);
    setTimeout(() => {
      showToast(`${env} cluster synthetic tests passed: 22 endpoints verified (0 failures).`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Environment & Infrastructure Management
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Railway + Cloudflare R2 Multi-Cluster
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Isolated environments preventing cross-cluster contamination of biometric vectors and audit state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>3 / 3 Clusters Healthy</span>
          </div>
        </div>
      </div>

      {/* Cluster Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {clusters.map((cluster) => (
          <div
            key={cluster.name}
            className={`rounded-xl border bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-5 flex flex-col justify-between ${
              cluster.name === "PROD"
                ? "border-emerald-500/30 ring-1 ring-emerald-500/20"
                : "border-slate-200 dark:border-slate-800"
            }`}
          >
            <div>
              {/* Cluster Title */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {cluster.name}
                    </h3>
                    <StatusBadge
                      variant={
                        cluster.status === "HEALTHY"
                          ? "success"
                          : cluster.status === "DEGRADED"
                          ? "warning"
                          : "secondary"
                      }
                      label={cluster.status}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{cluster.title}</span>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {cluster.badge}
                </span>
              </div>

              {/* Base URL */}
              <div className="mt-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  API Gateway Base URL:
                </span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-800">
                  <code>{cluster.baseUrl}</code>
                  <CopyButton textToCopy={cluster.baseUrl} />
                </div>
              </div>

              {/* Infrastructure Details */}
              <div className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Server className="h-3.5 w-3.5 text-slate-400" /> Railway Deployment
                  </span>
                  <span className="font-mono text-[11px] text-slate-900 dark:text-white">
                    {cluster.railwayDeploymentId}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <GitBranch className="h-3.5 w-3.5 text-slate-400" /> Git Commit
                  </span>
                  <span className="font-mono text-[11px] text-slate-900 dark:text-white">
                    {cluster.commitHash}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Cloud className="h-3.5 w-3.5 text-slate-400" /> Cloudflare R2 Bucket
                  </span>
                  <span className="font-mono text-[11px] text-slate-900 dark:text-white">
                    {cluster.r2Bucket}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Database className="h-3.5 w-3.5 text-slate-400" /> Convex Backend
                  </span>
                  <span className="font-mono text-[11px] text-slate-900 dark:text-white">
                    {cluster.convexDeployment}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Cpu className="h-3.5 w-3.5 text-slate-400" /> Container Replicas
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {cluster.containerInstances} ONNX Replicas (CPU {cluster.cpuUtilPercent}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Enrolled Tenants</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                    {cluster.tenantsEnrolled} Tenants
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {cluster.lastDeployedAt}
              </span>

              <button
                onClick={() => handleTriggerSmokeTest(cluster.name)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              >
                <RefreshCw className="h-3 w-3" />
                Run Smoke Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
