"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Check, ChevronDown, ChevronRight, LogOut, Menu, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLIENT_ROLES, ROLE_LABELS, type ClientRole } from "@/lib/auth/roles";
import { setPreviewRole } from "@/app/app/actions";
import { SEGMENT_LABELS } from "./nav";
import { useSession } from "./SessionContext";

function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    href: "/" + segments.slice(0, i + 1).join("/"),
    label: SEGMENT_LABELS[seg] ?? decodeURIComponent(seg),
  }));
  // "/app" itself only redirects, so it is not a useful link.
  const visible = crumbs.filter((c) => c.href !== "/app");
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {visible.map((c, i) => {
          const last = i === visible.length - 1;
          return (
            <li key={c.href} className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden sm:flex")}>
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />}
              {last ? (
                <span aria-current="page" className="truncate font-medium text-ink">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="truncate text-ink-muted hover:text-ink">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="relative hidden w-full max-w-xs md:block"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/app/employees?search=${encodeURIComponent(term)}` : "/app/employees");
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search employees…"
        aria-label="Search employees"
        className="h-9 w-full rounded-lg border border-line bg-surface-muted pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
        className="rounded-lg p-2 text-ink-secondary hover:bg-surface-sunken hover:text-ink"
      >
        <Bell className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-line bg-surface p-4 shadow-pop">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          <p className="mt-2 text-sm text-ink-muted">
            No notifications. Alerts will appear here once the notification service is connected.
          </p>
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { name, email, role, companyName, isPreview } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  const switchRole = (next: ClientRole) =>
    startTransition(async () => {
      await setPreviewRole(next);
      setOpen(false);
      router.refresh();
    });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-surface-sunken"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nav text-xs font-semibold text-white" aria-hidden>
          {name
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink">{name}</span>
          <span className="block text-xs leading-tight text-ink-muted">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-ink-muted sm:block" aria-hidden />
        <span className="sr-only">Open profile menu</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-line bg-surface py-2 shadow-pop">
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="text-sm font-semibold text-ink">{name}</p>
            <p className="truncate text-xs text-ink-muted">{email}</p>
            <p className="mt-1 text-xs text-ink-secondary">{companyName}</p>
          </div>
          {isPreview && (
            <div className="border-b border-line px-2 py-2" role="group" aria-label="Preview role">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Preview role</p>
              {CLIENT_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={pending}
                  onClick={() => switchRole(r)}
                  aria-pressed={role === r}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm text-ink-secondary hover:bg-surface-sunken disabled:opacity-60"
                >
                  {ROLE_LABELS[r]}
                  {role === r && <Check className="h-4 w-4 text-primary" aria-hidden />}
                </button>
              ))}
              <p className="px-2 pt-1 text-[11px] text-ink-muted">Local preview identity. Real sign-in is not connected yet.</p>
            </div>
          )}
          <div className="px-2 pt-2">
            <button
              type="button"
              disabled={isPreview}
              title={isPreview ? "Sign-out is unavailable for the preview identity" : undefined}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-secondary hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        aria-controls="app-sidebar"
        className="rounded-lg p-2 text-ink-secondary hover:bg-surface-sunken lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>
      <GlobalSearch />
      <Notifications />
      <ProfileMenu />
    </header>
  );
}
