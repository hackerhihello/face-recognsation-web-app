"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, ScanFace, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { hasPermission } from "@/lib/auth/roles";
import { CLIENT_NAV } from "./nav";
import { useSession } from "./SessionContext";

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const { role, companyName } = useSession();

  const sections = CLIENT_NAV.map((s) => ({ ...s, items: s.items.filter((i) => hasPermission(role, i.permission)) })).filter(
    (s) => s.items.length > 0,
  );

  // On mobile the drawer always shows labels, whatever the desktop collapse state.
  const compact = collapsed && !mobileOpen;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" aria-hidden onClick={onCloseMobile} />}
      <aside
        id="app-sidebar"
        aria-label="Main navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-nav text-nav-ink transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0",
          mobileOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full",
          compact ? "lg:w-[4.5rem]" : "lg:w-64",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4">
          <Link href="/app/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onCloseMobile}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <ScanFace className="h-5 w-5" aria-hidden />
            </span>
            {!compact && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{companyName}</span>
                <span className="block truncate text-[11px] text-nav-ink-muted">Face Attendance</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-nav-ink-muted hover:bg-nav-hover hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title}>
              {!compact ? (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-nav-ink-muted">{section.title}</p>
              ) : (
                <div className="mx-3 mb-2 border-t border-white/10" aria-hidden />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const inner = (
                    <>
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      {!compact && <span className="flex-1 truncate">{item.label}</span>}
                      {!compact && !item.ready && (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-nav-ink-muted">Soon</span>
                      )}
                    </>
                  );
                  const base = cn(
                    "flex h-9 items-center gap-3 rounded-lg px-3 text-sm",
                    compact && "justify-center px-0",
                  );
                  return (
                    <li key={item.href}>
                      {item.ready ? (
                        <Link
                          href={item.href}
                          onClick={onCloseMobile}
                          aria-current={active ? "page" : undefined}
                          title={compact ? item.label : undefined}
                          className={cn(
                            base,
                            "transition-colors",
                            active ? "bg-nav-active font-medium text-white" : "hover:bg-nav-hover hover:text-white",
                          )}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          title={`${item.label} — coming in a later phase`}
                          className={cn(base, "cursor-not-allowed text-nav-ink-muted/70")}
                        >
                          {inner}
                          <span className="sr-only"> (coming soon)</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-controls="app-sidebar"
            aria-expanded={!collapsed}
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-nav-ink-muted hover:bg-nav-hover hover:text-white",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" aria-hidden /> : <ChevronsLeft className="h-4 w-4" aria-hidden />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
