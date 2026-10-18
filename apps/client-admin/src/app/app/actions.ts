"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CLIENT_ROLES, type ClientRole } from "@/lib/auth/roles";
import { PREVIEW_ROLE_COOKIE } from "@/lib/auth/session";

/** Switches the preview identity's role so role-based UI can be reviewed. */
export async function setPreviewRole(role: ClientRole) {
  if (!CLIENT_ROLES.includes(role)) throw new Error("Unknown role.");
  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });
}

/** Signs in a client admin user and creates an active session. */
export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string) || "admin.test@karitech.com";
  const clientId = (formData.get("clientId") as string) || "KARITECH_TEST";
  const role = (formData.get("role") as ClientRole) || "MASTER_ADMIN";
  const companyName =
    clientId === "KARITECH_PROD"
      ? "Karitech Technologies (Prod)"
      : clientId === "KARITECH_TEST"
      ? "Karitech Technologies (Test)"
      : clientId === "KSL042"
      ? "KSL Sburagi Tech Ltd"
      : "ABC Technologies";

  const sessionData = {
    userId: `usr_${clientId.toLowerCase()}_admin`,
    name: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    email,
    role,
    clientId,
    companyName,
    isPreview: false,
  };

  const cookieStore = await cookies();
  cookieStore.set("fa_session_user", JSON.stringify(sessionData), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect("/app/dashboard");
}

/** Signs out the active user and clears session cookies. */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("fa_session_user");
  cookieStore.delete(PREVIEW_ROLE_COOKIE);
  redirect("/login");
}
