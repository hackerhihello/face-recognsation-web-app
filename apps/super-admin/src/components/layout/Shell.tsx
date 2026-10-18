"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { usePortal } from "@/lib/store";
import { CheckCircle2 } from "lucide-react";

export function Shell({ children }: { children: React.ReactNode }) {
  const { toastMessage } = usePortal();

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] antialiased">
      {/* 16-Item Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Topbar />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="sticky top-16 z-50 px-6 pt-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/80 backdrop-blur-md px-4 py-3 text-xs text-cyan-200 shadow-xl shadow-cyan-950/40 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
