"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Users,
  ServerCog,
  SearchCode,
  Coins,
  KeyRound,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ToggleLeft,
  Layers,
  CreditCard,
  Activity,
  Settings,
  Shield,
  ExternalLink,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  section?: string;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  // Core Fleet
  { name: "Overview Dashboard", href: "/", icon: LayoutDashboard, section: "Overview" },
  
  // Tenancy & Directory
  { name: "Clients / Tenants", href: "/clients", icon: Building2, section: "Tenancy & Staff" },
  { name: "Master Admins", href: "/master-admins", icon: UserCheck, section: "Tenancy & Staff" },
  { name: "Employees", href: "/employees", icon: Users, section: "Tenancy & Staff" },

  // API & Observability
  { name: "API Management", href: "/api-management", icon: ServerCog, section: "API & Observability" },
  { name: "Request Investigation", href: "/request-investigation", icon: SearchCode, badge: "Critical", badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", section: "API & Observability" },
  { name: "API Usage & Billing", href: "/api-usage", icon: Coins, section: "API & Observability" },

  // Token Governance
  { name: "UAT Token Management", href: "/uat-tokens", icon: KeyRound, badge: "Metered", badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30", section: "Token Governance" },
  { name: "Production Credentials", href: "/production-credentials", icon: ShieldCheck, section: "Token Governance" },

  // Logs & Compliance
  { name: "Audit Logs", href: "/audit-logs", icon: FileText, section: "Compliance & Diagnostics" },
  { name: "Error Logs", href: "/error-logs", icon: AlertTriangle, badge: "Live", badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30", section: "Compliance & Diagnostics" },
  { name: "Feature Flags", href: "/feature-flags", icon: ToggleLeft, section: "Compliance & Diagnostics" },

  // Infrastructure & Security
  { name: "Environment Management", href: "/environments", icon: Layers, section: "Infrastructure & Platform" },
  { name: "Subscription Plans", href: "/subscriptions", icon: CreditCard, section: "Infrastructure & Platform" },
  { name: "System Health", href: "/system-health", icon: Activity, section: "Infrastructure & Platform" },
  { name: "Security & Settings", href: "/settings", icon: Settings, section: "Infrastructure & Platform" },
];

export function Sidebar() {
  const pathname = usePathname();

  // Group items by section
  const sections = Array.from(new Set(NAVIGATION_ITEMS.map((item) => item.section || "General")));

  return (
    <aside className="w-68 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d18] flex flex-col h-screen sticky top-0 z-30 transition-colors">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 p-2 shadow-lg shadow-cyan-500/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">FaceAttend</span>
              <span className="rounded bg-cyan-500/10 px-1 py-0.2 text-[9px] font-mono font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                SUPER
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block leading-tight">Omniscient Control Plane</span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((sectionTitle) => {
          const items = NAVIGATION_ITEMS.filter((item) => item.section === sectionTitle);
          return (
            <div key={sectionTitle} className="space-y-1">
              <span className="px-2.5 text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400">
                {sectionTitle}
              </span>
              <ul className="space-y-0.5 mt-1">
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-all ${
                          isActive
                            ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-semibold border border-cyan-500/25 shadow-sm"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive
                                ? "text-cyan-600 dark:text-cyan-400"
                                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                            }`}
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono border font-semibold ${
                              item.badgeColor || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
        <a
          href="https://faceapidocs.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-white dark:hover:bg-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2 text-[11px]">
            <ExternalLink className="h-3.5 w-3.5 text-cyan-500" />
            <span>Developer Docs</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">v1.2.0</span>
        </a>
      </div>
    </aside>
  );
}
