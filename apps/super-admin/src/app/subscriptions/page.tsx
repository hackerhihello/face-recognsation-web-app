"use client";

import React, { useState } from "react";
import { usePortal } from "@/lib/store";
import { SubscriptionPlanTier } from "@/types/portal";
import {
  CreditCard,
  Check,
  Building2,
  Users,
  Coins,
  ShieldCheck,
  ArrowRight,
  Zap,
  Sliders,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";

interface PlanConfig {
  tier: SubscriptionPlanTier;
  name: string;
  monthlyPriceUsd: number;
  maxEmployees: string;
  monthlyOperationsQuota: string;
  slaPercent: string;
  features: string[];
  recommended?: boolean;
}

export default function SubscriptionsPage() {
  const { clients, showToast } = usePortal();

  const plans: PlanConfig[] = [
    {
      tier: "STARTER",
      name: "Starter Sandbox & Pilot",
      monthlyPriceUsd: 149,
      maxEmployees: "Up to 50 Employees",
      monthlyOperationsQuota: "10,000 Face Ops / mo",
      slaPercent: "99.5%",
      features: [
        "1 Master Admin Account",
        "Single Office Location Geofence",
        "Basic Face Verification (1:1)",
        "Standard Attendance CSV Export",
        "Community Support",
      ],
    },
    {
      tier: "PROFESSIONAL",
      name: "Professional Growth",
      monthlyPriceUsd: 499,
      maxEmployees: "Up to 500 Employees",
      monthlyOperationsQuota: "75,000 Face Ops / mo",
      slaPercent: "99.9%",
      recommended: true,
      features: [
        "Up to 5 Master Admin Accounts",
        "Unlimited Office Geofences",
        "Strict Liveness & Anti-Spoofing",
        "Live Push Notifications & Webhooks",
        "99.9% Uptime SLA",
        "Priority Email & Slack Support",
      ],
    },
    {
      tier: "ENTERPRISE",
      name: "Enterprise Dedicated",
      monthlyPriceUsd: 1499,
      maxEmployees: "Unlimited Employees",
      monthlyOperationsQuota: "500,000+ Face Ops / mo",
      slaPercent: "99.99%",
      features: [
        "Unlimited Master Admins & Roles",
        "Dedicated Railway Container Allocation",
        "WORM-Encrypted Cloudflare R2 Vault",
        "Automated Payroll Sync Integration",
        "Zero-Downtime Key Rotation Policy",
        "24/7 Dedicated SRE Support & Escalation",
      ],
    },
    {
      tier: "CUSTOM",
      name: "Bespoke Sovereign",
      monthlyPriceUsd: 2999,
      maxEmployees: "Multi-Entity Scaling",
      monthlyOperationsQuota: "Custom Metering Agreement",
      slaPercent: "99.999%",
      features: [
        "Custom Cloudflare Workers Edge Rules",
        "On-Premise Face Vector Replication",
        "Bespoke Anti-Spoofing Model Tuning",
        "Enterprise Master Service Agreement",
        "Named Technical Account Manager",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Subscription Plans & Tier Governance
            </h1>
            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              Commercial Tiers
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure platform quotas, SLA commitments, employee capacities, and view tenant distributions across plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            Manage Client Plans
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const clientCount = clients.filter((c) => c.subscriptionPlan === plan.tier).length;

          return (
            <div
              key={plan.tier}
              className={`rounded-xl border bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-5 flex flex-col justify-between relative ${
                plan.recommended
                  ? "border-cyan-500 ring-2 ring-cyan-500/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-cyan-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {plan.name}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {plan.tier}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      ${plan.monthlyPriceUsd}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <span className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold block mt-1">
                    {plan.slaPercent} Availability SLA
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Capacity:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plan.maxEmployees}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Included Ops:</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {plan.monthlyOperationsQuota}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Features Included:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Tenants:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {clientCount} enrolled
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
