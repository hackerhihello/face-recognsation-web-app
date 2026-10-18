// Authentication & Tenant Authorization Helpers
// Enforces strict multi-tenant isolation and role checks across all operations

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { sha256Hash } from "./crypto";

export type Role = "SUPER_ADMIN" | "MASTER_ADMIN" | "HR_ADMIN" | "DEPARTMENT_MANAGER" | "EMPLOYEE";

export interface AuthContext {
  role: Role;
  clientId?: string;
  userId?: string;
  email: string;
  name?: string;
}

/**
 * Validates tenant access: Throws error if user's tenant does not match requested tenant.
 * Super Admin bypasses tenant constraints.
 */
export function assertTenantAccess(auth: AuthContext, requestedClientId: string): void {
  if (auth.role === "SUPER_ADMIN") return;
  if (!auth.clientId || auth.clientId !== requestedClientId) {
    throw new Error(`Forbidden: Tenant isolation violation. Cannot access tenant '${requestedClientId}'.`);
  }
}

/**
 * Validates and resolves API token for programmatic REST endpoints.
 * Verifies token hash, expiration, active status, and remaining quota.
 */
export async function authenticateApiToken(
  ctx: QueryCtx | MutationCtx,
  rawToken: string,
  requiredEnv?: "DEV" | "UAT" | "PROD"
): Promise<{ tokenDoc: Doc<"api_tokens">; clientDoc: Doc<"clients"> }> {
  if (!rawToken) {
    throw new Error("Unauthorized: Missing API token header.");
  }

  const tokenHash = await sha256Hash(rawToken.trim());
  const tokenDoc = await ctx.db
    .query("api_tokens")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .first();

  if (!tokenDoc) {
    throw new Error("Unauthorized: Invalid API token credential.");
  }

  if (tokenDoc.status !== "ACTIVE") {
    throw new Error(`Unauthorized: API token is ${tokenDoc.status.toLowerCase()}.`);
  }

  if (tokenDoc.expiresAt && tokenDoc.expiresAt < Date.now()) {
    throw new Error("Unauthorized: API token has expired.");
  }

  if (requiredEnv && tokenDoc.environment !== requiredEnv) {
    throw new Error(`Forbidden: API token environment (${tokenDoc.environment}) does not match requested environment (${requiredEnv}).`);
  }

  if (tokenDoc.remainingTokens <= 0) {
    throw new Error("QuotaExceeded: API token quota has been fully exhausted (0 tokens remaining).");
  }

  const clientDoc = await ctx.db
    .query("clients")
    .withIndex("by_client_id", (q) => q.eq("clientId", tokenDoc.clientId))
    .first();

  if (!clientDoc || clientDoc.status !== "ACTIVE") {
    throw new Error(`Forbidden: Client organization '${tokenDoc.clientId}' is inactive or suspended.`);
  }

  return { tokenDoc, clientDoc };
}
