"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useClientPortal } from "@/lib/clientPortalStore";
import { ClientAdminRole } from "@/types/clientPortal";
import {
  Building2,
  UserCheck,
  Bell,
  Search,
  ChevronDown,
  Shield,
  Layers,
  Check,
  Clock,
} from "lucide-react";
import Link from "next/link";

export function ClientTopbar() {
  const pathname = usePathname();
  const {
    activeClientId,
    setActiveClientId,
    availableClients,
    activeUser,
    setActiveUserRole,
    settings,
    notifications,
  } = useClientPortal();

  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Generate breadcrumb title
  const segment = pathname.split("/").filter(Boolean)[0] || "Overview";
  const pageTitle = segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#070d18]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs & Current Screen */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <span className="text-slate-600 dark:text-slate-300 font-semibold">{settings.companyName}</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">{pageTitle}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Multi-Tenant Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setTenantDropdownOpen(!tenantDropdownOpen);
              setRoleDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Building2 className="h-3.5 w-3.5 text-cyan-500" />
            <span>Tenant: {activeClientId}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {tenantDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-2 z-50">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Switch Corporate Tenant
              </div>
              {availableClients.map((c) => (
                <button
                  key={c.clientId}
                  onClick={() => {
                    setActiveClientId(c.clientId);
                    setTenantDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition ${
                    activeClientId === c.clientId
                      ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium">{c.companyName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{c.clientId}</div>
                  </div>
                  {activeClientId === c.clientId && <Check className="h-4 w-4 text-cyan-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleDropdownOpen(!roleDropdownOpen);
              setTenantDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
            <span className="truncate max-w-[130px]">
              {activeUser.role === "PRIMARY_MASTER_ADMIN"
                ? "Master Admin"
                : activeUser.role === "HR_ADMIN"
                ? "HR Admin"
                : "Manager"}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-2 z-50">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Simulate Role Permissions
              </div>
              {[
                { role: "PRIMARY_MASTER_ADMIN", label: "Master Admin (Full Access)" },
                { role: "HR_ADMIN", label: "HR Admin (Staff & Punches)" },
                { role: "DEPARTMENT_MANAGER", label: "Department Manager" },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => {
                    setActiveUserRole(item.role as ClientAdminRole);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs transition ${
                    activeUser.role === item.role
                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{item.label}</span>
                  {activeUser.role === item.role && <Check className="h-4 w-4 text-indigo-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Tray Icon */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          )}
        </Link>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {activeUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left text-xs">
            <span className="font-semibold text-slate-900 dark:text-white block leading-tight">
              {activeUser.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block">
              {activeUser.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
