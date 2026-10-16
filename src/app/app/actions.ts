"use server";

import { cookies } from "next/headers";
import { CLIENT_ROLES, type ClientRole } from "@/lib/auth/roles";
import { PREVIEW_ROLE_COOKIE, isPreviewSessionEnabled } from "@/lib/auth/session";

/** Switches the preview identity's role so role-based UI can be reviewed. */
export async function setPreviewRole(role: ClientRole) {
  if (!isPreviewSessionEnabled()) throw new Error("Preview sessions are disabled.");
  if (!CLIENT_ROLES.includes(role)) throw new Error("Unknown role.");
  const cookieStore = await cookies();
  cookieStore.set(PREVIEW_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", path: "/" });
}
