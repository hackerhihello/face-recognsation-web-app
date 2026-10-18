import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { EmployeesView } from "./EmployeesView";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  await requirePermission("employees.view");
  const { search = "" } = await searchParams;
  // Remount when the top-bar search changes the query string.
  return <EmployeesView key={search} initialSearch={search} />;
}
