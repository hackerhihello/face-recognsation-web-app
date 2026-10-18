import type { Metadata } from "next";
import { ScanFace } from "lucide-react";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-6 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <ScanFace className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="text-lg font-semibold text-ink">Face Attendance</h1>
        </div>
        {error === "forbidden" ? (
          <p role="alert" className="text-sm text-danger">
            Your account is not a member of a client organization.
          </p>
        ) : (
          <p className="text-sm text-ink-secondary">
            Sign-in is not connected yet. Authentication will be provided by the Convex backend in a later phase.
          </p>
        )}
      </div>
    </main>
  );
}
