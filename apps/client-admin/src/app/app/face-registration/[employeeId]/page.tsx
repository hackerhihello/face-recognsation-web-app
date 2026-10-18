import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { FaceRegistrationWizard } from "./FaceRegistrationWizard";

export const metadata: Metadata = { title: "Register face" };

export default async function RegisterFacePage({ params }: { params: Promise<{ employeeId: string }> }) {
  await requirePermission("faces.register");
  const { employeeId } = await params;
  return <FaceRegistrationWizard employeeId={decodeURIComponent(employeeId)} />;
}
