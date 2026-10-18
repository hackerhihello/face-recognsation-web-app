"use client";

import { useState, useSyncExternalStore } from "react";
import { ToastProvider } from "@/components/ds/Toast";
import { SessionProvider, type ClientSessionInfo } from "./SessionContext";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const COLLAPSE_KEY = "fa.sidebarCollapsed";
const COLLAPSE_EVENT = "fa:sidebar-collapse";

// Per-viewer UI preference; storage access can throw, so fall back to expanded.
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(COLLAPSE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COLLAPSE_EVENT, onChange);
  };
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT));
}

export function AppShell({ session, children }: { session: ClientSessionInfo; children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SessionProvider value={session}>
      <ToastProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:shadow-pop"
        >
          Skip to content
        </a>
        <div className="flex min-h-screen">
          <Sidebar
            collapsed={collapsed}
            onToggleCollapsed={() => writeCollapsed(!collapsed)}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
            <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 focus:outline-none sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </SessionProvider>
  );
}
