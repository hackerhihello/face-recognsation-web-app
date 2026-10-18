// Convex Client Admin Backend: Tenant-Scoped Administration, Dashboards, and Management

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { generateRequestId } from "./lib/requestId";
import { encryptCredential } from "./lib/crypto";

/**
 * Client Details
 */
export const getClientDetails = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();
  },
});

/**
 * Dashboard Metrics for Client Admin Portal
 */
export const getDashboardMetrics = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split("T")[0];

    // Employees counts
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const activeEmployees = employees.filter((e) => e.status === "ACTIVE");
    const pendingEnrollment = employees.filter((e) => e.status === "PENDING_FACE_REGISTRATION");
    const enrolledFaces = employees.filter((e) => Boolean(e.faceId));

    // Today's attendance punches
    const punchesToday = await ctx.db
      .query("attendance")
      .withIndex("by_client_and_date", (q) =>
        q.eq("clientId", args.clientId).eq("attendanceDate", today)
      )
      .collect();

    const presentCount = punchesToday.filter((p) => p.status === "PRESENT").length;
    const lateCount = punchesToday.filter((p) => p.status === "LATE").length;
    const halfDayCount = punchesToday.filter((p) => p.status === "HALF_DAY").length;
    const currentlyInOffice = punchesToday.filter((p) => !p.checkOutTime).length;

    // Departments and shifts
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      pendingEnrollment: pendingEnrollment.length,
      enrolledFaces: enrolledFaces.length,
      enrollmentRate: employees.length > 0 ? Math.round((enrolledFaces.length / employees.length) * 100) : 0,
      todayStats: {
        totalPunches: punchesToday.length,
        present: presentCount,
        late: lateCount,
        halfDay: halfDayCount,
        currentlyInOffice,
        attendanceRate: activeEmployees.length > 0 ? Math.round((punchesToday.length / activeEmployees.length) * 100) : 0,
      },
      departmentsCount: departments.length,
      activeShiftsCount: shifts.filter((s) => s.status === "ACTIVE").length,
    };
  },
});

/**
 * Employees Management
 */
export const listEmployees = query({
  args: {
    clientId: v.string(),
    departmentId: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let employees = await ctx.db
      .query("employees")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (args.departmentId && args.departmentId !== "ALL") {
      employees = employees.filter((e) => e.departmentId === args.departmentId);
    }

    if (args.status && args.status !== "ALL") {
      employees = employees.filter((e) => e.status === args.status);
    }

    if (args.search) {
      const q = args.search.toLowerCase();
      employees = employees.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
      );
    }

    return employees.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getEmployeeByEmpId = query({
  args: { clientId: v.string(), employeeId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();
  },
});

export const createEmployee = mutation({
  args: {
    clientId: v.string(),
    masterId: v.string(),
    employeeId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    departmentId: v.string(),
    departmentName: v.string(),
    designation: v.string(),
    empRank: v.optional(v.string()),
    shiftId: v.optional(v.string()),
    actorEmail: v.string(),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate employee ID within tenant
    const existing = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (existing) {
      throw new Error(`Employee with ID '${args.employeeId}' already exists in tenant '${args.clientId}'.`);
    }

    const now = Date.now();
    const id = await ctx.db.insert("employees", {
      employeeId: args.employeeId,
      clientId: args.clientId,
      masterId: args.masterId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      departmentId: args.departmentId,
      departmentName: args.departmentName,
      designation: args.designation,
      empRank: args.empRank || args.designation,
      shiftId: args.shiftId,
      biometricConsentGiven: false,
      status: "PENDING_FACE_REGISTRATION",
      createdAt: now,
      updatedAt: now,
    });

    // Increment department headcount
    const dept = await ctx.db
      .query("departments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .filter((q) => q.eq(q.field("departmentId"), args.departmentId))
      .first();

    if (dept) {
      await ctx.db.patch(dept._id, { headcount: dept.headcount + 1 });
    }

    // Audit log
    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      action: "EMPLOYEE_CREATED",
      targetResource: `employee:${args.employeeId}`,
      outcome: "SUCCESS",
      metadata: { name: args.name, department: args.departmentName },
      timestamp: new Date().toISOString(),
      createdAt: now,
    });

    return id;
  },
});

export const updateEmployee = mutation({
  args: {
    clientId: v.string(),
    employeeId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    departmentId: v.optional(v.string()),
    departmentName: v.optional(v.string()),
    designation: v.optional(v.string()),
    shiftId: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("ACTIVE"), v.literal("PENDING_FACE_REGISTRATION"), v.literal("TERMINATED"))
    ),
    actorEmail: v.string(),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    const employee = await ctx.db
      .query("employees")
      .withIndex("by_client_and_emp_id", (q) =>
        q.eq("clientId", args.clientId).eq("employeeId", args.employeeId)
      )
      .first();

    if (!employee) throw new Error("Employee not found.");

    const patch: any = { updatedAt: Date.now() };
    if (args.name) patch.name = args.name;
    if (args.email) patch.email = args.email;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.departmentId) patch.departmentId = args.departmentId;
    if (args.departmentName) patch.departmentName = args.departmentName;
    if (args.designation) patch.designation = args.designation;
    if (args.shiftId !== undefined) patch.shiftId = args.shiftId;
    if (args.status) patch.status = args.status;

    await ctx.db.patch(employee._id, patch);

    // Audit log
    await ctx.db.insert("audit_logs", {
      auditId: `aud_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      requestId: generateRequestId(),
      clientId: args.clientId,
      actorEmail: args.actorEmail,
      actorRole: args.actorRole,
      action: "EMPLOYEE_UPDATED",
      targetResource: `employee:${args.employeeId}`,
      outcome: "SUCCESS",
      metadata: patch,
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
    });

    return true;
  },
});

/**
 * Departments Management
 */
export const listDepartments = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("departments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const createDepartment = mutation({
  args: {
    clientId: v.string(),
    name: v.string(),
    managerName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const departmentId = `dept_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    return ctx.db.insert("departments", {
      departmentId,
      clientId: args.clientId,
      name: args.name,
      managerName: args.managerName,
      headcount: 0,
      createdAt: Date.now(),
    });
  },
});

/**
 * Shifts Management
 */
export const listShifts = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("shifts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const createShift = mutation({
  args: {
    clientId: v.string(),
    name: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    gracePeriodMinutes: v.number(),
    halfDayThresholdMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const shiftId = `shift_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    return ctx.db.insert("shifts", {
      shiftId,
      clientId: args.clientId,
      name: args.name,
      startTime: args.startTime,
      endTime: args.endTime,
      gracePeriodMinutes: args.gracePeriodMinutes,
      halfDayThresholdMinutes: args.halfDayThresholdMinutes,
      assignedEmployeesCount: 0,
      status: "ACTIVE",
      createdAt: Date.now(),
    });
  },
});

/**
 * Locations & Geofences
 */
export const listLocations = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("locations")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const createLocation = mutation({
  args: {
    clientId: v.string(),
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    allowedRadiusMeters: v.number(),
  },
  handler: async (ctx, args) => {
    const locationId = `loc_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;
    return ctx.db.insert("locations", {
      locationId,
      clientId: args.clientId,
      name: args.name,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      allowedRadiusMeters: args.allowedRadiusMeters,
      status: "ACTIVE",
      createdAt: Date.now(),
    });
  },
});

/**
 * Settings and Policies
 */
export const getSettings = query({
  args: { clientId: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("clientSettings")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    const policy = await ctx.db
      .query("attendancePolicies")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    const flags = await ctx.db
      .query("feature_flags")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    return { settings, policy, flags };
  },
});

export const updateSettings = mutation({
  args: {
    clientId: v.string(),
    officeStartTime: v.optional(v.string()),
    officeEndTime: v.optional(v.string()),
    lateThresholdMinutes: v.optional(v.number()),
    timezone: v.optional(v.string()),
    geofenceStrictEnforced: v.optional(v.boolean()),
    minMatchScore: v.optional(v.number()),
    maxMatchDistance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let settings = await ctx.db
      .query("clientSettings")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!settings) {
      const id = await ctx.db.insert("clientSettings", {
        clientId: args.clientId,
        officeStartTime: args.officeStartTime || "09:00",
        officeEndTime: args.officeEndTime || "18:00",
        lateThresholdMinutes: args.lateThresholdMinutes || 15,
        timezone: args.timezone || "Asia/Kolkata",
        geofenceStrictEnforced: args.geofenceStrictEnforced ?? false,
        autoCheckoutAtMidnight: true,
        biometricRetentionDays: 365,
        minMatchScore: args.minMatchScore || 85.0,
        maxMatchDistance: args.maxMatchDistance || 0.35,
      });
      return id;
    }

    const patch: any = {};
    if (args.officeStartTime) patch.officeStartTime = args.officeStartTime;
    if (args.officeEndTime) patch.officeEndTime = args.officeEndTime;
    if (args.lateThresholdMinutes !== undefined) patch.lateThresholdMinutes = args.lateThresholdMinutes;
    if (args.timezone) patch.timezone = args.timezone;
    if (args.geofenceStrictEnforced !== undefined) patch.geofenceStrictEnforced = args.geofenceStrictEnforced;
    if (args.minMatchScore !== undefined) patch.minMatchScore = args.minMatchScore;
    if (args.maxMatchDistance !== undefined) patch.maxMatchDistance = args.maxMatchDistance;

    await ctx.db.patch(settings._id, patch);
    return true;
  },
});

/**
 * Configure Face API Credentials for Tenant
 */
export const updateTenantFaceApiKey = mutation({
  args: {
    clientId: v.string(),
    plainApiKey: v.string(),
    region: v.optional(v.string()),
    actorRole: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.actorRole !== "SUPER_ADMIN" && args.actorRole !== "MASTER_ADMIN") {
      throw new Error("Unauthorized to configure biometric credentials.");
    }

    const client = await ctx.db
      .query("clients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .first();

    if (!client) throw new Error("Client not found.");

    const masterSecret = process.env.CREDENTIAL_ENCRYPTION_SECRET || "default_secret";
    const encrypted = encryptCredential(args.plainApiKey.trim(), masterSecret);

    await ctx.db.patch(client._id, {
      faceApiKeyEncrypted: encrypted,
      faceApiRegion: args.region || "ka",
      updatedAt: Date.now(),
    });

    return { success: true, maskedPreview: args.plainApiKey.slice(0, 4) + "..." + args.plainApiKey.slice(-4) };
  },
});

/**
 * Client-Scoped Audit Logs & Usage
 */
export const listAuditLogs = query({
  args: { clientId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    logs.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? logs.slice(0, args.limit) : logs;
  },
});

export const listApiUsage = query({
  args: { clientId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("api_usage")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    usage.sort((a, b) => b.createdAt - a.createdAt);
    return args.limit ? usage.slice(0, args.limit) : usage;
  },
});
