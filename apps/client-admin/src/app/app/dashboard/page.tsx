import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { todayIso } from "@/lib/format";
import { DashboardView } from "./DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requirePermission("dashboard.view");
  // Computed on the server so the first client render matches the HTML.
  return <DashboardView initialDate={todayIso()} />;
}
