import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/session";
import { FaceRegistrationListView } from "./FaceRegistrationListView";

export const metadata: Metadata = { title: "Face registration" };

export default async function FaceRegistrationPage() {
  await requirePermission("faces.register");
  return <FaceRegistrationListView />;
}
