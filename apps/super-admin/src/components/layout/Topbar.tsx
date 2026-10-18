"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Sun,
  Moon,
  Shield,
  Activity,
  Layers,
  CheckCircle,
} from "lucide-react";
import { usePortal } from "@/lib/store";
import { Environment } from "@/types/portal";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme, selectedEnv, setSelectedEnv } = usePortal();
  const [quickQuery, setQuickQuery] = useState("");

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    router.push(`/request-investigation?q=${encodeURIComponent(quickQuery.trim())}`);
  };

  // Convert pathname to title
  const cleanPath = pathname === "/" ? "Overview" : pathname.replace("/", "").replace(/-/g, " ");
  const pageTitle = cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#060b13]/95 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* Left: Breadcrumbs & Page title */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span>Super Admin</span>
          <span>/</span>
          <span className="text-cyan-600 dark:text-cyan-400 font-medium capitalize">{pageTitle}</span>
        </div>
      </div>

      {/* Center: Global Request / Client Search */}
      <form onSubmit={handleQuickSearch} className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Request ID (REQ-...), Client ID, or Token..."
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 pl-9 pr-4 py-1.5 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Environment Filter Pill */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
          <Layers className="h-3 w-3 text-slate-400 ml-1.5" />
          {(["ALL", "PROD", "UAT", "DEV"] as (Environment | "ALL")[]).map((env) => (
            <button
              key={env}
              onClick={() => setSelectedEnv(env)}
              className={`px-2 py-0.5 rounded-lg font-semibold transition-all ${
                selectedEnv === env
                  ? env === "PROD"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : env === "UAT"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : env === "DEV"
                    ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                    : "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {env}
            </button>
          ))}
        </div>

        {/* Live Cluster Health Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SLA 99.99%</span>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-cyan-500 transition-colors"
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-cyan-600" />}
        </button>

        {/* Super Admin Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-cyan-500/20">
            SA
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Super Admin</div>
            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">Platform Root</div>
          </div>
        </div>
      </div>
    </header>
  );
}
