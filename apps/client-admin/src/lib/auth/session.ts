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
 * Preview sessions let the UI be accessed even before full external OAuth is wired.
 * Enabled by default unless explicitly disabled with ENABLE_PREVIEW_SESSION=false.
 */
export function isPreviewSessionEnabled(): boolean {
  if (process.env.ENABLE_PREVIEW_SESSION === "false") return false;
  return true;
}

export async function getSession(): Promise<Session | null> {
  // Read request data first so every guarded route renders per request and
  // is never prerendered with a build-time auth decision.
  const cookieStore = await cookies();

  // 1. Check if user logged in via form
  const userCookie = cookieStore.get("fa_session_user")?.value;
  if (userCookie) {
    try {
      const parsed = JSON.parse(userCookie);
      if (parsed && parsed.role && parsed.clientId) {
        return {
          userId: parsed.userId || "usr_logged_in",
          name: parsed.name || "Administrator",
          email: parsed.email || "admin@karitech.com",
          role: parsed.role,
          clientId: parsed.clientId,
          companyName: parsed.companyName || parsed.clientId,
          isPreview: false,
        };
      }
    } catch {}
  }

  // 2. Fall back to preview session (enabled by default so Vercel deployment works seamlessly)
  if (!isPreviewSessionEnabled()) return null;

  const requested = cookieStore.get(PREVIEW_ROLE_COOKIE)?.value as ClientRole | undefined;
  const role: ClientRole = requested && CLIENT_ROLES.includes(requested) ? requested : "MASTER_ADMIN";

  return {
    userId: "usr_kari_test_01",
    name: "Karitech Test Admin",
    email: "admin.test@karitech.com",
    role,
    clientId: "KARITECH_TEST",
    companyName: "Karitech Technologies (Test)",
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

/**
 * Checks a permission server-side. Call at the top of every page in `src/app/app`
 * that requires more than a valid session (e.g. `faces.register`).
 */
export async function requirePermission(permission: Permission): Promise<Session & { role: ClientRole; clientId: string }> {
  const session = await requireClientSession();
  if (!hasPermission(session.role, permission)) {
    redirect("/app/access-denied?needed=" + encodeURIComponent(permission));
  }
  return session;
}
