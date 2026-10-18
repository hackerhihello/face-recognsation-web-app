import type { Metadata } from "next";
import { ScanFace, ArrowRight, ShieldCheck, CheckCircle2, Building2 } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/app/app/actions";

export const metadata: Metadata = { title: "Sign in — Face Attendance" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-xl">
        {/* Brand Header */}
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
            <ScanFace className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Face Attendance</h1>
            <p className="text-xs text-ink-muted">Client & Tenant Management Portal</p>
          </div>
        </div>

        {error === "forbidden" && (
          <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            Your account is not a member of a client organization.
          </div>
        )}

        {/* 1-Click Quick Demo Sign In */}
        <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            Quick 1-Click Test Access
          </p>
          <div className="flex flex-col gap-2">
            <form action={loginAction}>
              <input type="hidden" name="email" value="admin.test@karitech.com" />
              <input type="hidden" name="clientId" value="KARITECH_TEST" />
              <input type="hidden" name="role" value="MASTER_ADMIN" />
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                <span>Sign in as Karitech Test Admin</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            <form action={loginAction}>
              <input type="hidden" name="email" value="admin.prod@karitech.com" />
              <input type="hidden" name="clientId" value="KARITECH_PROD" />
              <input type="hidden" name="role" value="MASTER_ADMIN" />
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-surface-sunken"
              >
                <span>Sign in as Karitech Prod Admin</span>
                <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />
              </button>
            </form>
          </div>
        </div>

        {/* Standard Sign In Form */}
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Tenant Organization</label>
            <select
              name="clientId"
              defaultValue="KARITECH_TEST"
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="KARITECH_TEST">Karitech Technologies (Test)</option>
              <option value="KARITECH_PROD">Karitech Technologies (Prod)</option>
              <option value="KSL042">KSL Sburagi Tech Ltd</option>
              <option value="ABC001">ABC Technologies</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Email Address</label>
            <input
              type="email"
              name="email"
              defaultValue="admin.test@karitech.com"
              required
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-muted">Role</label>
            <select
              name="role"
              defaultValue="MASTER_ADMIN"
              className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="MASTER_ADMIN">Master Administrator</option>
              <option value="HR_ADMIN">HR Administrator</option>
              <option value="DEPARTMENT_MANAGER">Department Manager</option>
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 flex h-10 w-full items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white shadow-sm transition hover:bg-ink/90"
          >
            Sign In to Dashboard
          </button>
        </form>

        {/* Direct Navigation Links */}
        <div className="mt-6 border-t border-line pt-4 text-center">
          <p className="text-xs text-ink-muted">Or access direct studios:</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs font-medium text-primary">
            <Link href="/face-registration" className="hover:underline">
              Face Registration Studio
            </Link>
            <span>•</span>
            <Link href="/live-attendance" className="hover:underline">
              Live Attendance
            </Link>
            <span>•</span>
            <Link href="/legacy-overview" className="hover:underline">
              Overview
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
