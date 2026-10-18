"use client";

import React from "react";

interface StatusBadgeProps {
  status?: string;
  label?: string;
  variant?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, variant, size = "md" }: StatusBadgeProps) {
  const displayStatus = label || status || "UNKNOWN";
  const norm = displayStatus.toUpperCase();

  let styles = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700";

  if (variant === "success" || ["ACTIVE", "SUCCESS", "OPERATIONAL", "PRESENT", "HEALTHY"].includes(norm)) {
    styles = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  } else if (variant === "danger" || ["SUSPENDED", "FAILED", "REVOKED", "CRITICAL", "TERMINATED", "EXHAUSTED", "DOWN"].includes(norm)) {
    styles = "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
  } else if (variant === "warning" || ["TRIAL", "UAT", "HIGH", "WARN", "LATE", "INVITED", "DEGRADED", "PENDING_ROTATION", "UPDATING"].includes(norm)) {
    styles = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
  } else if (variant === "info" || ["DEV", "PROD", "MEDIUM", "ENTERPRISE", "PRIMARY_MASTER_ADMIN", "PROFESSIONAL"].includes(norm)) {
    styles = "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30";
  } else if (variant === "secondary" || ["PENDING_FACE_REGISTRATION", "MAINTENANCE", "STARTER", "CUSTOM"].includes(norm)) {
    styles = "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
  }

  const padding = size === "sm" ? "px-1.5 py-0.2 text-[9px]" : "px-2.5 py-0.5 text-[10px]";

  return (
    <span className={`inline-flex items-center font-mono font-semibold rounded-full border ${padding} ${styles}`}>
      {displayStatus}
    </span>
  );
}
