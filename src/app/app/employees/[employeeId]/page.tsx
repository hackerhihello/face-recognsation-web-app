import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { EmployeeDetailView } from "./EmployeeDetailView";

export const metadata: Metadata = { title: "Employee" };

export default async function EmployeeDetailPage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("employees.view");
  const { employeeId } = await params;
  return <EmployeeDetailView employeeId={decodeURIComponent(employeeId)} />;
}
