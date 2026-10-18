// SaaS Telemetry, Audit Logging, and Error Diagnostics

import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { generateRequestId } from "./lib/requestId";

/**
 * Record API usage telemetry and deduct tokens if applicable.
 */
export const recordApiUsage = mutation({
  args: {
    requestId: v.string(),
    clientId: v.string(),
    masterAdminId: v.optional(v.string()),
    employeeId: v.optional(v.string()),
    endpoint: v.string(),
    operation: v.string(),
    environment: v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD")),
    status: v.union(v.literal("SUCCESS"), v.literal("FAILED"), v.literal("DENIED")),
    httpStatus: v.number(),
    responseTimeMs: v.number(),
    tokensConsumed: v.number(),
    tokenRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const timestamp = new Date().toISOString();
    const createdAt = Date.now();

    // 1. Insert telemetry record
    const usageId = await ctx.db.insert("api_usage", {
      ...args,
      timestamp,
      createdAt,
    });

    // 2. Deduct tokens from active API token if tokenRef provided
    if (args.tokenRef && args.tokensConsumed > 0) {
      const token = await ctx.db
        .query("api_tokens")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .filter((q) => q.eq(q.field("tokenId"), args.tokenRef))
        .first();

      if (token && token.remainingTokens > 0) {
        const newUsed = token.usedTokens + args.tokensConsumed;
        const newRemaining = Math.max(0, token.allocatedTokens - newUsed);
        await ctx.db.patch(token._id, {
          usedTokens: newUsed,
          remainingTokens: newRemaining,
          lastUsedAt: createdAt,
        });
      }
    }

    return usageId;
  },
});

/**
 * Record immutable administrative and state audit trail.
 */
export const recordAuditLog = mutation({
  args: {
    requestId: v.optional(v.string()),
    clientId: v.string(),
    actorEmail: v.string(),
    actorRole: v.string(),
    action: v.string(),
    targetResource: v.string(),
    outcome: v.union(v.literal("SUCCESS"), v.literal("DENIED"), v.literal("FAILED")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const auditId = `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const requestId = args.requestId || generateRequestId();
    const timestamp = new Date().toISOString();
    const createdAt = Date.now();

    await ctx.db.insert("audit_logs", {
      auditId,
      requestId,
      clientId: args.clientId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      action: args.action,
      targetResource: args.targetResource,
      outcome: args.outcome,
      metadata: args.metadata,
      timestamp,
      createdAt,
    });

    return auditId;
  },
});

/**
 * Record system or upstream exception error trace.
 */
export const recordErrorLog = mutation({
  args: {
    requestId: v.string(),
    clientId: v.string(),
    employeeId: v.optional(v.string()),
    apiName: v.string(),
    errorCode: v.string(),
    errorMessage: v.string(),
    stackTrace: v.optional(v.string()),
    environment: v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD")),
  },
  handler: async (ctx, args) => {
    const errorId = `err_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const createdAt = Date.now();

    await ctx.db.insert("error_logs", {
      errorId,
      requestId: args.requestId,
      clientId: args.clientId,
      employeeId: args.employeeId,
      apiName: args.apiName,
      errorCode: args.errorCode,
      errorMessage: args.errorMessage,
      stackTrace: args.stackTrace,
      environment: args.environment,
      timestamp,
      createdAt,
    });

    return errorId;
  },
});

/**
 * Idempotency validation: check if request was already processed within last 24h.
 */
export const checkIdempotency = query({
  args: {
    key: v.string(),
    clientId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("idempotencyKeys")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!existing) return null;
    if (existing.expiresAt < Date.now()) return null;
    if (existing.clientId !== args.clientId) return null;

    return existing.response;
  },
});

/**
 * Save processed response under idempotency key with 24-hour expiration.
 */
export const saveIdempotency = mutation({
  args: {
    key: v.string(),
    clientId: v.string(),
    operation: v.string(),
    response: v.any(),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const expiresAt = createdAt + 24 * 60 * 60 * 1000; // 24 hours

    await ctx.db.insert("idempotencyKeys", {
      key: args.key,
      clientId: args.clientId,
      operation: args.operation,
      response: args.response,
      createdAt,
      expiresAt,
    });
  },
});
