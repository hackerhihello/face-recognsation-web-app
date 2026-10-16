"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClientPortal } from "@/lib/clientPortalStore";
import {
  LayoutDashboard,
  Users,
  Camera,
  CalendarCheck,
  Radio,
  Clock,
  Briefcase,
  MapPin,
  FileSpreadsheet,
  ShieldAlert,
  Bell,
  Coins,
  Settings,
  History,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
  ExternalLink,
} from "lucide-react";

interface SidebarModule {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  badge?: string;
  badgeColor?: string;
  featureFlagKey?: "faceRegistration" | "attendance" | "gpsValidation" | "reports" | "notifications";
}

export const CLIENT_MODULES: SidebarModule[] = [
  // Core Pulse
  { name: "Dashboard Overview", href: "/legacy-overview", icon: LayoutDashboard, section: "Core Operations" },
  { name: "Live Attendance", href: "/live-attendance", icon: Radio, section: "Core Operations", badge: "Live", badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },

  // Workforce Management
  { name: "Employees", href: "/employees", icon: Users, section: "Workforce" },
  { name: "Face Registration", href: "/face-registration", icon: Camera, section: "Workforce", badge: "Biometrics", badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", featureFlagKey: "faceRegistration" },
  { name: "Departments", href: "/departments", icon: Briefcase, section: "Workforce" },

  // Attendance Engine
  { name: "Attendance Records", href: "/attendance", icon: CalendarCheck, section: "Attendance & Shifts", featureFlagKey: "attendance" },
  { name: "Shifts & Schedules", href: "/shifts", icon: Clock, section: "Attendance & Shifts" },
  { name: "Locations & Geofences", href: "/locations", icon: MapPin, section: "Attendance & Shifts", featureFlagKey: "gpsValidation" },

  // Analytics & Compliance
  { name: "Reports & Exports", href: "/reports", icon: FileSpreadsheet, section: "Compliance & Insights", featureFlagKey: "reports" },
  { name: "Audit History", href: "/audit", icon: History, section: "Compliance & Insights" },
  { name: "API Usage & Requests", href: "/api-usage", icon: Coins, section: "Compliance & Insights" },

  // Administration & Support
  { name: "Client Users & Roles", href: "/users", icon: ShieldAlert, section: "Administration" },
  { name: "Notifications", href: "/notifications", icon: Bell, section: "Administration", featureFlagKey: "notifications" },
  { name: "Company Settings", href: "/settings", icon: Settings, section: "Administration" },
  { name: "Help & Support", href: "/support", icon: HelpCircle, section: "Administration" },
];

export function ClientSidebar() {
  const pathname = usePathname();
  const { settings, featureFlags, notifications } = useClientPortal();
  const [collapsed, setCollapsed] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  // Filter modules based on tenant feature flags
  const visibleModules = CLIENT_MODULES.filter((m) => {
    if (!m.featureFlagKey) return true;
    return featureFlags[m.featureFlagKey] !== false;
  });

  const sections = Array.from(new Set(visibleModules.map((m) => m.section)));

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-68"
      } shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d18] flex flex-col h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/20 font-bold text-sm">
            {settings.companyName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate">
                  {settings.companyName}
                </span>
              </div>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-medium block leading-tight">
                Tenant: {settings.clientId}
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {section}
              </h4>
            )}

            {visibleModules
              .filter((m) => m.section === section)
              .map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50"
                    }`}
                    title={collapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-cyan-600 dark:text-cyan-400"
                            : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {!collapsed && item.href === "/notifications" && unreadNotifications > 0 && (
                      <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        ))}
      </div>

      {/* Footer / Tenant Switcher Status */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Building2 className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
          {!collapsed && (
            <span className="truncate text-[11px]">
              Multi-Tenant Isolated Portal
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
