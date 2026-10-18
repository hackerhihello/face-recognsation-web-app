// Convex API Token Management: UAT Sandbox & Production Metering
// SHA-256 Hashing, Masking, and Single-Exposure Secret Return

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateApiKey, sha256Hash, maskToken } from "./lib/crypto";
import { generateRequestId } from "./lib/requestId";

/**
 * Issue a new API Token (UAT or Production)
 * Returns plaintext secret ONCE. Subsequent requests only see masked strings.
 */
export const issueToken = mutation({
  args: {
    clientId: v.string(),
    masterId: v.optional(v.string()),
    name: v.string(),
    environment: v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD")),
    allocatedTokens: v.number(),
    expiresInDays: v.optional(v.number()),
    actorEmail: v.string(),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    const rawSecret = generateApiKey(args.environment);
    const tokenHash = await sha256Hash(rawSecret);
    const tokenMasked = maskToken(rawSecret);

    const tokenId = `tok_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const expiresAt = args.expiresInDays ? now + args.expiresInDays * 24 * 60 * 60 * 1000 : undefined;

    await ctx.db.insert("api_tokens", {
      tokenId,
      clientId: args.clientId,
      masterId: args.masterId,
      name: args.name,
      tokenHash,
      tokenMasked,
      environment: args.environment,
      allocatedTokens: args.allocatedTokens,
      usedTokens: 0,
      remainingTokens: args.allocatedTokens,
      status: "ACTIVE",
      expiresAt,
      createdAt: now,
    });

    // Record audit log
    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      action: "API_TOKEN_ISSUED",
      targetResource: `token:${tokenId}`,
      outcome: "SUCCESS",
      metadata: { name: args.name, environment: args.environment, quota: args.allocatedTokens },
      timestamp: new Date().toISOString(),
      createdAt: now,
    });

    // Plaintext token returned ONLY once
    return {
      tokenId,
      name: args.name,
      plaintextApiKey: rawSecret,
      tokenMasked,
      environment: args.environment,
      allocatedTokens: args.allocatedTokens,
      expiresAt,
    };
  },
});

/**
 * List masked API tokens for a tenant
 */
export const listTokens = query({
  args: {
    clientId: v.string(),
    environment: v.optional(v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD"))),
  },
  handler: async (ctx, args) => {
    let tokens = await ctx.db
      .query("api_tokens")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (args.environment) {
      tokens = tokens.filter((t) => t.environment === args.environment);
    }

    return tokens.map((t) => ({
      tokenId: t.tokenId,
      clientId: t.clientId,
      name: t.name,
      tokenMasked: t.tokenMasked,
      environment: t.environment,
      allocatedTokens: t.allocatedTokens,
      usedTokens: t.usedTokens,
      remainingTokens: t.remainingTokens,
      status: t.status,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
      lastUsedAt: t.lastUsedAt,
    }));
  },
});

/**
 * Rotate an existing API Token (Invalidates old secret, generates fresh key)
 */
export const rotateToken = mutation({
  args: {
    clientId: v.string(),
    tokenId: v.string(),
    actorEmail: v.string(),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("api_tokens")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("tokenId"), args.tokenId))
      .first();

    if (!existing) throw new Error("API Token not found.");

    const rawSecret = generateApiKey(existing.environment);
    const tokenHash = await sha256Hash(rawSecret);
    const tokenMasked = maskToken(rawSecret);

    await ctx.db.patch(existing._id, {
      tokenHash,
      tokenMasked,
      status: "ACTIVE",
    });

    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      action: "API_TOKEN_ROTATED",
      targetResource: `token:${args.tokenId}`,
      outcome: "SUCCESS",
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });

    return {
      tokenId: existing.tokenId,
      plaintextApiKey: rawSecret,
      tokenMasked,
      environment: existing.environment,
      remainingTokens: existing.remainingTokens,
    };
  },
});

/**
 * Revoke an API Token (Instantly disables access)
 */
export const revokeToken = mutation({
  args: {
    clientId: v.string(),
    tokenId: v.string(),
    actorEmail: v.string(),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("api_tokens")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("tokenId"), args.tokenId))
      .first();

    if (!existing) throw new Error("API Token not found.");

    await ctx.db.patch(existing._id, {
      status: "REVOKED",
    });

    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      action: "API_TOKEN_REVOKED",
      targetResource: `token:${args.tokenId}`,
      outcome: "SUCCESS",
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });

    return true;
  },
});

/**
 * Top Up Quota Units for an API Token
 */
export const topUpQuota = mutation({
  args: {
    clientId: v.string(),
    tokenId: v.string(),
    additionalTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("api_tokens")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("tokenId"), args.tokenId))
      .first();

    if (!existing) throw new Error("API Token not found.");

    const newAllocated = existing.allocatedTokens + args.additionalTokens;
    const newRemaining = existing.remainingTokens + args.additionalTokens;

    await ctx.db.patch(existing._id, {
      allocatedTokens: newAllocated,
      remainingTokens: newRemaining,
    });

    return { tokenId: existing.tokenId, allocatedTokens: newAllocated, remainingTokens: newRemaining };
  },
});
