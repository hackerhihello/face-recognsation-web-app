import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/roles";

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,100}$/;

/**
 * Forwards a face request to the Convex HTTP action. The Face API key never
 * reaches this app: Convex holds it and calls https://api.kalaburagitech.com.
 *
 * The tenant comes from the server session, never from the request body.
 * When the backend is not configured or unreachable this returns an error;
 * it never fabricates a successful result.
 */
export async function forwardFaceRequest(
  req: Request,
  convexPath: string,
  permission: Permission,
  /** Builds the allow-listed body Convex expects, or returns an error message. */
  buildBody: (input: Record<string, unknown>) => Record<string, unknown> | string,
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }
  if (session.isPreview || !session.clientId) {
    return NextResponse.json(
      { success: false, error: "Face services are not available for the preview identity. Sign in with a real account." },
      { status: 403 },
    );
  }
  if (!hasPermission(session.role, permission)) {
    return NextResponse.json({ success: false, error: "You don't have permission for this action." }, { status: 403 });
  }

  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl) {
    return NextResponse.json({ success: false, error: "Face service backend is not configured (CONVEX_SITE_URL)." }, { status: 503 });
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Request body must be JSON." }, { status: 400 });
  }
  // Only allow-listed fields are forwarded; any browser-supplied clientId is ignored.
  const body = buildBody(input);
  if (typeof body === "string") {
    return NextResponse.json({ success: false, error: body }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", "x-client-id": session.clientId };
    // Lets the backend return the cached result when the browser retries the same photo.
    const idempotencyKey = req.headers.get("idempotency-key");
    if (idempotencyKey && IDEMPOTENCY_KEY.test(idempotencyKey)) headers["Idempotency-Key"] = idempotencyKey;

    const res = await fetch(`${siteUrl.replace(/\/+$/, "")}${convexPath}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const data = await res.json().catch(() => ({ success: false, error: `Backend returned HTTP ${res.status}.` }));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error(`Face proxy ${convexPath} failed:`, err);
    return NextResponse.json({ success: false, error: "Face service is unreachable. Please try again later." }, { status: 502 });
  }
}
