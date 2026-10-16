import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CLIENT_ROLES, hasPermission, isClientRole, type ClientRole, type Permission, type Role } from "./roles";

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: Role;
  /** Tenant resolved by the server from the user's membership, never from the browser. */
  clientId: string | null;
  companyName: string | null;
  /** True when this is the local preview identity, not an authenticated user. */
  isPreview: boolean;
}

export const PREVIEW_ROLE_COOKIE = "fa_preview_role";

/**
 * Preview sessions let the UI be developed before real authentication is
 * wired to Convex. They are on by default in `next dev` only, and can be
 * turned on elsewhere with ENABLE_PREVIEW_SESSION=true. They only unlock
 * labelled sample data; they never reach the backend.
 */
export function isPreviewSessionEnabled(): boolean {
  if (process.env.ENABLE_PREVIEW_SESSION === "false") return false;
  if (process.env.ENABLE_PREVIEW_SESSION === "true") return true;
  return process.env.NODE_ENV === "development";
}

export async function getSession(): Promise<Session | null> {
  // Read request data first so every guarded route renders per request and
  // is never prerendered with a build-time auth decision.
  const cookieStore = await cookies();

  // TODO(auth): resolve the authenticated identity (Convex Auth / Clerk) and
  // look up the tenant membership on the server before returning a session.
  if (!isPreviewSessionEnabled()) return null;

  const requested = cookieStore.get(PREVIEW_ROLE_COOKIE)?.value as ClientRole | undefined;
  const role: ClientRole = requested && CLIENT_ROLES.includes(requested) ? requested : "MASTER_ADMIN";

  return {
    userId: "preview-user",
    name: "Preview Admin",
    email: "preview@sample.local",
    role,
    clientId: "SAMPLE",
    companyName: "Sample Company",
    isPreview: true,
  };
}

/** Server-side guard for the client admin area. */
export async function requireClientSession(): Promise<Session & { role: ClientRole; clientId: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isClientRole(session.role) || !session.clientId) redirect("/login?error=forbidden");
  return session as Session & { role: ClientRole; clientId: string };
}

/** Per-page server guard; hiding a nav item is not sufficient on its own. */
export async function requirePermission(permission: Permission) {
  const session = await requireClientSession();
  if (!hasPermission(session.role, permission)) redirect("/app/access-denied");
  return session;
}
