// Convex Super Admin Control Plane: Fleet Vitals, Tenant Provisioning, and Global Request Tracing

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateRequestId } from "./lib/requestId";
import { encryptCredential } from "./lib/crypto";

/**
 * Super Admin: Global Fleet Overview Metrics
 */
export const getGlobalFleetMetrics = query({
  args: {},
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();
    const employees = await ctx.db.query("employees").collect();
    const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
    const activeEmployees = employees.filter((e) => e.status === "ACTIVE").length;
    const enrolledFaces = employees.filter((e) => Boolean(e.faceId)).length;

    // Recent telemetry (last 24 hours / up to 500 items)
    const recentUsage = await ctx.db.query("api_usage").order("desc").take(500);
    const successCount = recentUsage.filter((u) => u.status === "SUCCESS").length;
    const totalCalls = recentUsage.length;
    const successRate = totalCalls > 0 ? Number(((successCount / totalCalls) * 100).toFixed(1)) : 100;

    let avgLatency = 0;
    if (totalCalls > 0) {
      const sum = recentUsage.reduce((acc, curr) => acc + curr.responseTimeMs, 0);
      avgLatency = Math.round(sum / totalCalls);
    }

    return {
      totalClients: clients.length,
      activeClients,
      suspendedClients: clients.filter((c) => c.status === "SUSPENDED").length,
      totalEmployees: employees.length,
      activeEmployees,
      enrolledFaces,
      recentApiVolume: totalCalls,
      successRate,
      avgLatencyMs: avgLatency,
    };
  },
});

/**
 * Super Admin: List all enterprise client tenants
 */
export const listAllClients = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let clients = await ctx.db.query("clients").collect();

    if (args.status && args.status !== "ALL") {
      clients = clients.filter((c) => c.status === args.status);
    }

    if (args.search) {
      const q = args.search.toLowerCase();
      clients = clients.filter(
        (c) =>
          c.clientId.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.contactEmail.toLowerCase().includes(q)
      );
    }

    // Attach counts per client
    const enriched = await Promise.all(
      clients.map(async (client) => {
        const empCount = await ctx.db
          .query("employees")
          .withIndex("by_client", (q) => q.eq("clientId", client.clientId))
          .collect();

        const master = await ctx.db
          .query("masterAdmins")
          .withIndex("by_client", (q) => q.eq("clientId", client.clientId))
          .first();

        return {
          ...client,
          employeeCount: empCount.length,
          activeEmployeeCount: empCount.filter((e) => e.status === "ACTIVE").length,
          masterAdminName: master?.name || "Unassigned",
          masterAdminEmail: master?.email || "",
        };
      })
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Super Admin: Provision a new enterprise tenant client
 */
export const provisionClient = mutation({
  args: {
    clientId: v.string(), // e.g. "ABC001"
    companyName: v.string(),
    contactEmail: v.string(),
    contactPhone: v.optional(v.string()),
    subscriptionPlan: v.union(v.literal("STARTER"), v.literal("PROFESSIONAL"), v.literal("ENTERPRISE"), v.literal("CUSTOM")),
    timeZone: v.string(),
    allowedEnvironments: v.array(v.union(v.literal("DEV"), v.literal("UAT"), v.literal("PROD"))),
    faceApiKeyPlain: v.optional(v.string()),
    faceApiRegion: v.optional(v.string()),
    masterAdminName: v.string(),
    masterAdminEmail: v.string(),
    masterAdminPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Verify clientId uniqueness
    const existing = await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (existing) {
      throw new Error(`Client organization ID '${args.clientId}' already exists.`);
    }

    const now = Date.now();
    const secret = process.env.CREDENTIAL_ENCRYPTION_SECRET || "default_secret";
    const encryptedKey = args.faceApiKeyPlain ? encryptCredential(args.faceApiKeyPlain.trim(), secret) : undefined;

    // 2. Insert Client
    const clientDbId = await ctx.db.insert("clients", {
      clientId: args.clientId,
      companyName: args.companyName,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      status: "ACTIVE",
      subscriptionPlan: args.subscriptionPlan,
      timeZone: args.timeZone,
      allowedEnvironments: args.allowedEnvironments,
      faceApiKeyEncrypted: encryptedKey,
      faceApiRegion: args.faceApiRegion || "ka",
      createdAt: now,
      updatedAt: now,
    });

    // 3. Create Master Admin
    const masterId = `MASTER_${args.clientId}_001`;
    await ctx.db.insert("masterAdmins", {
      masterId,
      clientId: args.clientId,
      name: args.masterAdminName,
      email: args.masterAdminEmail,
      phone: args.masterAdminPhone,
      role: "PRIMARY_MASTER_ADMIN",
      status: "ACTIVE",
      twoFactorEnabled: false,
      createdAt: now,
    });

    // 4. Initialize Default Client Settings
    await ctx.db.insert("clientSettings", {
      clientId: args.clientId,
      officeStartTime: "09:00",
      officeEndTime: "18:00",
      lateThresholdMinutes: 15,
      timezone: args.timeZone,
      geofenceStrictEnforced: false,
      autoCheckoutAtMidnight: true,
      biometricRetentionDays: 365,
      minMatchScore: 85.0,
      maxMatchDistance: 0.35,
    });

    // 5. Initialize Default Attendance Policy
    await ctx.db.insert("attendancePolicies", {
      policyId: `pol_${args.clientId}`,
      clientId: args.clientId,
      minWorkingHoursStandard: 8,
      halfDayHours: 4,
      overtimeThresholdMinutes: 540,
      requireGeofence: false,
      allowManualCorrection: true,
      maxLateAllowedPerMonth: 3,
      updatedAt: now,
    });

    // 6. Initialize Feature Flags
    await ctx.db.insert("feature_flags", {
      clientId: args.clientId,
      faceRegistration: true,
      faceVerification: true,
      attendance: true,
      gpsValidation: true,
      reports: true,
      notifications: true,
      payrollExport: true,
      strictLiveness: false,
      apiAccess: true,
    });

    // 7. Audit Log
    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: "superadmin@platform.system",
      actorRole: "SUPER_ADMIN",
      action: "CLIENT_PROVISIONED",
      targetResource: `client:${args.clientId}`,
      outcome: "SUCCESS",
      metadata: { plan: args.subscriptionPlan, companyName: args.companyName },
      timestamp: new Date().toISOString(),
      createdAt: now,
    });

    return { clientDbId, clientId: args.clientId, masterId };
  },
});

/**
 * Super Admin: Update client status (ACTIVE, SUSPENDED, TRIAL, ARCHIVED)
 */
export const updateClientStatus = mutation({
  args: {
    clientId: v.string(),
    status: v.union(v.literal("ACTIVE"), v.literal("SUSPENDED"), v.literal("TRIAL"), v.literal("ARCHIVED")),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!client) throw new Error("Client not found.");

    await ctx.db.patch(client._id, {
      status: args.status,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: "superadmin@platform.system",
      actorRole: "SUPER_ADMIN",
      action: `CLIENT_STATUS_${args.status}`,
      targetResource: `client:${args.clientId}`,
      outcome: "SUCCESS",
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });

    return true;
  },
});

/**
 * Super Admin: Global Forensic Request ID Search
 * Reconstructs the complete lifecycle across telemetry, errors, audit, and attendance
 */
export const traceRequestId = query({
  args: { requestId: v.string() },
  handler: async (ctx, args) => {
    const cleanId = args.requestId.trim();

    // 1. Telemetry usage record
    const usage = await ctx.db
      .query("api_usage")
      .withIndex("by_request_id", (q) => q.eq("requestId", cleanId))
      .first();

    // 2. Error logs
    const errors = await ctx.db
      .query("error_logs")
      .withIndex("by_request_id", (q) => q.eq("requestId", cleanId))
      .collect();

    // 3. Audit trail
    const audits = await ctx.db
      .query("audit_logs")
      .withIndex("by_request_id", (q) => q.eq("requestId", cleanId))
      .collect();

    // 4. Attendance punches
    const attendanceRecord = await ctx.db
      .query("attendance")
      .withIndex("by_request_id", (q) => q.eq("requestId", cleanId))
      .first();

    // 5. Client details if found in usage
    let clientInfo = null;
    let employeeInfo = null;

    if (usage?.clientId) {
      clientInfo = await ctx.db
        .query("clients")
        .withIndex("by_client_id", (q) => q.eq("clientId", usage.clientId))
        .first();

      if (usage.employeeId) {
        employeeInfo = await ctx.db
          .query("employees")
          .withIndex("by_client_and_emp_id", (q) =>
            q.eq("clientId", usage.clientId).eq("employeeId", usage.employeeId!)
          )
          .first();
      }
    }

    return {
      found: Boolean(usage || errors.length > 0 || audits.length > 0 || attendanceRecord),
      requestId: cleanId,
      telemetry: usage,
      errors,
      auditLogs: audits,
      attendance: attendanceRecord,
      client: clientInfo
        ? { clientId: clientInfo.clientId, companyName: clientInfo.companyName, status: clientInfo.status }
        : null,
      employee: employeeInfo
        ? { employeeId: employeeInfo.employeeId, name: employeeInfo.name, department: employeeInfo.departmentName }
        : null,
    };
  },
});

/**
 * Super Admin: Recent Global Errors Feed
 */
export const listGlobalErrors = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const errors = await ctx.db.query("error_logs").order("desc").take(args.limit || 50);
    return errors;
  },
});

/**
 * Super Admin: Recent Global Audit Trail
 */
export const listGlobalAuditLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const audits = await ctx.db.query("audit_logs").order("desc").take(args.limit || 50);
    return audits;
  },
});
