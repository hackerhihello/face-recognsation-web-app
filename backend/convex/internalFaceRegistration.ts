// Internal Database Operations for Face Registration Workflow

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { decryptCredential } from "./lib/crypto";

/**
 * Validates employee and client before face enrollment.
 */
export const getEnrollmentContext = query({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!client) {
      throw new Error(`Client organization '${args.clientId}' not found.`);
    }

    if (client.status === "SUSPENDED" || client.status === "ARCHIVED") {
      throw new Error(`Client organization '${args.clientId}' is currently ${client.status.toLowerCase()}.`);
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) {
      throw new Error(`Employee '${args.employeeId}' does not exist in tenant '${args.clientId}'.`);
    }

    if (employee.status === "TERMINATED") {
      throw new Error(`Employee '${args.employeeId}' has been terminated.`);
    }

    // Resolve tenant API key
    let resolvedApiKey = "";
    if (client.faceApiKeyEncrypted) {
      const secret = process.env.CREDENTIAL_ENCRYPTION_SECRET || "default_secret";
      resolvedApiKey = decryptCredential(client.faceApiKeyEncrypted, secret);
    }
    if (!resolvedApiKey) {
      resolvedApiKey = process.env.FACE_API_DEFAULT_KEY || "";
    }

    return {
      client: {
        clientId: client.clientId,
        companyName: client.companyName,
        region: client.faceApiRegion || "ka",
        hasApiKey: Boolean(resolvedApiKey),
        resolvedApiKey,
      },
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        designation: employee.designation,
        empRank: employee.empRank || employee.designation,
        status: employee.status,
        biometricConsentGiven: employee.biometricConsentGiven,
      },
    };
  },
});

/**
 * Persists successful face enrollment in employee record and registration ledger.
 */
export const completeEnrollment = mutation({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
    faceEncodingId: v.number(),
    facesDetected: v.number(),
    processingTime: v.number(),
    registeredBy: v.string(),
    requestId: v.string(),
    consentConfirmed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) {
      throw new Error(`Employee '${args.employeeId}' not found.`);
    }

    const now = new Date().toISOString();
    const faceId = `face_enc_${args.faceEncodingId}`;

    // Mark previous registrations as SUPERSEDED
    const previousRegs = await ctx.db
      .query("faceRegistrations")
      .withIndex("by_client_and_employee", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .collect();

    for (const reg of previousRegs) {
      if (reg.status === "ACTIVE") {
        await ctx.db.patch(reg._id, { status: "SUPERSEDED" });
      }
    }

    // Insert new registration record
    const registrationId = `reg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    await ctx.db.insert("faceRegistrations", {
      registrationId,
      clientId: args.clientId,
      employeeId: args.employeeId,
      faceEncodingId: args.faceEncodingId,
      facesDetected: args.facesDetected,
      processingTime: args.processingTime,
      vectorStorageRef: `r2://face-vectors/${args.clientId}/${args.employeeId}/${faceId}.bin`,
      registeredBy: args.registeredBy,
      status: "ACTIVE",
      requestId: args.requestId,
      createdAt: Date.now(),
    });

    // Update employee profile
    await ctx.db.patch(employee._id, {
      status: "ACTIVE",
      faceId,
      faceEncodingId: args.faceEncodingId,
      faceRegisteredAt: now,
      biometricConsentGiven: args.consentConfirmed,
      biometricConsentDate: now,
      updatedAt: Date.now(),
    });

    return { registrationId, faceId };
  },
});
